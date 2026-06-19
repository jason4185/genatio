# v0.2.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json

class GenatioDispute(gl.Contract):
    disputes: str
    blacklist: str
    main_contract: str
    dispute_history: TreeMap[str, str]

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
        blacklist_raw = self.blacklist
        existing = [d for d in disputes if d["project_id"] == project_id]
        if existing:
            return json.dumps({"status": "error", "reason": "Flag already raised for this project"})

        if project["wallet"] == flagger:
            return json.dumps({"status": "error", "reason": "Cannot flag your own project"})

        # Extract project details for AI
        project_title = project["title"]
        project_github = project.get("github_repo_url", "")
        project_funding_purpose = project["funding_purpose"]
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
                result = gl.nondet.exec_prompt(f"""
        You are evaluating a community flag against an open source project on Genatio.

        PROJECT DETAILS:
        Title: {project_title}
        Story: {project.get('story', '')}
        GitHub: {project_github}
        Funding purpose: {project.get('funding_purpose', '')}

        GITHUB EVIDENCE:
        {github_data}

        COMMIT HISTORY:
        {commits_data}

        FLAG REASONS:
        {flag_reasons}

        GUIDELINES:
        - Only confirm flag if there is CLEAR and UNDENIABLE evidence of fraud
        - Missing description, low stars, no license = NOT fraud
        - Real project with any activity = flag is invalid
        - When in doubt = 0

        Reply with ONLY a single digit:
        1 if flag is valid and project is fraudulent
        0 if flag is invalid and project is legitimate
        Nothing else. Just 0 or 1.
        """)

                clean = str(result).strip()
                return "1" if "1" in clean else "0"
            except:
                return "0"

        def flag_validator_fn(leaders_res):
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            result = leaders_res.calldata.strip()
            return result in ["0", "1"]

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

        if resolution is None:
            resolution = "0"

        resolution = resolution.strip()

        if resolution == "1":
            resolution_text = "VALID"
            resolution_reason = "Flag confirmed. Project has been removed from Genatio."
        else:
            resolution_text = "INVALID"
            resolution_reason = "Flag dismissed. Project appears legitimate."

        dispute_record = {
            "project_id": project_id,
            "project_title": project_title,
            "flagged_by": str(gl.message.sender_address),
            "reasons": flag_reasons,
            "resolution": resolution_text,
            "reason": resolution_reason,
            "timestamp": gl.message_raw['datetime']
        }
        self.dispute_history[project_id] = json.dumps(dispute_record)

        # Act on resolution
        if resolution == "1":
            blacklist = json.loads(blacklist_raw)
            if project["wallet"] not in blacklist:
                blacklist.append(project["wallet"])
                self.blacklist = json.dumps(blacklist)
            main.emit(on="accepted").reject_project(project_id)
        return json.dumps({
            "status": "success",
            "resolution": resolution_text,
            "reason": resolution_reason
        })

    @gl.public.view
    def get_flags(self, project_id: str) -> str:
        disputes = json.loads(self.disputes)
        result = [d for d in disputes if d["project_id"] == project_id]
        return json.dumps(result[0] if result else None)

    @gl.public.view
    def get_dispute_history(self, project_id: str) -> str:
        record = self.dispute_history.get(project_id, "null")
        return record

    @gl.public.view
    def get_my_flags(self, wallet: str) -> str:
        results = []
        for key, value in self.dispute_history.items():
            record = json.loads(value)
            if record["flagged_by"].lower() == wallet.lower():
                results.append(record)
        return json.dumps(results)

    @gl.public.view
    def get_blacklist(self) -> str:
        return self.blacklist
