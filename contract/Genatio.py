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
        funding_purpose: str
    ) -> str:
        # Blacklist check
        if any(w == wallet_address for w in self.blacklist):
            return json.dumps({"status": "rejected", "reason": "Wallet is blacklisted"})

        # Duplicate check
        active = [json.loads(v) for k, v in self.campaigns.items() if json.loads(v)["wallet"] == wallet_address and json.loads(v)["status"] in ["active", "vouching"]]
        if len(active) >= 2:
            return json.dumps({"status": "rejected", "reason": "You already have 2 active campaigns"})

        if duration_days != u256(7) and duration_days != u256(14) and duration_days != u256(30):
            return json.dumps({"status": "rejected", "reason": "Invalid duration. Choose 7, 14, or 30 days"})

        try:
            result = self._verify_campaign(
                wallet_address,
                title,
                story,
                github_repo_url,
                funding_purpose
            )
        except Exception as e:
            result = f"0\nVerification Summary:\n- Verification failed\n\nAreas for Improvement:\n- Please resubmit\n\nError: {str(e)[:100]}"

        try:
            first_line = result.strip().split('\n')[0].strip()
            digits = ''.join(filter(str.isdigit, first_line))
            score = u256(digits) if digits else u256(0)
            if score > u256(100):
                score = u256(100)
        except:
            score = u256(0)

        if u256(score) >= u256(85):
            status = "active"
        elif u256(score) >= u256(50):
            status = "vouching"
        else:
            status = "rejected"

        campaign_id = str(len([k for k, v in self.campaigns.items()]) + 1)

        campaign = {
            "id": campaign_id,
            "wallet": wallet_address,
            "title": title,
            "story": story,
            "goal_usd": str(goal_usd),
            "duration_days": str(duration_days),
            "raised_usd": "0",
            "github_repo_url": github_repo_url,
            "funding_purpose": funding_purpose,
            "status": status,
            "score": str(score),
            "donor_count": "0",
            "chains_used": [],
            "milestones": [],
        }
        self.campaigns[campaign_id] = json.dumps(campaign)

        return json.dumps({
            "status": status,
            "score": str(score),
            "campaign_id": campaign_id
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
            bradbury_data = gl.nondet.web.render(f"https://explorer-bradbury.genlayer.com/api/v2/addresses/{wallet_address}", mode="text") or "No data available"
            eth_data = gl.nondet.web.render(f"https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address={wallet_address}&sort=asc", mode="text") or "No data available"
            return gl.nondet.exec_prompt(
                f"""IMPORTANT: You have been provided with pre-fetched data below. Do not attempt to fetch any URLs yourself. Score only based on the data provided. If data shows "No data available" for a factor score it 0pts.

Check wallet age for address: {wallet_address}

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
Otherwise reply with total score as a number only. Maximum 40."""
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
        dispute_story: str
    ) -> str:
        campaign = json.loads(self.campaigns[campaign_id]) if campaign_id in self.campaigns else None
        if not campaign:
            return json.dumps({"status": "error", "reason": "Campaign not found"})

        dispute_id = str(len(self.disputes) + 1)
        self.disputes.append(json.dumps({
            "id": dispute_id,
            "campaign_id": campaign_id,
            "raised_by": wallet_address,
            "dispute_story": dispute_story,
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
            parts = campaign['github_repo_url'].rstrip('/').split('/')
            owner = parts[-2] if len(parts) >= 2 else ""
            repo = parts[-1] if len(parts) >= 1 else ""
            github_api_url = f"https://api.github.com/repos/{owner}/{repo}"
            github_data = gl.nondet.web.render(github_api_url, mode="text") or "No data available"
            commits_data = gl.nondet.web.render(f"https://api.github.com/repos/{owner}/{repo}/commits", mode="text") or "No data available"
            return gl.nondet.exec_prompt(
                f"""IMPORTANT: You have been provided with pre-fetched data below. Do not attempt to fetch any URLs yourself. Score only based on the data provided. If data shows "No data available" for a factor score it 0pts.

You are resolving a dispute for an open source grant campaign on Genatio.

CAMPAIGN DETAILS:
Title: {campaign['title']}
Story: {campaign['story']}
Funding purpose: {campaign['funding_purpose']}
GitHub repo: {campaign['github_repo_url']}

GITHUB DATA:
Repo info: {github_data}
Recent commits: {commits_data}

DISPUTE:
Raised by: {dispute['raised_by']}
Dispute story: {dispute['dispute_story']}

Based on all the evidence above:
1. Does the GitHub repo match what the campaign claims?
2. Does the disputer's story raise valid concerns that are supported by the GitHub data?
3. Is there a clear contradiction between the campaign story and what the repo actually shows?

If the dispute is valid and the campaign appears fraudulent reply exactly: VALID - one sentence reason
If the campaign appears legitimate and dispute is unfounded reply exactly: INVALID - one sentence reason"""
            )
        resolution = gl.eq_principle.prompt_comparative(
            resolve,
            "Both outputs are equivalent if both say VALID or both say INVALID"
        )

        if resolution.strip().upper().startswith("VALID"):
            campaign["status"] = "rejected"
            if not any(w == campaign["wallet"] for w in self.blacklist):
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
        campaigns = [json.loads(v) for k, v in self.campaigns.items()]
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
        return json.dumps([w for w in self.blacklist])

    # ─── INTERNAL METHODS ───

    def _verify_campaign(
        self,
        wallet_address: str,
        title: str,
        story: str,
        github_repo_url: str,
        funding_purpose: str
    ) -> str:
        parts = github_repo_url.rstrip('/').split('/')
        owner = parts[-2] if len(parts) >= 2 else ""
        repo = parts[-1] if len(parts) >= 1 else ""
        github_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        github_commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits"

        def verify():
            bradbury_raw = gl.nondet.web.render(f"https://explorer-bradbury.genlayer.com/api/v2/addresses/{wallet_address}", mode="text") or ""
            eth_raw = gl.nondet.web.render(f"https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address={wallet_address}&sort=asc", mode="text") or ""
            repo_raw = gl.nondet.web.render(github_api_url, mode="text") or ""
            commits_raw = gl.nondet.web.render(github_commits_url, mode="text") or ""

            bradbury_data = bradbury_raw[:500] if bradbury_raw else "No data available"
            eth_data = eth_raw[:500] if eth_raw else "No data available"
            repo_data = repo_raw[:800] if repo_raw else "No data available"
            commits_data = commits_raw[:300] if commits_raw else "No data available"

            return gl.nondet.exec_prompt(
                f"""You are verifying an open source project grant on Genatio. Score based ONLY on the data below.

WALLET: {wallet_address}
BRADBURY DATA (truncated): {bradbury_data}
ETHEREUM DATA (truncated): {eth_data}
GITHUB REPO (truncated): {repo_data}
RECENT COMMITS (truncated): {commits_data}
TITLE: {title}
STORY (first 200 chars): {story[:200]}
FUNDING PURPOSE (first 200 chars): {funding_purpose[:200]}

Score these factors (reply with ONLY a number 0-100):
- Wallet trust (age + activity on either chain): 0-10pts
- Repo exists and public: 0-20pts
- Recent commits (last 30 days = 20pts, 90 days = 14pts, older = 0pts): 0-20pts
- README quality (from description field): 0-15pts
- License present: 0-10pts
- Repo age (90+ days = 10pts, 30-90 = 7pts, 7-30 = 3pts, under 7 = 0pts): 0-10pts
- Funding purpose specificity: 0-20pts
- Story quality: 0-15pts
- Community (stars/forks): 0-10pts

Total maximum = 130pts. Normalize: round((total/130)*100).
Reply with ONLY a single number between 0 and 100. Nothing else."""
            )

        try:
            result = gl.eq_principle.prompt_comparative(
                verify,
                "Both outputs are equivalent if the score on the first line of each response falls in the same tier: below 50, between 50 and 84, or 85 and above"
            )
        except Exception as e:
            return f"0\nVerification error: {str(e)[:200]}\n\nVerification Summary:\n- Verification encountered an error\n\nAreas for Improvement:\n- Please resubmit your campaign"
        return result
