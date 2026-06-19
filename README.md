# Genatio
Trustless open source grants on GenLayer Bradbury.

**Live Demo:** https://genatio.xyz

## What it does
- GenLayer Intelligent Contracts verify every project submission through Optimistic Democracy
- Five independent validators fetch GitHub data and score projects on-chain
- Community funds verified projects directly — peer-to-peer, no custody, no intermediary
- Suspicious projects can be flagged and re-investigated by a dispute contract automatically

## Quick Demo
```
git clone https://github.com/jason4185/genatio
cd genatio/frontend
npm install
npm run dev
```

Open `http://localhost:3000`, connect your wallet, and submit a project with a real GitHub URL to see the full verification flow.

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
2. GenLayer Intelligent Contract fetches GitHub data and scores the project through Optimistic Democracy
3. Projects scoring 40+ go live immediately — community funds them directly wallet-to-wallet
4. Anyone can flag suspicious projects — dispute contract re-investigates using the same AI pipeline

## Contracts
| Contract | Address |
|----------|---------|
| Genatio | `0xD666F066dCDb27BFFffCc8869c66b2E6A246F1F0` |
| GenatioDispute | `0x49dbBed1fE59f0c868a71Fc57268b943FddF657d` |

Network: GenLayer Bradbury · Chain ID: 4221

## Project Structure
```
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
```

## GenLayer Features Used
- `gl.nondet.web.get()` — GitHub API fetching
- `gl.nondet.web.render()` — Live URL verification
- `gl.nondet.exec_prompt()` — AI project scoring and flag evaluation
- `gl.vm.run_nondet_unsafe()` — Custom validator for consensus
- `gl.vm.Return` — Validator type check in validator_fn
- `gl.message.sender_address` — Wallet identity on every write method
- `gl.message_raw['datetime']` — On-chain timestamps
- `@gl.public.view` — All read methods
- `@gl.public.write` — All write methods
- `gl.get_contract_at().view()` — Cross-contract reads
- `gl.get_contract_at().emit()` — Cross-contract writes
- `Address()` — Contract address handling
- `TreeMap[str, str]` — campaigns and rejected project storage
- `DynArray[str]` — blacklist storage
- `u256` — Numeric type for scores and amounts

**Total: 15 GenLayer methods across 7 categories**

## Status

### MVP 1 — Current (Live)
- ✅ Project submission with AI verification through Optimistic Democracy
- ✅ Direct peer-to-peer GEN funding — wallet to wallet, no custody
- ✅ Community flag and dispute resolution with independent evidence re-fetching
- ✅ Dashboard with submission and flag history
- ✅ Rejected project storage on-chain with resubmission support
- ✅ Live at genatio.xyz on GenLayer Bradbury

### MVP 2 — Planned
- 📱 Mobile responsive design — full support for all screen sizes and touch devices
- 🏆 Milestone-based fund release — funds released in 30/40/30 splits as a project hits verified milestones
- 🔍 On-chain donation verification — independently confirm GEN transfers between donor and creator wallets before updating funding stats

---

## Feedback

Genatio is an active GenLayer Builder Program submission. Issues, suggestions, and pull requests are welcome on GitHub. If you find a bug in the verification or dispute logic, please open an issue with the transaction hash so it can be traced on the Bradbury explorer.

---

## Prerequisites
- Node.js 18+
- [Rabby Wallet](https://rabby.io) — recommended for best experience on GenLayer Bradbury
- Testnet GEN from the [GenLayer Faucet](https://faucet.genlayer.com)

Built by [Jason](https://x.com/ja__so)

**P.S.** Genatio is itself an open source project — anyone can submit it on Genatio and let the Intelligent Contract verify it.
