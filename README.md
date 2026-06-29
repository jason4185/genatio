# Genatio

Genatio is a GenLayer-powered verified open source grants and crowdfunding platform.

Genatio helps open source builders raise GEN from supporters after their project is verified by a GenLayer Intelligent Contract.

Genatio is a verified growth platform for open source builders. Projects are reviewed by a GenLayer Intelligent Contract using GitHub, live project, story, and funding-purpose evidence before they can receive community funding.

---

## Live Demo

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
8. Project story quality
9. Community engagement
10. Live URL accessibility
11. Project consistency

Projects with a score of `40` or higher become active campaigns. Projects below that threshold are stored in `rejected` and are not listed as active.

### How the Live Flow Works

Live workflow:

1. A builder connects a wallet.
2. The builder submits a title, story, GitHub repository, live URL, funding purpose, GEN goal, and campaign duration.
3. The Genatio Intelligent Contract runs project verification through GenLayer's leader/validator workflow.
4. Approved projects are stored as active campaigns.
5. Supporters fund active projects through the payable `fund_project` method.
6. The frontend reads project, funding, donor, and dispute state back from GenLayer-backed routes and contract calls.

The current testnet release keeps validator checks lightweight to reduce timeout risk, while the leader performs the full Genatio project scoring.

---

## The Vision

Open source builders need practical ways to fund continued development. Supporters need better proof before contributing to a project.

Genatio adds an evidence-based verification step before crowdfunding. It uses GenLayer Intelligent Contracts to review public project evidence and store the outcome in contract state.

The goal is not to overclaim security or replace all human judgment. The goal is to make open source funding pages more structured, transparent, and evidence-aware before supporters contribute GEN.

---

## What Genatio Is

Genatio is a verified open source funding platform built on GenLayer.

It follows a focused funding path:

```text
Project Evidence -> GenLayer Verification -> Active Campaign -> GEN Contribution -> Finalized Payout
```

- **Project Evidence:** Builder-submitted title, story, GitHub repository, live URL, funding purpose, goal, and duration.
- **GenLayer Verification:** The Intelligent Contract checks repository, activity, live URL, story, and funding-purpose evidence.
- **Active Campaign:** Projects that meet the score threshold are listed for supporters.
- **GEN Contribution:** Supporters submit payable `fund_project` transactions.
- **Finalized Payout:** The contract emits value transfer to the creator wallet, and creator payout completes after finalization.

---

## Current App Status

Genatio currently supports an end-to-end Bradbury Testnet funding flow: a builder can submit a project, wait for GenLayer verification, appear as an active campaign if approved, receive supporter contributions through `fund_project`, and view wallet-scoped project state from the dashboard.

Current working pieces include:

- project submission with GenLayer verification
- active and rejected project storage
- payable GEN funding through the main Intelligent Contract
- funding state updates for `raised_gen`, `donor_count`, and `last_donor`
- donor history through `donations` and `get_funders(project_id)`
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
- project story and funding purpose
- funding goal and raised amount
- donor count and latest donor
- donor history when available
- wallet-scoped submitted projects
- rejected project state
- report and dispute outcomes

Funding and donor state are backed by the current Genatio contracts.

---

## Key Innovations

### 1. Verification Before Funding

Genatio does not list every submitted campaign by default. The main contract runs `_verify_campaign` before a project can become active.

### 2. GenLayer-Native Review Path

The review flow uses GenLayer nondeterministic execution. The leader gathers project evidence and proposes a score, while the validator checks that the returned score is valid.

### 3. On-Chain Campaign Storage

Campaigns are stored in the main contract. Active campaigns, rejected submissions, funding fields, and donor history are readable by the frontend.

### 4. Wallet-Scoped Dashboard

The dashboard uses wallet identity to show a builder's submitted projects, rejected projects, and reports without presenting the app as a global admin console.

### 5. Structured Funding Records

Funding updates are stored as structured project fields and donation records. `get_funders(project_id)` returns project donor history.

### 6. Focused Testnet Validator Language

Genatio avoids presenting validator behavior as broader than it is. In the current testnet flow, the leader performs full scoring and the lightweight validator checks score shape and range.

---

## Technical Pillars

### GenLayer Intelligent Contract Backend

The Genatio backend is made of two Python Intelligent Contracts:

- `contract/Genatio.py` for submission, verification, campaign storage, funding, donor history, and dispute callbacks
- `contract/GenatioDispute.py` for project reports, dispute review, flag history, and dispute blacklist state

### Leader and Validator Review

`submit_project` calls `_verify_campaign`. `_verify_campaign` parses the GitHub owner and repository from `github_repo_url`.

The leader:

- fetches GitHub repository data with `gl.nondet.web.get`
- fetches commit history with `gl.nondet.web.get`
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
- `wallet`
- `title`
- `story`
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

### Frontend Audit Workspace

The frontend is built with:

