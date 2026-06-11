# v0.1.0
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
    def raise_flag(
        self,
        wallet_address: str,
        project_id: str,
        flag_reasons: str,
        project_title: str,
        project_story: str,
        project_github: str,
        project_funding_purpose: str
    ) -> str:
        disputes = json.loads(self.disputes)

        existing = [d for d in disputes if d["project_id"] == project_id and d["status"] == "open"]
        if existing:
            return json.dumps({"status": "error", "reason": "Flag already open for this project"})

        dispute_id = str(len(disputes) + 1)
        disputes.append({
            "id": dispute_id,
            "project_id": project_id,
            "raised_by": wallet_address,
            "flag_reasons": flag_reasons,
            "project_title": project_title,
            "project_story": project_story,
            "project_github": project_github,
            "project_funding_purpose": project_funding_purpose,
            "status": "open",
            "created_at": gl.message_raw['datetime']
        })
        self.disputes = json.dumps(disputes)

        # Notify main contract via contract-to-contract call
        main = gl.get_contract_at(Address(self.main_contract))
        main.emit(on="accepted").mark_disputed(project_id)

        return json.dumps({"status": "success", "dispute_id": dispute_id})

    @gl.public.write
    def review_flag(
        self,
        wallet_address: str,
        project_id: str
    ) -> str:
        disputes = json.loads(self.disputes)

        dispute = None
        dispute_index = -1
        for i, d in enumerate(disputes):
            if d["project_id"] == project_id and d["status"] == "open":
                dispute = d
                dispute_index = i
                break

        if not dispute:
            return json.dumps({"status": "error", "reason": "No open flag found"})

        if dispute["raised_by"] == wallet_address:
            return json.dumps({"status": "error", "reason": "Cannot review your own flag"})

        project_github = dispute["project_github"]
        parts = project_github.rstrip('/').split('/')
        owner = parts[-2] if len(parts) >= 2 else ""
        repo = parts[-1].replace(".git", "") if len(parts) >= 1 else ""
        github_api_url = f"https://api.github.com/repos/{owner}/{repo}"
        github_commits_url = f"https://api.github.com/repos/{owner}/{repo}/commits"

        c = dispute

        def resolve():
            try:
                repo_response = gl.nondet.web.get(github_api_url)
                github_data = repo_response.body.decode("utf-8")[:3000]
            except:
                github_data = "No data available"
            try:
                commits_response = gl.nondet.web.get(github_commits_url)
                commits_data = commits_response.body.decode("utf-8")[:3000]
            except:
                commits_data = "No data available"

            return gl.nondet.exec_prompt(
                f"""You are reviewing a flag raised against an open source project on Genatio.

PROJECT DETAILS:
Title: {c['project_title']}
Story: {c['project_story']}
Funding purpose: {c['project_funding_purpose']}
GitHub repo: {c['project_github']}

GITHUB DATA:
Repo info: {github_data}
Recent commits: {commits_data}

FLAG REASONS RAISED:
{c['flag_reasons']}

Check each flag reason against the evidence.
If the flag reasons are supported by evidence reply exactly: VALID - one sentence reason
If the project appears legitimate reply exactly: INVALID - one sentence reason"""
            )

        def flag_validator_fn(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            result = leaders_res.calldata.strip().upper()
            return result.startswith("VALID") or result.startswith("INVALID")

        resolution = gl.vm.run_nondet_unsafe(resolve, flag_validator_fn)

        # Re-read disputes after consensus to avoid stale state
        disputes = json.loads(self.disputes)

        if resolution.strip().upper().startswith("VALID"):
            blacklist = json.loads(self.blacklist)
            if not any(w == dispute["raised_by"] for w in blacklist):
                blacklist.append(dispute["raised_by"])
                self.blacklist = json.dumps(blacklist)

            # Notify main contract to reject and blacklist project
            main = gl.get_contract_at(Address(self.main_contract))
            main.emit(on="finalized").reject_project(project_id, dispute["raised_by"])
        else:
            # Notify main contract to restore project to active
            main = gl.get_contract_at(Address(self.main_contract))
            main.emit(on="accepted").restore_project(project_id)

        if dispute_index >= 0 and dispute_index < len(disputes):
            disputes[dispute_index]["status"] = "resolved"
            disputes[dispute_index]["resolution"] = resolution
        self.disputes = json.dumps(disputes)

        return json.dumps({"status": "success", "resolution": resolution})

    @gl.public.view
    def get_flags(self, project_id: str) -> str:
        disputes = json.loads(self.disputes)
        result = [d for d in disputes if d["project_id"] == project_id]
        return json.dumps(result[0] if result else None)

    @gl.public.view
    def get_blacklist(self) -> str:
        return self.blacklist
