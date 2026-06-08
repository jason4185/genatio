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

        result = self._verify_campaign(
            wallet_address,
            title,
            story,
            goal_usd,
            github_repo_url,
            github_file_url,
            live_url,
            upload_url_1,
            upload_url_2,
            upload_url_3,
            community_url,
            funding_purpose
        )

        if "REJECTED" in result:
            reason_map = {
                "REJECTED:not_english": "English only",
                "REJECTED:wallet_too_new": "Wallet too new on both chains",
                "REJECTED:no_repo": "GitHub repository not found or private",
                "REJECTED:repo_too_new": "Repository is less than 7 days old"
            }
            reason = reason_map.get(result, "Verification failed")
            return json.dumps({"status": "rejected", "reason": reason})

        try:
            score = u256(result) if result.isdigit() else u256(0)
        except:
            score = u256(0)

        if u256(score) >= u256(85):
            status = "active"
        elif u256(score) >= u256(50):
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
                "goal_usd": str(goal_usd),
                "raised_usd": "0",
                "escrowed_usd": "0",
                "released_usd": "0",
                "github_repo_url": github_repo_url,
                "github_file_url": github_file_url,
                "live_url": live_url,
                "upload_url_1": upload_url_1,
                "upload_url_2": upload_url_2,
                "upload_url_3": upload_url_3,
                "community_url": community_url,
                "funding_purpose": funding_purpose,
                "status": status,
                "score": str(score),
                "donor_count": "0",
                "chains_used": [],
                "milestones": [],
                "milestone_stage": "0"
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

        campaign["raised_usd"] = str(u256(campaign["raised_usd"]) + u256(amount_usd))
        campaign["donor_count"] = str(u256(campaign["donor_count"]) + u256(1))
        if chain not in campaign["chains_used"]:
            campaign["chains_used"].append(chain)

        # Escrow logic
        # Under $1000 — release immediately
        # $1000 and above — hold in escrow, release by milestones
        if u256(campaign["goal_usd"]) < u256(1000):
            campaign["released_usd"] = str(u256(campaign["released_usd"]) + u256(amount_usd))
        else:
            campaign["escrowed_usd"] = str(u256(campaign["escrowed_usd"]) + u256(amount_usd))

        self.campaigns[campaign_id] = json.dumps(campaign)
        self.donations.append(json.dumps({
            "campaign_id": campaign_id,
            "wallet": wallet_address,
            "amount_token": amount_token,
            "amount_usd": str(amount_usd),
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
        if u256(campaign["goal_usd"]) < u256(1000):
            return json.dumps({"status": "error", "reason": "Milestones only apply to grants above $1000"})
        if u256(campaign["escrowed_usd"]) == u256(0):
            return json.dumps({"status": "error", "reason": "Nothing in escrow"})

        stage = u256(campaign["milestone_stage"])

        # AI verifies proof document and GitHub progress
        def verify_milestone():
            return gl.nondet.exec_prompt(
                f"""You are verifying a milestone proof for an open source project grant.

Project title: {campaign['title']}
What they promised to build: {campaign['funding_purpose']}
GitHub repo: {campaign['github_repo_url']}
Milestone stage: {u256(stage) + u256(1)} of 3

Creator submitted this proof document: {proof_url}

Do the following:
1. Fetch and read the proof document at {proof_url}
2. Fetch recent commits at {campaign['github_repo_url']}/commits
3. Check if real code progress has been made since the last milestone
4. Check if the proof document matches what was promised in the funding purpose

Reply only APPROVED or REJECTED with one sentence reason."""
            )
        verification = gl.eq_principle.prompt_comparative(
            verify_milestone,
            "Both outputs are equivalent if both say APPROVED or both say REJECTED"
        )

        if "APPROVED" not in verification.upper():
            return json.dumps({
                "status": "rejected",
                "reason": verification,
                "message": "Milestone not approved. Improve your proof and resubmit."
            })

        # Release percentages: stage 0 = 30%, stage 1 = 40%, stage 2 = 30%
        if stage == u256(0):
            release_amount = u256(campaign["escrowed_usd"]) * u256(30) // u256(100)
        elif stage == u256(1):
            release_amount = u256(campaign["escrowed_usd"]) * u256(40) // u256(100)
        else:
            release_amount = u256(campaign["escrowed_usd"]) * u256(30) // u256(100)

        campaign["released_usd"] = str(u256(campaign["released_usd"]) + release_amount)
        campaign["escrowed_usd"] = str(u256(campaign["escrowed_usd"]) - release_amount)
        campaign["milestone_stage"] = str(u256(campaign["milestone_stage"]) + u256(1))
        campaign["milestones"].append({
            "stage": str(u256(stage) + u256(1)),
            "proof_url": proof_url,
            "amount_released": str(release_amount),
            "verification": verification
        })

        if u256(campaign["milestone_stage"]) >= u256(3):
            campaign["status"] = "completed"

        self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({
            "status": "success",
            "amount_released": str(release_amount),
            "stage": str(u256(stage) + u256(1)),
            "next_stage": str(u256(stage) + u256(2)) if u256(stage) + u256(1) < u256(3) else None
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
        if u256(wallet_score) < u256(20):
            return json.dumps({"status": "error", "reason": "Wallet too new to vouch"})

        already = [v for v in self.vouches if json.loads(v)["campaign_id"] == campaign_id and json.loads(v)["wallet"] == wallet_address]
        if already:
            return json.dumps({"status": "error", "reason": "Already vouched"})

        self.vouches.append(json.dumps({"campaign_id": campaign_id, "wallet": wallet_address}))

        campaign_vouches = [v for v in self.vouches if json.loads(v)["campaign_id"] == campaign_id]
        if len(campaign_vouches) >= 5:
            campaign["status"] = "active"

        self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({"status": "success", "vouch_count": str(len(campaign_vouches))})

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

        def resolve():
            return gl.nondet.exec_prompt(
                f"""You are resolving a dispute for an open source grant campaign.

Campaign title: {campaign['title']}
Campaign story: {campaign['story']}
GitHub repo: {campaign['github_repo_url']}
Live URL: {campaign['live_url']}
Dispute evidence: {dispute['evidence_url']}

Fetch and read the dispute evidence URL and the campaign details.
Is the dispute valid? Reply only VALID or INVALID with one sentence reason."""
            )
        resolution = gl.eq_principle.prompt_comparative(
            resolve,
            "Both outputs are equivalent if both say VALID or both say INVALID"
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

    def _verify_campaign(
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
        def verify():
            return gl.nondet.exec_prompt(
                f"""You are verifying an open source project grant application on Genatio.
Be thorough, honest, and strict. Follow every instruction exactly.

=== STEP 1: LANGUAGE CHECK ===
Read the title and story below.
If they are NOT written in English reply exactly: REJECTED:not_english
Title: {title}
Story: {story}

=== STEP 2: WALLET TRUST CHECK ===
Wallet address: {wallet_address}

Check Bradbury testnet activity:
Fetch: https://explorer-bradbury.genlayer.com/address/{wallet_address}
Score wallet age on Bradbury:
2 to 3 months = 20pts
1 to 2 months = 15pts
2 weeks to 1 month = 10pts
1 to 2 weeks = 5pts
Under 1 week = 0pts

Check Ethereum Mainnet via Etherscan:
Fetch: https://api.etherscan.io/api?module=account&action=txlist&address={wallet_address}&sort=asc
Score wallet age on Ethereum same as above.
Score Ethereum transaction count:
Over 100 = 20pts
50 to 100 = 15pts
20 to 50 = 10pts
10 to 20 = 5pts
Under 10 = 2pts
Zero = 0pts

Take the best age score from either chain.
Add transaction score from Ethereum.
If BOTH chains show wallet age under 1 week reply exactly: REJECTED:wallet_too_new
Wallet trust score maximum = 80pts. Note it as WALLET_SCORE.

=== STEP 3: PROJECT VERIFICATION ===
Fetch and read each URL:
GitHub repo: {github_repo_url}
Specific file: {github_file_url}
Live URL: {live_url}
Screenshot 1: {upload_url_1}
Screenshot 2: {upload_url_2}
Screenshot 3: {upload_url_3}
Community link: {community_url}

Score each factor:

Factor 1 — Repo exists and is public:
Exists and public = 20pts
Not found or private = 0pts
If 0pts reply exactly: REJECTED:no_repo

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
Under 7 days reply exactly: REJECTED:repo_too_new

Factor 9 — Community proof:
Real active community = 10pts
Small but real = 5pts
No community = 0pts

Factor 10 — Wallet trust score:
Take WALLET_SCORE from Step 2.
Normalize to max 10pts: WALLET_SCORE / 8 rounded down.

Add all factor scores. Maximum project score = 135pts.
Normalize to 100: (total / 135) * 100 rounded down.

=== FINAL REPLY ===
If any REJECTED condition was triggered reply exactly with that rejection string.
Otherwise reply with only a number between 0 and 100. Nothing else."""
            )

        result = gl.eq_principle.prompt_comparative(
            verify,
            "Both outputs are equivalent if both are the same REJECTED code, or if both produce a score that falls in the same tier: below 50, between 50 and 84, or 85 and above"
        )
        return result
