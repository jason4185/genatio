# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class Genatio(gl.Contract):

    campaigns: str
    donations: str
    campaign_count: str
    total_donated_usd: str

    def __init__(self):
        self.campaigns = json.dumps({})
        self.donations = json.dumps({})
        self.campaign_count = json.dumps(0)
        self.total_donated_usd = json.dumps(0)

    @gl.public.write
    def create_campaign(self, name: str, description: str, target_usd: int, category: str, repo_url: str):
        name = name.strip()
        description = description.strip()
        if len(name) < 3 or len(name) > 80:
            return json.dumps({"error": "invalid_name"})
        if len(description) < 10 or len(description) > 500:
            return json.dumps({"error": "invalid_description"})
        if target_usd < 10 or target_usd > 1000000:
            return json.dumps({"error": "invalid_target"})
        if category not in ["open_source", "app"]:
            return json.dumps({"error": "invalid_category"})

        campaigns = json.loads(self.campaigns)
        count = json.loads(self.campaign_count)

        campaign_id = str(count)
        campaigns[campaign_id] = {
            "id": campaign_id,
            "name": name,
            "description": description,
            "target_usd": target_usd,
            "category": category,
            "repo_url": repo_url,
            "total_raised_usd": 0,
            "donor_count": 0,
            "creator": gl.message.sender_address,
            "active": True,
        }

        self.campaigns = json.dumps(campaigns)
        self.campaign_count = json.dumps(count + 1)
        return json.dumps({"success": True, "campaign_id": campaign_id})

    @gl.public.write
    def donate(self, campaign_id: str, amount_usd: int, proof_cid: str, chain: str, donor_note: str):
        campaigns = json.loads(self.campaigns)
        if campaign_id not in campaigns:
            return json.dumps({"error": "campaign_not_found"})
        if not campaigns[campaign_id]["active"]:
            return json.dumps({"error": "campaign_inactive"})
        if amount_usd < 1:
            return json.dumps({"error": "amount_too_small"})
        if chain not in ["gen", "eth"]:
            return json.dumps({"error": "unsupported_chain"})
        if len(proof_cid) < 10:
            return json.dumps({"error": "invalid_proof_cid"})

        proof_url = f"https://gateway.pinata.cloud/ipfs/{proof_cid}"
        campaign_name = campaigns[campaign_id]["name"]

        def fetch_proof() -> str:
            raw = gl.nondet.web.render(proof_url, mode="text")
            if not raw or len(raw.strip()) < 5:
                raise Exception("empty_proof")
            return raw[:2000]

        proof_content = gl.eq_principle.prompt_comparative(
            fetch_proof,
            "Both outputs are equivalent if they contain the same donation receipt or payment confirmation content"
        )

        validation_prompt = f"""You are validating a donation proof uploaded to IPFS for Genatio, a donation platform.

Campaign: {campaign_name}
Claimed amount: ${amount_usd} USD
Chain: {chain.upper()}

Proof content:
{proof_content[:1000]}

Does this content represent a plausible donation proof, payment receipt, transaction confirmation, or screenshot of a payment?

Answer only YES or NO."""

        def validate_proof() -> str:
            return gl.nondet.exec_prompt(validation_prompt)

        validation_result = gl.eq_principle.prompt_comparative(
            validate_proof,
            "Both outputs are equivalent if they both answer YES or both answer NO to whether the content is a valid donation proof"
        )

        if not validation_result.strip().upper().startswith("YES"):
            return json.dumps({"error": "invalid_proof"})

        donations = json.loads(self.donations)
        if campaign_id not in donations:
            donations[campaign_id] = []

        donor_address = gl.message.sender_address
        donation_id = f"{campaign_id}_{len(donations[campaign_id])}"

        donation = {
            "id": donation_id,
            "donor": donor_address,
            "amount_usd": amount_usd,
            "proof_cid": proof_cid,
            "chain": chain,
            "note": donor_note.strip()[:200] if donor_note else "",
        }

        donations[campaign_id].append(donation)
        self.donations = json.dumps(donations)

        campaigns[campaign_id]["total_raised_usd"] += amount_usd
        campaigns[campaign_id]["donor_count"] += 1
        self.campaigns = json.dumps(campaigns)

        total = json.loads(self.total_donated_usd)
        self.total_donated_usd = json.dumps(total + amount_usd)

        return json.dumps({"success": True, "donation_id": donation_id})

    @gl.public.view
    def get_campaigns(self) -> str:
        campaigns = json.loads(self.campaigns)
        result = list(campaigns.values())
        result.sort(key=lambda c: c["total_raised_usd"], reverse=True)
        return json.dumps(result)

    @gl.public.view
    def get_campaign(self, campaign_id: str) -> str:
        campaigns = json.loads(self.campaigns)
        if campaign_id not in campaigns:
            return json.dumps({"error": "not_found"})
        return json.dumps(campaigns[campaign_id])

    @gl.public.view
    def get_donations(self, campaign_id: str) -> str:
        donations = json.loads(self.donations)
        return json.dumps(donations.get(campaign_id, []))

    @gl.public.view
    def get_stats(self) -> str:
        count = json.loads(self.campaign_count)
        total = json.loads(self.total_donated_usd)
        donations = json.loads(self.donations)
        total_donations = sum(len(v) for v in donations.values())
        return json.dumps({
            "total_campaigns": count,
            "total_donated_usd": total,
            "total_donations": total_donations,
        })

    @gl.public.write
    def close_campaign(self, campaign_id: str):
        campaigns = json.loads(self.campaigns)
        if campaign_id not in campaigns:
            return json.dumps({"error": "not_found"})
        if campaigns[campaign_id]["creator"] != gl.message.sender_address:
            return json.dumps({"error": "not_creator"})
        campaigns[campaign_id]["active"] = False
        self.campaigns = json.dumps(campaigns)
        return json.dumps({"success": True})
