# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class Genatio(gl.Contract):
    campaigns: TreeMap[str, str]
    donations: DynArray[str]
    disputes: DynArray[str]
    blacklist: DynArray[str]
    vouches: DynArray[str]

    def __init__(self):
        pass

    @gl.public.write
    def create_campaign(
        self,
        wallet_address: str,
        title: str,
        story: str,
        goal_usd: int,
        github_repo_url: str,
        github_file_url: str,
        live_url: str,
        upload_url_1: str,
        upload_url_2: str,
        upload_url_3: str,
        community_url: str,
        funding_purpose: str
    ) -> str:
        # Blacklist check
        if wallet_address in self.blacklist:
            return json.dumps({"status": "rejected", "reason": "Wallet is blacklisted"})

        # Duplicate check
        active = [json.loads(v) for v in self.campaigns.values() if json.loads(v)["wallet"] == wallet_address and json.loads(v)["status"] in ["active", "vouching"]]
        if len(active) >= 2:
            return json.dumps({"status": "rejected", "reason": "You already have 2 active campaigns"})

        # English check
        english_check = gl.nondet.exec_prompt(
            f"Is this text written in English? Reply only YES or NO.\n\nTitle: {title}\n\nStory: {story}"
        )
        if "NO" in english_check.upper():
            return json.dumps({"status": "rejected", "reason": "English only"})

        # Story length check
        if len(story.split()) < 100:
            return json.dumps({"status": "rejected", "reason": "Story must be at least 100 words"})

        # Wallet score check
        wallet_score = self._get_wallet_score(wallet_address)
        if wallet_score == -1:
            return json.dumps({"status": "rejected", "reason": "Wallet too new on both chains"})

        # Open source verification
        score = self._verify_open_source(
            wallet_address,
            wallet_score,
            github_repo_url,
            github_file_url,
            live_url,
            upload_url_1,
            upload_url_2,
            upload_url_3,
            community_url,
            funding_purpose
        )

        if score >= 85:
            status = "active"
        elif score >= 50:
            status = "vouching"
        else:
            status = "rejected"

        campaign_id = str(len(self.campaigns) + 1)

        if status != "rejected":
            campaign = {
                "id": campaign_id,
                "wallet": wallet_address,
                "title": title,
                "story": story,
                "goal_usd": goal_usd,
                "raised_usd": 0,
                "escrowed_usd": 0,
                "released_usd": 0,
                "github_repo_url": github_repo_url,
                "github_file_url": github_file_url,
                "live_url": live_url,
                "upload_url_1": upload_url_1,
                "upload_url_2": upload_url_2,
                "upload_url_3": upload_url_3,
                "community_url": community_url,
                "funding_purpose": funding_purpose,
                "status": status,
                "score": score,
                "donor_count": 0,
                "chains_used": [],
                "milestones": [],
                "milestone_stage": 0
            }
            self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({
            "status": status,
            "score": score,
            "campaign_id": campaign_id if status != "rejected" else None,
            "reason": None if status != "rejected" else "Score too low. Improve your evidence and resubmit."
        })

    @gl.public.write
    def donate(
        self,
        wallet_address: str,
        campaign_id: str,
        amount_token: str,
        amount_usd: int,
        chain: str,
        tx_hash: str
    ) -> str:
        campaign = json.loads(self.campaigns[campaign_id]) if campaign_id in self.campaigns else None
        if not campaign:
            return json.dumps({"status": "error", "reason": "Campaign not found"})
        if campaign["status"] != "active":
            return json.dumps({"status": "error", "reason": "Campaign not active"})

        campaign["raised_usd"] += amount_usd
        campaign["donor_count"] += 1
        if chain not in campaign["chains_used"]:
            campaign["chains_used"].append(chain)

        # Escrow logic
        # Under $1000 — release immediately
        # $1000 and above — hold in escrow, release by milestones
        if campaign["goal_usd"] < 1000:
            campaign["released_usd"] += amount_usd
        else:
            campaign["escrowed_usd"] += amount_usd

        self.campaigns[campaign_id] = json.dumps(campaign)
        self.donations.append(json.dumps({
            "campaign_id": campaign_id,
            "wallet": wallet_address,
            "amount_token": amount_token,
            "amount_usd": amount_usd,
            "chain": chain,
            "tx_hash": tx_hash
        }))

        return json.dumps({"status": "success"})

    @gl.public.write
    def release_milestone(
        self,
        wallet_address: str,
        campaign_id: str,
        proof_url: str
    ) -> str:
        campaign = json.loads(self.campaigns[campaign_id]) if campaign_id in self.campaigns else None
        if not campaign:
            return json.dumps({"status": "error", "reason": "Campaign not found"})
        if campaign["wallet"] != wallet_address:
            return json.dumps({"status": "error", "reason": "Not your campaign"})
        if campaign["goal_usd"] < 1000:
            return json.dumps({"status": "error", "reason": "Milestones only apply to grants above $1000"})
        if campaign["escrowed_usd"] == 0:
            return json.dumps({"status": "error", "reason": "Nothing in escrow"})

        stage = campaign["milestone_stage"]

        # AI verifies proof document and GitHub progress
        verification = gl.nondet.exec_prompt(
            f"""You are verifying a milestone proof for an open source project grant.

Project title: {campaign['title']}
What they promised to build: {campaign['funding_purpose']}
GitHub repo: {campaign['github_repo_url']}
Milestone stage: {stage + 1} of 3

Creator submitted this proof document: {proof_url}

Do the following:
1. Fetch and read the proof document at {proof_url}
2. Fetch recent commits at {campaign['github_repo_url']}/commits
3. Check if real code progress has been made since the last milestone
4. Check if the proof document matches what was promised in the funding purpose

Reply only APPROVED or REJECTED with one sentence reason."""
        )

        if "APPROVED" not in verification.upper():
            return json.dumps({
                "status": "rejected",
                "reason": verification,
                "message": "Milestone not approved. Improve your proof and resubmit."
            })

        # Release percentages: stage 0 = 30%, stage 1 = 40%, stage 2 = 30%
        percentages = [0.30, 0.40, 0.30]
        release_amount = int(campaign["escrowed_usd"] * percentages[stage])

        campaign["released_usd"] += release_amount
        campaign["escrowed_usd"] -= release_amount
        campaign["milestone_stage"] += 1
        campaign["milestones"].append({
            "stage": stage + 1,
            "proof_url": proof_url,
            "amount_released": release_amount,
            "verification": verification
        })

        if campaign["milestone_stage"] >= 3:
            campaign["status"] = "completed"

        self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({
            "status": "success",
            "amount_released": release_amount,
            "stage": stage + 1,
            "next_stage": stage + 2 if stage + 1 < 3 else None
        })

    @gl.public.write
    def vouch_campaign(
        self,
        wallet_address: str,
        campaign_id: str
    ) -> str:
        campaign = json.loads(self.campaigns[campaign_id]) if campaign_id in self.campaigns else None
        if not campaign:
            return json.dumps({"status": "error", "reason": "Campaign not found"})
        if campaign["status"] != "vouching":
            return json.dumps({"status": "error", "reason": "Campaign not in vouching state"})

        wallet_score = self._get_wallet_score(wallet_address)
        if wallet_score < 20:
            return json.dumps({"status": "error", "reason": "Wallet too new to vouch"})

        already = [v for v in self.vouches if json.loads(v)["campaign_id"] == campaign_id and json.loads(v)["wallet"] == wallet_address]
        if already:
            return json.dumps({"status": "error", "reason": "Already vouched"})

        self.vouches.append(json.dumps({"campaign_id": campaign_id, "wallet": wallet_address}))

        campaign_vouches = [v for v in self.vouches if json.loads(v)["campaign_id"] == campaign_id]
        if len(campaign_vouches) >= 5:
            campaign["status"] = "active"

        self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({"status": "success", "vouch_count": len(campaign_vouches)})

    @gl.public.write
    def raise_dispute(
        self,
        wallet_address: str,
        campaign_id: str,
        evidence_url: str
    ) -> str:
        campaign = json.loads(self.campaigns[campaign_id]) if campaign_id in self.campaigns else None
        if not campaign:
            return json.dumps({"status": "error", "reason": "Campaign not found"})

        dispute_id = str(len(self.disputes) + 1)
        self.disputes.append(json.dumps({
            "id": dispute_id,
            "campaign_id": campaign_id,
            "raised_by": wallet_address,
            "evidence_url": evidence_url,
            "status": "open"
        }))

        campaign["status"] = "disputed"
        self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({"status": "success", "dispute_id": dispute_id})

    @gl.public.write
    def resolve_dispute(
        self,
        wallet_address: str,
        campaign_id: str
    ) -> str:
        campaign = json.loads(self.campaigns[campaign_id]) if campaign_id in self.campaigns else None

        dispute = None
        dispute_index = -1
        for i in range(len(self.disputes)):
            d = json.loads(self.disputes[i])
            if d["campaign_id"] == campaign_id and d["status"] == "open":
                dispute = d
                dispute_index = i
                break

        if not campaign or not dispute:
            return json.dumps({"status": "error", "reason": "Not found"})

        resolution = gl.nondet.exec_prompt(
            f"""You are resolving a dispute for an open source grant campaign.

Campaign title: {campaign['title']}
Campaign story: {campaign['story']}
GitHub repo: {campaign['github_repo_url']}
Live URL: {campaign['live_url']}
Dispute evidence: {dispute['evidence_url']}

Fetch and read the dispute evidence URL and the campaign details.
Is the dispute valid? Reply only VALID or INVALID with one sentence reason."""
        )

        if "VALID" in resolution.upper():
            campaign["status"] = "rejected"
            if campaign["wallet"] not in self.blacklist:
                self.blacklist.append(campaign["wallet"])
        else:
            campaign["status"] = "active"

        dispute["status"] = "resolved"
        dispute["resolution"] = resolution
        self.disputes[dispute_index] = json.dumps(dispute)

        self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({"status": "success", "resolution": resolution})

    # ─── VIEW METHODS ───

    @gl.public.view
    def get_campaigns(self, status: str) -> str:
        campaigns = [json.loads(v) for v in self.campaigns.values()]
        if status:
            campaigns = [c for c in campaigns if c["status"] == status]
        return json.dumps(campaigns)

    @gl.public.view
    def get_campaign(self, campaign_id: str) -> str:
        return json.dumps(json.loads(self.campaigns[campaign_id])) if campaign_id in self.campaigns else json.dumps(None)

    @gl.public.view
    def get_donations(self, campaign_id: str) -> str:
        return json.dumps([json.loads(d) for d in self.donations if json.loads(d)["campaign_id"] == campaign_id])

    @gl.public.view
    def get_vouches(self, campaign_id: str) -> str:
        return json.dumps([json.loads(v) for v in self.vouches if json.loads(v)["campaign_id"] == campaign_id])

    @gl.public.view
    def get_dispute(self, campaign_id: str) -> str:
        disputes = [json.loads(d) for d in self.disputes if json.loads(d)["campaign_id"] == campaign_id]
        return json.dumps(disputes[0] if disputes else None)

    @gl.public.view
    def get_blacklist(self) -> str:
        return json.dumps(list(self.blacklist))

    # ─── INTERNAL METHODS ───

    def _get_wallet_score(self, wallet_address: str) -> int:
        result = gl.nondet.exec_prompt(
            f"""Check wallet age and activity for address: {wallet_address}

Check 1 — Bradbury testnet:
Fetch: https://bradbury.genlayer.com/api/wallet/{wallet_address}
Score wallet age:
2 to 3 months = 20pts
1 to 2 months = 15pts
2 weeks to 1 month = 10pts
1 to 2 weeks = 5pts
Under 1 week = 0pts

Check 2 — Ethereum Mainnet via Etherscan:
Fetch: https://api.etherscan.io/api?module=account&action=txlist&address={wallet_address}&sort=asc
Score wallet age same as above.
Score transaction count:
Over 100 = 20pts
50 to 100 = 15pts
20 to 50 = 10pts
10 to 20 = 5pts
Under 10 = 2pts
Zero = 0pts

If BOTH chains show under 1 week age reply: REJECTED
Otherwise reply with total score as a number only. Maximum 80."""
        )

        if "REJECTED" in result.upper():
            return -1
        try:
            return int(''.join(filter(str.isdigit, result)))
        except:
            return 10

    def _verify_open_source(
        self,
        wallet_address: str,
        wallet_score: int,
        github_repo_url: str,
        github_file_url: str,
        live_url: str,
        upload_url_1: str,
        upload_url_2: str,
        upload_url_3: str,
        community_url: str,
        funding_purpose: str
    ) -> int:
        result = gl.nondet.exec_prompt(
            f"""You are verifying an open source project grant application. Score each factor honestly.

GITHUB REPO: {github_repo_url}
SPECIFIC FILE: {github_file_url}
LIVE URL: {live_url}
SCREENSHOT 1: {upload_url_1}
SCREENSHOT 2: {upload_url_2}
SCREENSHOT 3: {upload_url_3}
COMMUNITY LINK: {community_url}
FUNDING PURPOSE: {funding_purpose}

Fetch and read each URL provided. Then score:

Factor 1 — Repo exists and is public:
Exists and public = 20pts
Not found or private = 0pts (AUTO REJECTION if 0)

Factor 2 — Commit activity:
Last 30 days = 20pts
Last 90 days = 14pts
Last 180 days = 6pts
Older = 0pts

Factor 3 — README quality:
Detailed and clear = 15pts
Basic = 7pts
Empty = 0pts

Factor 4 — License present:
Exists = 10pts
Not present = 0pts

Factor 5 — Specific file readable:
Submitted and readable = 15pts
Not submitted = 3pts

Factor 6 — Live URL accessible:
Loads with real content = 15pts
Loads but sparse = 7pts
Does not load = 0pts

Factor 7 — Funding purpose specific:
Very specific deliverables = 20pts
Somewhat specific = 10pts
Vague = 0pts

Factor 8 — Repo age:
Over 90 days = 10pts
30 to 90 days = 7pts
7 to 30 days = 3pts
Under 7 days = AUTO REJECTION

Factor 9 — Community proof:
Real active community = 10pts
Small but real = 5pts
No community = 0pts

Factor 10 — Wallet score (already calculated): {wallet_score}
Normalize to max 10pts.

If AUTO REJECTION triggered reply: REJECTED
Otherwise reply with total score as a number only. Maximum 135. Then normalize to 100."""
        )

        if "REJECTED" in result.upper():
            return 0
        try:
            score = int(''.join(filter(str.isdigit, result.split('\n')[-1])))
            return min(score, 100)
        except:
            return 0
