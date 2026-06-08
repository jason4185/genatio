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
        goal_usd: u256,
        duration_days: u256,
        github_repo_url: str,
        github_file_url: str,
        live_url: str,
        upload_url_1: str,
        upload_url_2: str,
        upload_url_3: str,
        funding_purpose: str
    ) -> str:
        # Blacklist check
        if wallet_address in self.blacklist:
            return json.dumps({"status": "rejected", "reason": "Wallet is blacklisted"})

        # Duplicate check
        active = [json.loads(v) for v in self.campaigns.values() if json.loads(v)["wallet"] == wallet_address and json.loads(v)["status"] in ["active", "vouching"]]
        if len(active) >= 2:
            return json.dumps({"status": "rejected", "reason": "You already have 2 active campaigns"})

        if duration_days != u256(7) and duration_days != u256(14) and duration_days != u256(30):
            return json.dumps({"status": "rejected", "reason": "Invalid duration. Choose 7, 14, or 30 days"})

        result = self._verify_campaign(
            wallet_address,
            title,
            story,
            github_repo_url,
            github_file_url,
            live_url,
            upload_url_1,
            upload_url_2,
            upload_url_3,
            funding_purpose
        )

        if "REJECTED" in result:
            reason_map = {
                "REJECTED:not_english": "English only",
                "REJECTED:wallet_too_new": "Wallet too new on both chains",
                "REJECTED:no_repo": "GitHub repository not found or private",
                "REJECTED:repo_too_new": "Repository is less than 7 days old"
            }
            reason = reason_map.get(result.strip(), "Verification failed")
            return json.dumps({"status": "rejected", "reason": reason})

        try:
            score = u256(result.strip()) if result.strip().isdigit() else u256(0)
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
                "duration_days": str(duration_days),
                "raised_usd": "0",
                "github_repo_url": github_repo_url,
                "github_file_url": github_file_url,
                "live_url": live_url,
                "upload_url_1": upload_url_1,
                "upload_url_2": upload_url_2,
                "upload_url_3": upload_url_3,
                "funding_purpose": funding_purpose,
                "status": status,
                "score": str(score),
                "donor_count": "0",
                "chains_used": []
            }
            self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({
            "status": status,
            "score": str(score),
            "campaign_id": campaign_id if status != "rejected" else None,
            "reason": None if status != "rejected" else "Score too low. Improve your evidence and resubmit."
        })

    @gl.public.write
    def donate(
        self,
        wallet_address: str,
        campaign_id: str,
        amount_token: str,
        amount_usd: u256,
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

        def get_wallet_score():
            bradbury_data = gl.nondet.web.render(f"https://explorer-bradbury.genlayer.com/address/{wallet_address}", mode="text")
            eth_data = gl.nondet.web.render(f"https://api.etherscan.io/api?module=account&action=txlist&address={wallet_address}&sort=asc", mode="text")
            return gl.nondet.exec_prompt(
                f"""Check wallet age for address: {wallet_address}

Bradbury testnet data:
{bradbury_data}

Ethereum Mainnet transactions:
{eth_data}

Score wallet age (use best age from either chain):
2 to 3 months = 20pts
1 to 2 months = 15pts
2 weeks to 1 month = 10pts
1 to 2 weeks = 5pts
Under 1 week = 0pts

Score Ethereum transaction count:
Over 100 = 20pts
50 to 100 = 15pts
20 to 50 = 10pts
10 to 20 = 5pts
Under 10 = 2pts
Zero = 0pts

If BOTH chains show wallet age under 1 week reply exactly: REJECTED
Otherwise reply with total score as a number only. Maximum 80."""
            )
        wallet_score_result = gl.eq_principle.prompt_comparative(
            get_wallet_score,
            "Both outputs are equivalent if both say REJECTED, or if both produce a score that falls in the same tier: below 20, 20 to 49, or 50 and above"
        )
        if "REJECTED" in wallet_score_result.upper():
            return json.dumps({"status": "error", "reason": "Wallet too new to vouch"})
        try:
            wallet_score_digits = ''.join(filter(str.isdigit, wallet_score_result))
            wallet_score_val = wallet_score_digits if wallet_score_digits else "0"
        except:
            wallet_score_val = "0"
        if u256(wallet_score_val) < u256(20):
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
    def end_campaign(
        self,
        wallet_address: str,
        campaign_id: str
    ) -> str:
        campaign = json.loads(self.campaigns[campaign_id]) if campaign_id in self.campaigns else None
        if not campaign:
            return json.dumps({"status": "error", "reason": "Campaign not found"})
        if campaign["wallet"] != wallet_address:
            return json.dumps({"status": "error", "reason": "Not your campaign"})
        if campaign["status"] == "ended":
            return json.dumps({"status": "error", "reason": "Campaign already ended"})
        if campaign["status"] not in ["active", "vouching"]:
            return json.dumps({"status": "error", "reason": "Campaign cannot be ended"})
        campaign["status"] = "ended"
        self.campaigns[campaign_id] = json.dumps(campaign)
        return json.dumps({"status": "success", "campaign_id": campaign_id})

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

        if dispute_index < 0:
            return json.dumps({"status": "error", "reason": "No open dispute found"})

        if dispute["raised_by"] == wallet_address:
            return json.dumps({"status": "error", "reason": "Cannot resolve your own dispute"})

        def resolve():
            evidence_data = gl.nondet.web.render(dispute['evidence_url'], mode="text")
            repo_data = gl.nondet.web.render(campaign['github_repo_url'], mode="text")
            return gl.nondet.exec_prompt(
                f"""You are resolving a dispute for an open source grant campaign.

Campaign title: {campaign['title']}
Campaign story: {campaign['story']}
GitHub repo: {campaign['github_repo_url']}

GitHub repo data:
{repo_data}

Live URL: {campaign['live_url']}
Dispute evidence URL: {dispute['evidence_url']}

Dispute evidence content:
{evidence_data}

Based on the evidence content and the campaign details, is the dispute valid?
Reply only VALID or INVALID with one sentence reason."""
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
        github_repo_url: str,
        github_file_url: str,
        live_url: str,
        upload_url_1: str,
        upload_url_2: str,
        upload_url_3: str,
        funding_purpose: str
    ) -> str:
        parts = github_repo_url.rstrip('/').split('/')
        owner = parts[-2] if len(parts) >= 2 else ""
        repo = parts[-1] if len(parts) >= 1 else ""
        github_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        github_commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits"

        def verify():
            bradbury_data = gl.nondet.web.render(f"https://explorer-bradbury.genlayer.com/address/{wallet_address}", mode="text")
            eth_data = gl.nondet.web.render(f"https://api.etherscan.io/api?module=account&action=txlist&address={wallet_address}&sort=asc", mode="text")
            repo_data = gl.nondet.web.render(github_api_url, mode="text")
            commits_data = gl.nondet.web.render(github_commits_url, mode="text")
            file_data = gl.nondet.web.render(github_file_url, mode="text")
            live_data = gl.nondet.web.render(live_url, mode="text")

            return gl.nondet.exec_prompt(
                f"""You are verifying an open source project grant application on Genatio.
Be thorough, honest, and strict. Follow every step exactly and in order.

=== STEP 1: LANGUAGE CHECK ===
Read the title and story below.
If they are NOT written in English reply exactly: REJECTED:not_english
Title: {title}
Story: {story}

=== STEP 2: WALLET TRUST CHECK ===
Wallet address: {wallet_address}

Bradbury testnet explorer data:
{bradbury_data}

Ethereum Mainnet transactions:
{eth_data}

Score wallet age (use best age from either chain):
2 to 3 months = 20pts
1 to 2 months = 15pts
2 weeks to 1 month = 10pts
1 to 2 weeks = 5pts
Under 1 week = 0pts

Score Ethereum transaction count:
Over 100 = 20pts
50 to 100 = 15pts
20 to 50 = 10pts
10 to 20 = 5pts
Under 10 = 2pts
Zero = 0pts

If BOTH chains show wallet age under 1 week reply exactly: REJECTED:wallet_too_new
Maximum wallet trust score = 80pts. Note it as WALLET_SCORE.

=== STEP 3: GITHUB VERIFICATION ===

GitHub repo data:
{repo_data}

GitHub commit history:
{commits_data}

Factor 1 — Repo exists and is public:
Check if repo data loaded and private is false.
Exists and public = 20pts
Not found or private = 0pts
If 0pts reply exactly: REJECTED:no_repo

Factor 2 — Commit activity (check pushed_at and commits list):
Last 30 days = 20pts
Last 90 days = 14pts
Last 180 days = 6pts
Older = 0pts

Factor 3 — README quality (check description field from repo data):
Detailed description = 15pts
Basic description = 7pts
Empty = 0pts

Factor 4 — License present (check license field from repo data):
License exists = 10pts
No license = 0pts

Factor 5 — Specific file readable:
Specific file content:
{file_data}
File loads and contains readable code = 15pts
File not provided or unreadable = 3pts
Not submitted = 0pts

Factor 6 — Live URL accessible:
Live URL: {live_url}
Live URL content:
{live_data}
Loads with real content = 15pts
Loads but sparse = 7pts
Does not load = 0pts

Factor 7 — Repo age (check created_at from repo data):
Over 90 days old = 10pts
30 to 90 days = 7pts
7 to 30 days = 3pts
Under 7 days reply exactly: REJECTED:repo_too_new

Factor 8 — Funding purpose specific:
Read this funding purpose: {funding_purpose}
Very specific deliverables = 20pts
Somewhat specific = 10pts
Vague = 0pts

Factor 9 — Story quality:
Read this story: {story}
Detailed and convincing = 15pts
Basic = 7pts
Too short or vague = 0pts

Factor 10 — Screenshots provided:
Screenshot 1: {upload_url_1}
Screenshot 2: {upload_url_2}
Screenshot 3: {upload_url_3}
All 3 provided and load = 15pts
1 or 2 provided = 7pts
None provided = 0pts

Factor 11 — Community engagement (from GitHub repo data):
Check stargazers_count, forks_count from repo_data.
Stars above 10 and forks above 3 = 10pts
Stars above 3 or forks above 1 = 5pts
Stars 0 and forks 0 = 0pts

Factor 12 — Wallet trust score:
Use WALLET_SCORE from Step 2.
Normalize to max 10pts: round(WALLET_SCORE / 8).

Add all factor scores. Maximum = 175pts.
Normalize to 100: round((total / 175) * 100).

=== FINAL REPLY ===
If any REJECTED condition was triggered reply with that exact rejection string.
Otherwise reply with only a single number between 0 and 100. Nothing else. No words. Just the number."""
            )

        result = gl.eq_principle.prompt_comparative(
            verify,
            "Both outputs are equivalent if both are the same REJECTED code, or if both produce a score that falls in the same tier: below 50, between 50 and 84, or 85 and above"
        )
        return result