- Next.js
- TypeScript
- GenLayer JS client
- Wagmi wallet integration
- RainbowKit wallet connection UI
- WalletConnect-compatible wallet flow through RainbowKit
- dashboard and project pages
- Vercel deployment

### Wallet-Scoped Audit Retrieval

Genatio uses wallet addresses to scope builder and reporter views. The dashboard loads projects and rejected submissions associated with the connected wallet, and report history can be read with `get_my_flags(wallet)`.

Project, funding, donor, and dispute state come from contract-backed reads and API routes. The frontend does not use browser `localStorage` or `sessionStorage` for project, funding, donor, or dispute state. Theme preference may be stored by the theme library only.

### Production-Oriented UX

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

`fund_project` updates `raised_gen`, `donor_count`, and `last_donor`, then appends a donation record with `project_id`, `wallet`, `amount_gen`, and `timestamp`. `get_funders(project_id)` returns donor history for a project.

Reports are handled by `flag_project(project_title, flag_reasons)` in the dispute contract. It reads the project from the main Genatio contract, prevents duplicate flags, prevents creators from flagging their own project, and runs dispute review through a leader/validator flow. The dispute leader checks flag reasons against project and GitHub evidence, returns `1` for a valid flag and `0` for an invalid flag, and the dispute validator only checks that the result is `0` or `1`. A valid flag can call the main contract callback to reject the project and can blacklist the creator wallet. `get_flags`, `get_dispute_history`, `get_my_flags`, and `get_blacklist` expose dispute state.

---

## GenLayer Methods Used

### `gl.vm.run_nondet_unsafe`

Used to run Genatio verification and dispute review through GenLayer's leader/validator model.

For project verification, the leader performs the full project scoring. The current testnet release uses a lightweight validator that checks the returned score is an integer from `0` to `100`.

For disputes, the leader evaluates report reasons against project and GitHub evidence. The dispute validator checks that the result is either `0` or `1`.

### `gl.message.sender_address`

Used to identify:

- the project creator in `submit_project`
- the contributor in `fund_project`
- the reporter in `flag_project`
- owner access for `set_dispute_contract`

### `TreeMap`

Used for persistent keyed storage:

- `campaigns` in the main Genatio contract
- `rejected` submissions in the main Genatio contract
- `dispute_history` in the Genatio Dispute contract

This keeps project, rejection, and dispute records retrievable by ID or wallet-scoped filtering.

### `u256`

Used for numeric contract values such as:

- `goal_gen`
- `duration_days`
- score parsing and comparison
- `gl.message.value`
- `raised_gen`
- `donor_count`

### JSON serialization

Campaigns, rejected submissions, donations, disputes, and dispute history are stored as JSON strings so the frontend can retrieve and render structured records consistently.

Additional GenLayer features used by Genatio include:

- `gl.nondet.web.get`
- `gl.nondet.web.render`
- `gl.nondet.exec_prompt`
- `gl.message.value`
- `gl.message_raw["datetime"]`
- `@gl.public.view`
- `@gl.public.write`
- `@gl.public.write.payable`
- `@gl.evm.contract_interface`
- `Address`
- `emit_transfer`
- `gl.get_contract_at`
- `main.emit(on="accepted").reject_project(project_id)`

---

## UI Tour

### 1. Landing Page

Screenshots will be added after the final production UI capture.

<!--
Recommended screenshots:
1. Landing page
2. Browse projects
3. Project detail and funding card
4. Submit project flow
5. Dashboard
6. Dispute/flag flow

Place future screenshots in:
docs/images/landing.png
docs/images/browse.png
docs/images/project-detail.png
docs/images/submit.png
docs/images/dashboard.png
docs/images/dispute.png
-->

The landing page introduces Genatio, platform stats, and approved project sections.

### 2. Audit Workspace

The submit flow lets builders connect a wallet and submit project details for GenLayer verification.

### 3. Audit In Progress

After submission, Genatio tracks the transaction and waits for the verification result to become available.

### 4. Audit Report

The verification result page shows the project score and whether the project met the listing threshold.

### 5. Dashboard

The dashboard gives connected wallets a scoped view of their submitted projects, rejected projects, and report history.

### 6. Examples

The browse and project detail pages provide examples of verified campaigns that supporters can inspect and fund.

---

## Audit Scope

Genatio checks:

- public GitHub repository evidence
- commit activity
- repository description quality
- license presence
- repository age
- funding purpose specificity
- project story quality
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

### Shareable Audit Reports

A future version may add cleaner share links for project verification results or campaign pages.

### Stronger Validator Verification Mode

A future version may add stricter validator checks once timeout behavior is better characterized on Bradbury Testnet.

### Richer Report Metadata

Future project and dispute records may include richer metadata for verification results, funding summaries, and report outcomes.

---

## Project Status

Genatio is a current Bradbury Testnet release focused on verified open source project funding.

Contract addresses may change after redeployment. The current release uses lightweight validator checks for demo stability and lower timeout risk.

---

## License

License to be added.
