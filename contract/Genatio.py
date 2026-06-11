# v0.2.21
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class Genatio(gl.Contract):
    campaigns: TreeMap[str, str]
    donations: DynArray[str]
    disputes: DynArray[str]
    blacklist: DynArray[str]

    def __init__(self):
        pass

    @gl.public.write
    def submit_project(
        self,
        wallet_address: str,
        title: str,
        story: str,
        goal_usd: u256,
        duration_days: u256,
        github_repo_url: str,
        live_url: str,
        funding_purpose: str
    ) -> str:
        if duration_days != u256(7) and duration_days != u256(14) and duration_days != u256(30):
            return json.dumps({"status": "rejected", "reason": "Invalid duration. Choose 7, 14, or 30 days"})

        result = self._verify_campaign(
            wallet_address,
            title,
            story,
            github_repo_url,
            live_url,
            funding_purpose
        )

        # ALL storage reads happen AFTER the non-deterministic call
        if wallet_address in self.blacklist:
            return json.dumps({"status": "rejected", "reason": "Wallet is blacklisted"})

        active = [json.loads(v) for k, v in self.campaigns.items() if json.loads(v)["wallet"] == wallet_address and json.loads(v)["status"] == "active"]
        if len(active) >= 2:
            return json.dumps({"status": "rejected", "reason": "You already have 2 active projects"})

        try:
            score = u256(int(result.strip()))
            if score > u256(100):
                score = u256(100)
        except:
            score = u256(0)

        if u256(score) >= u256(65):
            status = "active"
        else:
            return json.dumps({"status": "rejected", "score": str(score)})

        project_id = str(len([k for k, v in self.campaigns.items()]) + 1)

        project = {
            "id": project_id,
            "wallet": wallet_address,
            "title": title,
            "story": story,
            "goal_usd": str(goal_usd),
            "duration_days": str(duration_days),
            "raised_usd": "0",
            "github_repo_url": github_repo_url,
            "live_url": live_url,
            "funding_purpose": funding_purpose,
            "status": status,
            "score": str(score),
            "donor_count": "0",
            "chains_used": [],
            "milestones": [],
            "created_at": gl.message_raw['datetime'],
        }
        self.campaigns[project_id] = json.dumps(project)

        return json.dumps({
            "status": status,
            "score": str(score),
            "project_id": project_id
        })

    @gl.public.write
    def fund_project(
        self,
        wallet_address: str,
        project_id: str,
        amount_token: str,
        amount_usd: u256,
        chain: str,
        tx_hash: str
    ) -> str:
        project = json.loads(self.campaigns[project_id]) if project_id in self.campaigns else None
        if not project:
            return json.dumps({"status": "error", "reason": "Project not found"})
        if project["status"] != "active":
            return json.dumps({"status": "error", "reason": "Project not accepting funds"})

        project["raised_usd"] = str(u256(project["raised_usd"]) + u256(amount_usd))
        project["donor_count"] = str(u256(project["donor_count"]) + u256(1))
        if chain not in project["chains_used"]:
            project["chains_used"].append(chain)

        self.campaigns[project_id] = json.dumps(project)
        self.donations.append(json.dumps({
            "project_id": project_id,
            "wallet": wallet_address,
            "amount_token": amount_token,
            "amount_usd": str(amount_usd),
            "chain": chain,
            "tx_hash": tx_hash
        }))

        return json.dumps({"status": "success"})

    @gl.public.write
    def flag_project(
        self,
        wallet_address: str,
        project_id: str,
        flag_reasons: str
    ) -> str:
        project = json.loads(self.campaigns[project_id]) if project_id in self.campaigns else None
        if not project:
            return json.dumps({"status": "error", "reason": "Project not found"})

        flag_id = str(len(self.disputes) + 1)
        self.disputes.append(json.dumps({
            "id": flag_id,
            "project_id": project_id,
            "raised_by": wallet_address,
            "flag_reasons": flag_reasons,
            "status": "open"
        }))

        project["status"] = "disputed"
        self.campaigns[project_id] = json.dumps(project)

        return json.dumps({"status": "success", "flag_id": flag_id})

    @gl.public.write
    def close_project(
        self,
        wallet_address: str,
        project_id: str
    ) -> str:
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

    @gl.public.write
    def review_flag(
        self,
        wallet_address: str,
        project_id: str
    ) -> str:
        # Extract storage to plain Python objects BEFORE the closure so cloudpickle
        # never serialises storage slots (reading storage in nondet mode is unsupported)
        c = json.loads(self.campaigns[project_id]) if project_id in self.campaigns else None
        if not c:
            return json.dumps({"status": "error", "reason": "Project not found"})

        f = None
        flag_index = -1
        for i in range(len(self.disputes)):
            dd = json.loads(self.disputes[i])
            if dd["project_id"] == project_id and dd["status"] == "open":
                f = dd
                flag_index = i
                break

        if not f:
            return json.dumps({"status": "error", "reason": "No open flag found"})

        if f["raised_by"] == wallet_address:
            return json.dumps({"status": "error", "reason": "Cannot review your own flag"})

        # Build URL components from the pre-extracted plain dict
        parts = c['github_repo_url'].rstrip('/').split('/')
        owner = parts[-2] if len(parts) >= 2 else ""
        repo_name = parts[-1].replace(".git", "") if len(parts) >= 1 else ""
        github_api_url = f"https://api.github.com/repos/{owner}/{repo_name}"
        github_commits_url = f"https://api.github.com/repos/{owner}/{repo_name}/commits"

        # Capture only plain Python values — no self references inside the closure
        _c = c
        _f = f
        _github_api_url = github_api_url
        _github_commits_url = github_commits_url

        def resolve():
            try:
                github_data = gl.nondet.web.get(_github_api_url).body.decode("utf-8")
            except:
                github_data = "No data available"
            try:
                commits_data = gl.nondet.web.get(_github_commits_url).body.decode("utf-8")
            except:
                commits_data = "No data available"
            return gl.nondet.exec_prompt(
                f"""You are reviewing a flag raised against an open source project on Genatio.

PROJECT DETAILS:
Title: {_c['title']}
Story: {_c['story']}
Funding purpose: {_c['funding_purpose']}
GitHub repo: {_c['github_repo_url']}
Live URL: {_c.get('live_url', 'Not provided')}

GITHUB DATA:
Repo info: {github_data}
Recent commits: {commits_data}

FLAG REASONS RAISED:
{_f['flag_reasons']}

Check each flag reason against the evidence:
- GitHub repo doesn't exist or is private → check private field and message in repo data
- GitHub repo doesn't match project description → check if repo description/name matches title and story
- Live URL doesn't load or shows unrelated content → check commits data for clues
- Project story appears copied or AI-generated → check writing style and consistency
- Commits look fake or artificially created → check commit frequency and patterns in commits data
- Funding purpose is vague or misleading → check if funding purpose matches repo activity
- README is empty or unrelated → check description field in repo data

If the flag reasons are supported by evidence reply exactly: VALID - one sentence reason
If the project appears legitimate and flag is unfounded reply exactly: INVALID - one sentence reason"""
            )

        def flag_validator_fn(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            result = leaders_res.calldata.strip().upper()
            return result.startswith("VALID") or result.startswith("INVALID")

        resolution = gl.vm.run_nondet_unsafe(resolve, flag_validator_fn)

        # Re-read storage fresh after consensus for the state update
        project = json.loads(self.campaigns[project_id]) if project_id in self.campaigns else None
        if not project:
            return json.dumps({"status": "error", "reason": "Project not found after consensus"})

        if resolution.strip().upper().startswith("VALID"):
            project["status"] = "rejected"
            if project["wallet"] not in self.blacklist:
                self.blacklist.append(project["wallet"])
        else:
            project["status"] = "active"

        flag = f
        flag["status"] = "resolved"
        flag["resolution"] = resolution
        self.disputes[flag_index] = json.dumps(flag)

        self.campaigns[project_id] = json.dumps(project)

        return json.dumps({"status": "success", "resolution": resolution})

    # ─── VIEW METHODS ───

    @gl.public.view
    def get_projects(self, status: str) -> str:
        projects = [json.loads(v) for k, v in self.campaigns.items()]
        if status:
            projects = [p for p in projects if p["status"] == status]
        return json.dumps(projects)

    @gl.public.view
    def get_project(self, project_id: str) -> str:
        return json.dumps(json.loads(self.campaigns[project_id])) if project_id in self.campaigns else json.dumps(None)

    @gl.public.view
    def get_funders(self, project_id: str) -> str:
        return json.dumps([json.loads(d) for d in self.donations if json.loads(d)["project_id"] == project_id])

    @gl.public.view
    def get_flag(self, project_id: str) -> str:
        flags = [json.loads(d) for d in self.disputes if json.loads(d)["project_id"] == project_id]
        return json.dumps(flags[0] if flags else None)

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
            try:
                score_raw = analysis.get("score", 0)
                return str(max(0, min(100, int(round(float(str(score_raw).strip()))))))
            except:
                return "0"

        def validator_fn(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False

            try:
                leader_score = int(leaders_res.calldata.strip())
            except:
                return False

            try:
                repo = json.loads(gl.nondet.web.get(github_api_url).body.decode("utf-8"))
            except:
                repo = {}

            repo_not_found  = repo.get("message") == "Not Found" or not repo
            repo_is_private = repo.get("private") is True
            has_license     = bool(repo.get("license"))
            pushed_at       = repo.get("pushed_at", "")
            recent_commits  = pushed_at[:4] in ("2026", "2025")

            if (repo_not_found or repo_is_private) and leader_score >= 85:
                return False
            if repo_not_found and leader_score >= 65:
                return False
            if leader_score >= 85 and not recent_commits and not has_license:
                return False

            return True

        result = gl.vm.run_nondet_unsafe(verify, validator_fn)
        return result
