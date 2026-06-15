# Genatio

> Trustless open source grants powered by GenLayer Intelligent Contracts.

**Live Demo:** https://www.genatio.xyz

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
| Genatio | `0x23a0342Edc685fcCb50b3e3C2a86318c93d79942` | GenLayer Bradbury |
| GenatioDispute | `0x569c9E3C9Ac23444D334710e507E1035fe09283F` | GenLayer Bradbury |

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
- `gl.nondet.exec_prompt()` — AI project scoring and flag review
- `gl.vm.run_nondet_unsafe()` — Custom validator logic
- `gl.message.sender_address` — Wallet identity
- `gl.message.value` — GEN donation amounts
- `gl.message_raw['datetime']` — On-chain timestamps
- `@gl.public.write.payable` — Payable funding method
- `gl.get_contract_at().view()` — Cross-contract reads
- `gl.get_contract_at().emit()` — Cross-contract writes
- `TreeMap`, `DynArray`, `u256` — Native storage types

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
