# v0.2.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class GenatioDispute(gl.Contract):
    disputes: str
    blacklist: str
    main_contract: str

    def __init__(self, main_contract_address: str):
        self.disputes = json.dumps([])
        self.blacklist = json.dumps([])
        self.main_contract = main_contract_address

    @gl.public.write
    def flag_project(
        self,
        project_title: str,
        flag_reasons: str
    ) -> str:
        flagger = str(gl.message.sender_address)

        # Read project data from main contract BEFORE nondet closure
        main = gl.get_contract_at(Address(self.main_contract))
        project_raw = main.view().get_project_by_title(project_title)
        project = json.loads(project_raw) if project_raw else None
        if not project:
            return json.dumps({"status": "error", "reason": "Project not found"})
        project_id = project["id"]

        # Check no flag already exists for this project
        disputes = json.loads(self.disputes)
        existing = [d for d in disputes if d["project_id"] == project_id]
        if existing:
            return json.dumps({"status": "error", "reason": "Flag already raised for this project"})

        if project["wallet"] == flagger:
            return json.dumps({"status": "error", "reason": "Cannot flag your own project"})

        # Extract project details for AI
        project_title = project["title"]
        project_story = project["story"]
        project_github = project["github_repo_url"]
        project_funding_purpose = project["funding_purpose"]

        # Parse GitHub URL
        parts = project_github.rstrip('/').split('/')
        owner = parts[-2] if len(parts) >= 2 else ""
        repo = parts[-1].replace(".git", "") if len(parts) >= 1 else ""
        github_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        github_commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits"

        def resolve():
            try:
                repo_response = gl.nondet.web.get(github_api_url)
                github_data = repo_response.body.decode("utf-8")
            except:
                github_data = "No data available"
            try:
                commits_response = gl.nondet.web.get(github_commits_url)
                commits_data = commits_response.body.decode("utf-8")
            except:
                commits_data = "No data available"

            try:
                result = gl.nondet.exec_prompt(
                    f"""You are a fair and balanced reviewer investigating a community flag on Genatio.

PROJECT DETAILS:
Title: {project_title}
Story: {project_story}
Funding purpose: {project_funding_purpose}
GitHub: {project_github}

GITHUB EVIDENCE:
{github_data}
{commits_data}

FLAG REASONS RAISED:
{flag_reasons}

REVIEW GUIDELINES:
- You must find CLEAR and UNDENIABLE evidence of fraud or deception to return VALID
- Missing repo description, low stars, no license, small commit history = NOT fraud
- A real project with any activity should be treated as legitimate
- Only return VALID if the repo does not exist, story is completely fabricated, or there are deliberate lies
- When in doubt — always return INVALID
- Incomplete projects are NOT fraudulent projects

If there is clear undeniable evidence of fraud: reply VALID - brief reason
If project appears real even if incomplete: reply INVALID - brief reason"""
                )
                result_str = str(result).strip() if result else ""
                if not result_str:
                    return "INVALID - Unable to evaluate"
                upper = result_str.upper()
                if "VALID" not in upper and "INVALID" not in upper:
                    return "INVALID - Inconclusive evaluation"
                return result_str
            except:
                return "INVALID - Unable to evaluate due to error"

        def flag_validator_fn(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            result = leaders_res.calldata.strip().upper()
            return "VALID" in result or "INVALID" in result

        resolution = gl.vm.run_nondet_unsafe(resolve, flag_validator_fn)

        # Store dispute
        dispute_id = str(len(disputes) + 1)
        dispute = {
            "id": dispute_id,
            "project_id": project_id,
            "raised_by": flagger,
            "flag_reasons": flag_reasons,
            "status": "resolved",
            "resolution": resolution,
            "created_at": gl.message_raw['datetime']
        }
        disputes.append(dispute)
        self.disputes = json.dumps(disputes)

        # Act on resolution
        if resolution.strip().upper().startswith("VALID"):
            blacklist = json.loads(self.blacklist)
            if project["wallet"] not in blacklist:
                blacklist.append(project["wallet"])
                self.blacklist = json.dumps(blacklist)
            main_contract = gl.get_contract_at(Address(self.main_contract))
            main_contract.emit(on="finalized").reject_project(project_id)
            return json.dumps({"status": "success", "resolution": "VALID", "reason": resolution})
        else:
            return json.dumps({"status": "success", "resolution": "INVALID", "reason": resolution})

    @gl.public.view
    def get_flags(self, project_id: str) -> str:
        disputes = json.loads(self.disputes)
        result = [d for d in disputes if d["project_id"] == project_id]
        return json.dumps(result[0] if result else None)

    @gl.public.view
    def get_blacklist(self) -> str:
        return self.blacklist
