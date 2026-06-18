# Genatio
Trustless open source grants on GenLayer Bradbury.

**Live Demo:** https://genatio.xyz

## What it does
- GenLayer Intelligent Contracts verify every project submission through Optimistic Democracy
- Five independent validators fetch GitHub data and score projects on-chain
- Community funds verified projects directly — no intermediary
- Suspicious projects can be flagged and re-investigated by a dispute contract automatically

## Quick Demo
Prerequisites: Node 18+, Rabby Wallet, GenLayer Bradbury configured (chain id 4221)
git clone https://github.com/jason4185/genatio

cd genatio/frontend

npm install

npm run dev

Open http://localhost:3000, connect wallet, submit a project with a GitHub URL, and wait for verification.

## UI Tour

### Landing Page
Genatio greets visitors with live on-chain stats and active projects verified by GenLayer Intelligent Contracts. Connect your wallet to submit a project or fund one directly.

![Genatio Home](screenshots/home.png)

### Browse Projects
All verified projects are listed publicly. Browse active grants, see AI verification scores, and fund projects you believe in directly on-chain.

![Browse Projects](screenshots/browse.png)

### Submit Project
Builders submit their open source project with a GitHub URL, project story, and funding goal. GenLayer Intelligent Contracts fetch the GitHub data and score the project through Optimistic Democracy — no human reviews anything.

![Submit Project](screenshots/submit.png)

### Flag a Project
Community members can flag suspicious projects. A dispute Intelligent Contract re-investigates using the same AI verification pipeline and executes the outcome automatically on-chain.

![Flag Project](screenshots/flag.png)

## How it works
1. Creator connects wallet and submits project with GitHub URL and funding goal
2. GenLayer Intelligent Contract fetches GitHub data and scores project through Optimistic Democracy
3. Projects scoring 40+ go live immediately — community funds them directly on-chain
4. Anyone can flag suspicious projects — dispute contract re-investigates using same AI pipeline

## Contracts
| Contract | Address |
|----------|---------|
| Genatio | `0x544B6dEb105a02f585f0Aa3aef6398B5E9cD5B77` |
| GenatioDispute | `0x4dE9635b81DbfbC9E590C868d698dAF09f20C46E` |

Network: GenLayer Bradbury · Chain ID: 4221

## Project Structure
genatio/

├── contract/

│   ├── Genatio.py              # Main Intelligent Contract

│   └── GenatioDispute.py       # Dispute Intelligent Contract

├── frontend/

│   ├── app/                    # Next.js pages and API routes

│   ├── components/             # UI components

│   ├── hooks/                  # Contract data hooks

│   └── lib/                    # Contract addresses and wallet config

└── README.md

## GenLayer Features Used
- `gl.nondet.web.get()` — GitHub API fetching
- `gl.nondet.web.render()` — Live URL verification
- `gl.nondet.exec_prompt()` — AI project scoring and flag evaluation
- `gl.vm.run_nondet_unsafe()` — Custom validator for consensus
- `gl.vm.Return` — Validator type check in validator_fn
- `gl.message.sender_address` — Wallet identity on every write method
- `gl.message.value` — GEN donation amount
- `gl.message_raw['datetime']` — On-chain timestamps
- `@gl.public.view` — All read methods
- `@gl.public.write` — All write methods
- `@gl.public.write.payable` — Payable fund method
- `@gl.evm.contract_interface` — EOA GEN transfer wrapper
- `emit_transfer()` — Send GEN directly to creator wallet
- `gl.get_contract_at().view()` — Cross-contract reads
- `gl.get_contract_at().emit()` — Cross-contract writes
- `Address()` — Contract address handling
- `TreeMap[str, str]` — campaigns and rejected project storage
- `DynArray[str]` — donations and blacklist storage
- `u256` — Numeric type for GEN amounts and scores

**Total: 19 GenLayer methods across 8 categories**

## Status

### MVP 1 — Current (Live)
- ✅ Project submission with AI verification through Optimistic Democracy
- ✅ Community flag and dispute resolution
- ✅ Dashboard with submission and flag history
- ✅ Rejected project storage on-chain
- ✅ Live at genatio.xyz on GenLayer Bradbury
- ⏳ GEN donations are implemented in the contract using `@gl.public.write.payable` and `emit_transfer` to send GEN directly to creator wallets. Value transfers on Bradbury Phase 1 are still maturing — the fund button is currently disabled on the frontend until transfers are fully stable.

### MVP 2 — Planned
- 💰 Full GEN funding flow — donors send GEN directly to creator wallet once Bradbury value transfers are fully stable
- 📱 Mobile responsive design — full support for all screen sizes and touch devices
- 🏆 Milestone-based fund release — funds released in 30/40/30 splits as project hits verified milestones

## Prerequisites
- Node.js 18+
- [Rabby Wallet](https://rabby.io) — recommended for best experience on GenLayer Bradbury
- Testnet GEN from the [GenLayer Faucet](https://faucet.genlayer.com)

Built by [Jason](https://x.com/ja__so)

**P.S.** Genatio is itself an open source project — anyone can submit it on Genatio and let the Intelligent Contract verify it.
