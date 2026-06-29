# Genatio

Genatio is a trustless, GenLayer-powered app for verified open source funding.

Genatio helps open source builders raise GEN from supporters after their app or project is verified by a GenLayer Intelligent Contract.

Builders submit a project name, an about-the-app description, GitHub evidence, a live URL, a funding purpose, a goal, and a campaign duration. The Intelligent Contract reviews the submission using GitHub activity, live app evidence, funding-purpose clarity, and project consistency before the project can receive community funding.

---

## Live Demo

Live demo: [https://genatio.xyz](https://genatio.xyz)

Genatio is built for GenLayer Bradbury Testnet.

Current contracts:

| Contract | Address | Explorer |
| --- | --- | --- |
| Main Genatio contract | `0x9b759C76bCB3e0ACB9Df28dD57575F5c371d2E95` | [View contract](https://explorer-bradbury.genlayer.com/address/0x9b759C76bCB3e0ACB9Df28dD57575F5c371d2E95) |
| Genatio Dispute contract | `0xd39820b6d9F55231B14e55336AAeeF8a50a61562` | [View contract](https://explorer-bradbury.genlayer.com/address/0xd39820b6d9F55231B14e55336AAeeF8a50a61562) |

Network: GenLayer Bradbury Testnet

Explorer: [https://explorer-bradbury.genlayer.com](https://explorer-bradbury.genlayer.com)

## What Genatio Checks

Genatio checks whether an open source project has enough public evidence to be listed for community funding.

The main contract evaluates:

1. Language check
2. GitHub repository exists and is public
3. Commit activity
4. README or repository description quality
5. License presence
6. Repository age
7. Funding purpose specificity
8. About-the-app quality
9. Community engagement
10. Live URL accessibility
11. Project consistency

Projects with a score of `40` or higher become active campaigns. Projects below that threshold are stored in `rejected` and are not listed as active.

### How the Live Flow Works

Live workflow:

1. A builder connects a wallet.
2. The builder submits a project name, about-the-app description, GitHub repository, live URL, funding purpose, GEN goal, and campaign duration.
3. The Genatio Intelligent Contract runs project verification through GenLayer's leader/validator workflow.
4. Approved projects are stored as active campaigns.
5. Supporters fund active projects through the payable `fund_project` method.
6. The frontend reads project, funding, donor, and dispute state back from GenLayer-backed routes and contract calls.

The current testnet release keeps validator checks lightweight to reduce timeout risk, while the leader performs the full Genatio project scoring.

### Verification Scope

Genatio checks:

- public GitHub repository evidence
- commit activity
- repository description quality
- license presence
- repository age
- funding purpose specificity
- about-the-app quality
- community engagement
- live URL availability
- project consistency
- report reasons against project and GitHub evidence

Genatio does not check:

- every possible code vulnerability
- full business correctness
- legal compliance
- future delivery guarantees
- external identities outside submitted project evidence
- production financial risk

---

## The Vision

Open source builders need practical ways to fund continued development. Supporters need better proof before contributing to a project.

Genatio adds an evidence-based verification step before crowdfunding. It uses GenLayer Intelligent Contracts to review public project evidence and store the outcome in contract state.

The goal is not to overclaim security or replace all human judgment. The goal is to make open source funding pages more structured, transparent, and evidence-aware before supporters contribute GEN.

---

## What Genatio Is

Genatio is a verified open source funding app built on GenLayer.

It follows a focused funding path:

```text
Project Evidence -> GenLayer Verification -> Active Campaign -> GEN Contribution -> Finalized Payout
```

- **Project Evidence:** Builder-submitted project name, about-the-app description, GitHub repository, live URL, funding purpose, goal, and duration.
- **GenLayer Verification:** The Intelligent Contract checks repository, activity, live URL, app description, and funding-purpose evidence.
- **Active Campaign:** Projects that meet the score threshold are listed for supporters.
- **GEN Contribution:** Supporters submit payable `fund_project` transactions.
- **Finalized Payout:** The contract emits a value transfer to the creator wallet, and creator payout completes after finalization.

---

## Current App Status

Genatio currently supports an end-to-end Bradbury Testnet funding flow: a builder can submit a project, wait for GenLayer verification, appear as an active campaign if approved, receive supporter contributions through `fund_project`, and view wallet-scoped project state from the dashboard.

Current working pieces include:

- project submission with GenLayer verification
- active and rejected project storage
- payable GEN funding through the main Intelligent Contract
- funding state updates for `raised_gen`, `donor_count`, and `last_donor`
- donor records through `donations` and `get_funders(project_id)`
- project detail and funding views
- wallet-scoped dashboard
- report and dispute flow through a separate Genatio Dispute contract
- Vercel-ready frontend configuration

Genatio is still a testnet application, but the core project verification and funding path is in place.

---

## What It Does

Genatio lets a builder submit an open source project for verification and, if approved, receive community funding with GEN.

The app shows:

- verified active campaigns
- project verification score
- app description and funding purpose
- funding goal and raised amount
- donor count and latest donor
- donor records when available
- wallet-scoped submitted projects
- rejected project state
- report and dispute outcomes

Funding and donor state are backed by the current Genatio contracts.

---

## Key Innovations

### 1. Lightweight Validator Consensus

The leader performs full project verification and scoring. The lightweight validator only checks that the leader returned a valid score from `0` to `100`.

This keeps the current testnet flow faster and reduces timeout risk, while validators still enforce the expected result shape.

### 2. Storage Boundary Discipline

Genatio keeps storage reads and writes outside nondeterministic execution where required. Submission checks that depend on contract storage happen before or after `_verify_campaign`, while nondeterministic GitHub, live URL, and prompt work stays inside `gl.vm.run_nondet_unsafe`.

This boundary is important for stable GenVM execution and predictable contract state updates.

### 3. Deterministic Flag Resolution

The dispute contract resolves reports through a small deterministic output surface. The dispute leader checks flag reasons against project and GitHub evidence, then returns `1` for a valid flag or `0` for an invalid flag. The dispute validator only checks that the result is exactly `0` or `1`.

Contract logic maps that result to `VALID` or `INVALID` dispute state.

### 4. Contract-Mediated Funding with Finalized Creator Payout

Genatio uses a payable `fund_project` method. Supporters send GEN with the Intelligent Contract call through `gl.message.value`. The contract validates the project, records `raised_gen`, `donor_count`, `last_donor`, and donation records, then emits a value transfer to the creator wallet with `_Recipient(Address(creator_wallet)).emit_transfer(value=amount)`.

Creator payout completes after finalization, so Genatio describes funding as a finalized payout flow rather than a same-block peer-to-peer transfer.

### 5. Persistent Rejection Memory

Rejected submissions are stored in the `rejected` `TreeMap` and can be shown on the builder dashboard. This lets builders see projects that did not meet the listing threshold instead of losing the result after verification.

### 6. On-Chain Dispute Resolution

`GenatioDispute` re-checks project evidence when a project is flagged. A valid flag can call `reject_project` on the main contract and blacklist the creator wallet.

### 7. Smart Adaptive Polling

The frontend polls faster while transactions are pending and slows down background refreshes once state is stable. This keeps the interface responsive without applying constant RPC pressure.

### 8. Server-Side Caching Layer

API routes cache Bradbury reads briefly to reduce repeated RPC pressure from browse, dashboard, project detail, funding, and dispute views.

### 9. Pre-Flight Validation

Where possible, the frontend checks duplicate project names and active project limits before asking the user to sign a project submission transaction.

### 10. Donor Records

Genatio records each contribution in `donations` with `project_id`, `wallet`, `amount_gen`, and `timestamp`. The `get_funders(project_id)` view returns project donor records for the Recent Donors UI.

---

## Technical Pillars

### GenLayer Intelligent Contract Backend

The Genatio backend is made of two Python Intelligent Contracts:

- `contract/Genatio.py` for submission, verification, campaign storage, funding, donor records, and dispute callbacks
- `contract/GenatioDispute.py` for project reports, dispute review, flag records, and dispute blacklist state

### Leader and Validator Review

`submit_project` calls `_verify_campaign`. `_verify_campaign` parses the GitHub owner and repository from `github_repo_url`.

The leader:

- fetches GitHub repository data with `gl.nondet.web.get`
- fetches commit activity with `gl.nondet.web.get`
- renders the live URL with `gl.nondet.web.render` when provided
- calls `gl.nondet.exec_prompt` with `response_format="json"`
- receives `score`, `strengths`, and `weaknesses`
- extracts and normalizes the score to `0-100`

Projects with `score >= 40` become active. Projects below `40` are stored in `rejected`.

The lightweight validator only checks that the leader returned a valid score from `0` to `100`.

### Minimal, Focused Schema

Genatio stores contract data as JSON strings with compact fields.

Main project records include:

- `id`
- creator `wallet`
- project name
- app description
- `goal_gen`
- `duration_days`
- `github_repo_url`
- `live_url`
- `funding_purpose`
- `status`
- `score`
- `created_at`
- funding fields such as `raised_gen`, `donor_count`, and `last_donor` after contributions

Donation records include:

- `project_id`
- `wallet`
- `amount_gen`
- `timestamp`

### Frontend Project Workspace

The frontend is built with:

- Next.js
- TypeScript
- GenLayer JS client
- Wagmi wallet integration
- RainbowKit wallet connection UI
- WalletConnect-compatible wallet flow through RainbowKit
- dashboard and project pages
- Vercel deployment

### Wallet-Scoped Project Retrieval

Genatio uses wallet addresses to scope builder and reporter views. The dashboard loads projects and rejected submissions associated with the connected wallet, and report records can be read with `get_my_flags(wallet)`.

Project, funding, donor, and dispute state come from contract-backed reads and API routes. The frontend does not use browser `localStorage` or `sessionStorage` for project, funding, donor, or dispute state. Theme preference may be stored by the theme library only.

### Funding and Donor Records

Genatio keeps accepted transaction state separate from final delivery. Supporter contributions are recorded on-chain, and creator payout completes after finalization, usually within 20-30 minutes.

Funding is implemented by `fund_project(project_id)`, which is marked as `@gl.public.write.payable`. The contribution amount comes from `gl.message.value`. The contract rejects zero-value payments with `gl.vm.UserError("No GEN sent")`, reads the creator wallet from `project["wallet"]`, records funding state, and emits a value transfer.

The contract uses this recipient interface:

```python
@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass
```

The value transfer is emitted with:

```python
_Recipient(Address(creator_wallet)).emit_transfer(value=amount)
```

`fund_project` updates `raised_gen`, `donor_count`, and `last_donor`, then appends a donation record with `project_id`, `wallet`, `amount_gen`, and `timestamp`. `get_funders(project_id)` returns donor records for a project.

### Dispute Review

Reports are handled by the dispute contract. It reads the project from the main Genatio contract, prevents duplicate flags, prevents creators from flagging their own project, and runs dispute review through a leader/validator flow.

The dispute leader checks flag reasons against project and GitHub evidence, returns `1` for a valid flag and `0` for an invalid flag, and the dispute validator only checks that the result is `0` or `1`. A valid flag can call the main contract callback to reject the project and can blacklist the creator wallet. The dispute read methods expose flag, reporter, blacklist, and resolution state.

---

## GenLayer Methods Used

### Verification

- `gl.nondet.web.get()` - GitHub repository and commit activity fetching
- `gl.nondet.web.render()` - live URL text rendering
- `gl.nondet.exec_prompt()` - project scoring and dispute evaluation
- `gl.vm.run_nondet_unsafe()` - leader/validator nondeterministic execution
- `gl.vm.Return` - validator result type check

For project verification, the leader performs the full project scoring. The current testnet release uses a lightweight validator that checks the returned score is an integer from `0` to `100`.

For disputes, the leader evaluates report reasons against project and GitHub evidence. The dispute validator checks that the result is either `0` or `1`.

### Funding

- `@gl.public.write.payable` - payable funding method
- `gl.message.value` - GEN amount sent with `fund_project`
- `@gl.evm.contract_interface` - recipient interface for value transfer
- `Address()` - creator wallet address handling
- `emit_transfer(value=amount)` - emitted creator payout after finalization
- `gl.vm.UserError` - invalid payable funding case handling

### Identity, Timestamps, and State

- `gl.message.sender_address` - wallet identity for creators, contributors, reporters, and owner checks
- `gl.message_raw["datetime"]` - timestamps for projects, donations, and disputes
- `@gl.public.view` - read methods
- `@gl.public.write` - write methods
- `TreeMap[str, str]` - campaigns, rejected projects, and dispute records
- `DynArray[str]` - blacklist and donations
- `u256` - numeric values such as goals, durations, scores, contribution amounts, raised totals, and donor counts

Campaigns, rejected submissions, donations, disputes, and dispute records are stored as JSON strings so the frontend can retrieve and render structured records consistently.

### Cross-Contract Dispute Flow

- `gl.get_contract_at(Address(...))` - main contract access from the dispute contract
- main contract project lookup from the dispute contract
- `main.emit(on="accepted").reject_project(project_id)` - dispute callback to reject a project

---

## Result Types

| Result | Meaning |
| --- | --- |
| Active | The project met the verification threshold and is listed for funding. |
| Rejected | The project did not meet the verification threshold and is stored in rejected submissions. |
| Ended | The project creator closed the campaign. |
| Report Valid | A dispute review confirmed the report and can reject the project through the main contract callback. |
| Report Invalid | A dispute review dismissed the report and leaves the project listed. |

---

## Configuration & Environment Setup

Use frontend-safe `NEXT_PUBLIC_*` values. Do not commit `.env.local`, and do not add private keys, seed phrases, mnemonics, or backend secrets. Vercel environment variables are recommended for production.

```env
NEXT_PUBLIC_GENATIO_CONTRACT_ADDRESS=0x9b759C76bCB3e0ACB9Df28dD57575F5c371d2E95
NEXT_PUBLIC_GENATIO_DISPUTE_CONTRACT_ADDRESS=0xd39820b6d9F55231B14e55336AAeeF8a50a61562
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_GENATIO_CONTRACT_ADDRESS` | Deployed main Genatio Intelligent Contract address. |
| `NEXT_PUBLIC_GENATIO_DISPUTE_CONTRACT_ADDRESS` | Deployed Genatio Dispute Intelligent Contract address. |

`frontend/.env.local` is for local development only. Vercel should receive the same public environment variables for deployment.

---

## Local Development

Install dependencies:

```bash
git clone <repo-url>
cd genatio
cd frontend
npm install
```

Start the local app:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

---

## Deployment

The frontend can be deployed on Vercel from GitHub.

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Use `frontend` as the frontend root directory.
4. Add the required environment variables.
5. Deploy.

Useful verification command:

```bash
npm run build
```

---

## Planned Features

### Campaign Share Pages

Future versions may add cleaner public share pages for verified campaigns, making it easier for builders to promote approved projects and for supporters to review project evidence before funding.

### Richer Funding and Dispute Records

Future versions may add more detailed campaign metadata, funding summaries, donor views, and dispute outcomes so builders and supporters can better understand project records from contract-backed data.

---

## Project Status

Genatio is a current Bradbury Testnet release focused on verified open source project funding.

Contract addresses may change after redeployment. The current release uses lightweight validator checks for demo stability and lower timeout risk.

---

## License

License to be added.
