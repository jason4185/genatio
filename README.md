# Genatio

> Trustless open source grants powered by GenLayer Intelligent Contracts.

**Live Demo:** https://genatio.xyz

---

## Overview

Genatio is a trustless open source grant app built entirely on GenLayer Bradbury. Every project that applies for funding is verified autonomously by a GenLayer Intelligent Contract through Optimistic Democracy — five independent validators fetch the GitHub data, score the project across several factors, and reach consensus on-chain. No human approves or rejects anything.

Approved projects go live immediately. The community funds them directly on-chain. If a project looks suspicious, anyone can flag it. A dispute Intelligent Contract re-investigates using the same AI verification pipeline and executes the outcome automatically through contract-to-contract calls.

---

## How It Works

| Step | Description |
|------|-------------|
| Submit | Connect wallet, add GitHub URL, set funding goal and duration |
| Verify | Intelligent Contract scores project through Optimistic Democracy |
| Fund | Community funds verified projects directly on-chain |
| Flag | Suspicious projects re-investigated by dispute contract |

---

## Tech Stack

### Smart Contracts
| Contract | Description |
|----------|-------------|
| `Genatio.py` | Main contract — verification, funding, dispute callbacks |
| `GenatioDispute.py` | Dispute contract — AI flag investigation, contract-to-contract calls |

### Frontend
| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 + TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| UI | shadcn/ui |
| Animations | Framer Motion + Canvas API |
| Wallet | RainbowKit + wagmi v2 + viem |
| Blockchain | genlayer-js |
| Theme | next-themes (Light / Dark / System) |

---

## Contract Addresses

| Contract | Address | Network |
|----------|---------|---------|
| Genatio | `0x544B6dEb105a02f585f0Aa3aef6398B5E9cD5B77` | GenLayer Bradbury |
| GenatioDispute | `0x4dE9635b81DbfbC9E590C868d698dAF09f20C46E` | GenLayer Bradbury |

**Chain ID:** 4221 · **RPC:** https://rpc-bradbury.genlayer.com · **Explorer:** https://explorer-bradbury.genlayer.com

---

## Repository Structure

```
genatio/
├── contract/
│   ├── Genatio.py              # Main Intelligent Contract
│   └── GenatioDispute.py       # Dispute Intelligent Contract
├── frontend/
│   ├── app/
│   │   ├── api/                # Server-side API routes with caching
│   │   │   ├── projects/       # Project list endpoint
│   │   │   ├── project/[id]/   # Single project endpoint
│   │   │   ├── flags/[id]/     # Flag data endpoint
│   │   │   └── my-flags/       # User flag history
│   │   ├── browse/             # Browse all projects
│   │   ├── dashboard/          # Personal project dashboard
│   │   ├── pending/            # Verification waiting page
│   │   ├── project/[id]/       # Project detail page
│   │   ├── submit/             # Submit project form
│   │   └── verify/             # Verification result page
│   ├── components/
│   │   ├── AnimatedBackground.tsx
│   │   ├── LiveStatsCard.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ScoreRing.tsx
│   │   └── VerificationTicker.tsx
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useProject.ts
│   │   ├── useStats.ts
│   │   └── useWallet.ts
│   └── lib/
│       ├── genatio.ts          # Contract addresses
│       └── wagmi.ts            # Wallet config
└── README.md
```

---

## GenLayer Features Used

- `gl.nondet.web.get()` — GitHub API data fetching
- `gl.nondet.web.render()` — Live URL verification
- `gl.nondet.exec_prompt()` — AI project scoring and flag evaluation
- `gl.vm.run_nondet_unsafe()` — Custom validator for verification and flag consensus
- `gl.vm.Return` — Validator type check
- `gl.message.sender_address` — Wallet identity on every write method
- `gl.message.value` — GEN amount in fund_project
- `gl.message_raw['datetime']` — On-chain timestamps
- `@gl.public.write.payable` — Payable fund_project method
- `@gl.evm.contract_interface` — EOA recipient wrapper for GEN transfers
- `emit_transfer()` — Send GEN to creator wallet
- `gl.get_contract_at()` — Cross-contract reference
- `.view()` — Read project data from main contract
- `.emit(on="accepted")` — Call reject_project on main contract
- `TreeMap[str, str]` — campaigns, rejected storage
- `DynArray[str]` — donations, blacklist, reports
- `@gl.public.view` — All read methods
- `@gl.public.write` — All write methods
- `Address()` — Contract address handling

**Total: 19 GenLayer methods across 8 categories**

---

## Getting Started

### Prerequisites
- Node.js 18+
- A wallet (MetaMask or Rabby)
- Testnet GEN from the [GenLayer Faucet](https://testnet-faucet.genlayer.foundation)

### Run Locally

```bash
git clone https://github.com/jason4185/genatio
cd genatio/frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

---

## Network

This app runs on **GenLayer Bradbury Testnet** — not for real funds.

---

Built by [Jason](https://x.com/ja__so) · Submitted to the [GenLayer Builder Program](https://genlayer.com/builders)
