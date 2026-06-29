# v0.4.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass

class Genatio(gl.Contract):
    campaigns: TreeMap[str, str]
    blacklist: DynArray[str]
    donations: DynArray[str]
    dispute_contract: str
    owner: str
    rejected: TreeMap[str, str]

    def __init__(self):
        self.dispute_contract = ""
        self.owner = str(gl.message.sender_address)

    @gl.public.write
    def submit_project(
        self,
        title: str,
        story: str,
        goal_gen: u256,
        duration_days: u256,
        github_repo_url: str,
        live_url: str,
        funding_purpose: str
    ) -> str:
        wallet_address = str(gl.message.sender_address)

        if duration_days != u256(7) and duration_days != u256(14) and duration_days != u256(30):
            return json.dumps({"status": "rejected", "reason": "Invalid duration. Choose 7, 14, or 30 days"})

        existing_ids = [int(k) for k in self.campaigns.keys()]

        for k, v in self.campaigns.items():
            existing = json.loads(v)
            if existing["title"].lower() == title.lower():
                return json.dumps({"status": "error", "reason": "Project title already exists. Choose a unique title."})

        active = [json.loads(v) for k, v in self.campaigns.items() if json.loads(v)["wallet"] == wallet_address and json.loads(v)["status"] == "active"]
        if len(active) >= 2:
            return json.dumps({"status": "error", "reason": "You already have 2 active projects. Close one before submitting a new project."})

        result = self._verify_campaign(
            title,
            story,
            github_repo_url,
            live_url,
            funding_purpose
        )

        # ALL storage reads happen AFTER the non-deterministic call
        if wallet_address in self.blacklist:
            return json.dumps({"status": "rejected", "reason": "Wallet is blacklisted"})

        try:
            score = u256(int(result.strip()))
            if score > u256(100):
                score = u256(100)
        except Exception:
            score = u256(0)

        project_id = str(max(existing_ids) + 1 if existing_ids else 1)

        if u256(score) >= u256(40):
            status = "active"
        else:
            rejected_project = {
                "id": project_id,
                "title": title,
                "wallet": wallet_address,
                "score": str(score),
                "status": "rejected",
                "reason": "Your project did not meet the minimum verification threshold of 40 points required for listing on Genatio.",
                "created_at": gl.message_raw['datetime']
            }
            self.rejected[project_id] = json.dumps(rejected_project)
            return json.dumps({"status": "rejected", "score": str(score)})

        project = {
            "id": project_id,
            "wallet": wallet_address,
            "title": title,
            "story": story,
            "goal_gen": str(goal_gen),
            "duration_days": str(duration_days),
            "github_repo_url": github_repo_url,
            "live_url": live_url,
            "funding_purpose": funding_purpose,
            "status": status,
            "score": str(score),
            "created_at": gl.message_raw['datetime'],
        }
        self.campaigns[project_id] = json.dumps(project)

        return json.dumps({
            "status": status,
            "score": str(score),
            "project_id": project_id
        })

    @gl.public.write
    def close_project(
        self,
        project_id: str
    ) -> str:
        wallet_address = str(gl.message.sender_address)
        project = json.loads(self.campaigns[project_id]) if project_id in self.campaigns else None
        if not project:
            return json.dumps({"status": "error", "reason": "Project not found"})
        if project["wallet"] != wallet_address:
            return json.dumps({"status": "error", "reason": "Not your project"})
        if project["status"] == "ended":
            return json.dumps({"status": "error", "reason": "Project already closed"})
        if project["status"] != "active":
            return json.dumps({"status": "error", "reason": "Project cannot be closed"})
        project["status"] = "ended"
        self.campaigns[project_id] = json.dumps(project)
        return json.dumps({"status": "success", "project_id": project_id})

    @gl.public.write.payable
    def fund_project(self, project_id: str) -> str:
        project_data = self.campaigns[project_id] if project_id in self.campaigns else None
        if not project_data:
            raise gl.vm.UserError("Project not found")

        project = json.loads(project_data)

        if project["status"] != "active":
            raise gl.vm.UserError("Project not accepting funds")

        amount = gl.message.value
        if amount == u256(0):
            raise gl.vm.UserError("No GEN sent")

        sender = gl.message.sender_address

        creator_wallet = project.get("wallet", "")
        if creator_wallet == "":
            raise gl.vm.UserError("Project creator wallet missing")

        _Recipient(Address(creator_wallet)).emit_transfer(value=amount)

        raised = u256(int(project.get("raised_gen", "0")))
        goal = u256(int(project.get("goal_gen", "0")))
        donor_count = u256(int(project.get("donor_count", "0")))

        new_raised = raised + amount
        new_donor_count = donor_count + u256(1)

        project["raised_gen"] = str(new_raised)
        project["donor_count"] = str(new_donor_count)
        project["last_donor"] = str(sender)

        donation = {
            "project_id": project_id,
            "wallet": str(sender),
            "amount_gen": str(amount),
            "timestamp": gl.message_raw["datetime"]
        }

        self.campaigns[project_id] = json.dumps(project)
        self.donations.append(json.dumps(donation))

        goal_reached = new_raised >= goal

        return json.dumps({
            "status": "success",
            "amount_gen": str(amount),
            "goal_reached": goal_reached
        })

    @gl.public.write
    def set_dispute_contract(self, address: str) -> str:
        if str(gl.message.sender_address) != self.owner:
            return json.dumps({"status": "error", "reason": "Unauthorized"})
        self.dispute_contract = address
        return json.dumps({"status": "success", "dispute_contract": address})

    # ─── DISPUTE CALLBACKS (called by GenatioDispute) ───

    @gl.public.write
    def reject_project(self, project_id: str) -> str:
        if str(gl.message.sender_address) != self.dispute_contract:
            return json.dumps({"status": "error", "reason": "Unauthorized"})
        project = json.loads(self.campaigns[project_id]) if project_id in self.campaigns else None
        if not project:
            return json.dumps({"status": "error", "reason": "Project not found"})
        project["status"] = "rejected"
        self.campaigns[project_id] = json.dumps(project)
        if project["wallet"] not in self.blacklist:
            self.blacklist.append(project["wallet"])
        return json.dumps({"status": "success"})

    @gl.public.write
    def restore_project(self, project_id: str) -> str:
        if str(gl.message.sender_address) != self.dispute_contract:
            return json.dumps({"status": "error", "reason": "Unauthorized"})
        project = json.loads(self.campaigns[project_id]) if project_id in self.campaigns else None
        if not project:
            return json.dumps({"status": "error", "reason": "Project not found"})
        project["status"] = "active"
        self.campaigns[project_id] = json.dumps(project)
        return json.dumps({"status": "success"})

    # ─── VIEW METHODS ───

    @gl.public.view
    def get_projects(self, status: str) -> str:
        projects = [json.loads(v) for k, v in self.campaigns.items()]
        if status:
            projects = [p for p in projects if p["status"] == status]
        return json.dumps(projects)

    @gl.public.view
    def get_rejected_projects(self, wallet: str) -> str:
        results = []
        for key, value in self.rejected.items():
            project = json.loads(value)
            if project["wallet"].lower() == wallet.lower():
                results.append(project)
        return json.dumps(results)

    @gl.public.view
    def get_project(self, project_id: str) -> str:
        return json.dumps(json.loads(self.campaigns[project_id])) if project_id in self.campaigns else json.dumps(None)

    @gl.public.view
    def get_project_by_title(self, title: str) -> str:
        for k, v in self.campaigns.items():
            project = json.loads(v)
            if project["title"].lower() == title.lower():
                return json.dumps(project)
        return json.dumps(None)

    @gl.public.view
    def get_blacklist(self) -> str:
        return json.dumps(list(self.blacklist))

    @gl.public.view
    def get_contract_balance(self) -> str:
        return str(self.balance)

    @gl.public.view
    def get_funders(self, project_id: str) -> str:
        results = []
        for donation_raw in self.donations:
            donation = json.loads(donation_raw)
            if donation["project_id"] == project_id:
                results.append(donation)
        return json.dumps(results)

    # ─── INTERNAL METHODS ───

    def _verify_campaign(
        self,
        title: str,
        story: str,
        github_repo_url: str,
        live_url: str,
        funding_purpose: str
    ) -> str:
        parts = github_repo_url.rstrip('/').split('/')
        owner = parts[-2] if len(parts) >= 2 else ""
        repo = parts[-1].replace(".git", "") if len(parts) >= 1 else ""
        github_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        github_commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits"

        def verify():
            try:
                repo_data = gl.nondet.web.get(github_api_url).body.decode("utf-8")
            except:
                repo_data = "No data available"
            try:
                commits_data = gl.nondet.web.get(github_commits_url).body.decode("utf-8")
            except:
                commits_data = "No data available"
            live_data = ""
            if live_url:
                try:
                    live_data = (gl.nondet.web.render(live_url, mode="text") or "")
                except:
                    live_data = ""

            try:
                analysis = gl.nondet.exec_prompt(
                f"""You are verifying an open source project grant application on Genatio.
Today's date: {gl.message_raw['datetime'][:10]}

SCORING RULES:
- If any fetched data shows "No data available" score that factor 0pts and continue — NEVER override the final score
- Missing data for any factor means 0pts for THAT FACTOR ONLY — not 0 for the entire project
- Never guess or infer data that is not explicitly present in the fetched content
- Every factor is independent — one missing factor NEVER affects other factors or the final score
- The final normalized score is ALWAYS round((total/160)*100) — never override this with 0

IMPORTANT: You have been provided with pre-fetched data below. Do not attempt to fetch any URLs yourself. Score only based on the data provided. If data shows "No data available" for a factor score it 0pts.
Be thorough, honest, and strict. Follow every step exactly and in order.

=== STEP 1: LANGUAGE CHECK ===
Read the title and story below.
Language score: English = 10pts, Not English = 0pts
Title: {title}
Story: {story}

=== STEP 2: GITHUB VERIFICATION ===

GitHub repo data:
{repo_data}

GitHub commit history:
{commits_data}

Factor 1 — Repo exists and is public:
Check if repo data loaded and private is false.
Exists and public = 20pts
Not found or private = 0pts
If not found or private score 0pts and continue scoring other factors.

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

Factor 5 — Repo age (check created_at from repo data):
Over 90 days old = 10pts
30 to 90 days = 7pts
7 to 30 days = 3pts
Under 7 days = 0pts

Factor 6 — Funding purpose specific:
Read this funding purpose: {funding_purpose}
Very specific deliverables = 20pts
Somewhat specific = 10pts
Vague = 0pts

Factor 7 — Story quality:
Read this story: {story}
Detailed and convincing = 15pts
Basic = 7pts
Too short or vague = 0pts

Factor 8 — Community engagement (from GitHub repo data):
Stars above 10 and forks above 3 = 10pts
Stars above 3 or forks above 1 = 5pts
Stars 0 and forks 0 = 0pts

Factor 9 — Live URL accessible:
Live URL: {live_url}
Fetched content: {live_data if live_data else "Not provided"}
Loads with real content = 15pts
Loads but sparse = 7pts
Not provided or does not load = 0pts

Factor 10 — Project consistency:
Cross-check the following:
- Does the GitHub repo name and description match the project title and story?
- Does the live URL content match what the creator claims to be building?
- Is there a clear connection between the funding purpose and what the GitHub repo shows?
All consistent = 15pts
Minor inconsistencies = 5pts
Major mismatch (repo and story describe completely different projects) = 0pts

Add all factor scores. Maximum = 160pts.
Normalize to 100: round((total / 160) * 100).

=== FINAL REPLY ===
Reply with a JSON object only, no other text:
{{
  "score": <integer 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"]
}}""",
                response_format="json"
            )
                score_raw = analysis.get("score", 0)
                score_int = max(0, min(100, int(round(float(str(score_raw).strip())))))
                return str(score_int)
            except Exception:
                return "0"

        # Lightweight validator for current testnet flow:
        # leader performs full scoring; validators only check score shape/range.
        def validator_fn(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False

            try:
                score = int(leaders_res.calldata.strip())
            except Exception:
                return False

            return score >= 0 and score <= 100

        result = gl.vm.run_nondet_unsafe(verify, validator_fn)
        return result
