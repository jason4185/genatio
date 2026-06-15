# Genatio Frontend

Next.js 15 frontend for Genatio.

---

## Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 + TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| UI | shadcn/ui |
| Animations | Framer Motion + Canvas API |
| Wallet | RainbowKit + wagmi v2 + viem |
| Blockchain | genlayer-js |
| Fonts | Plus Jakarta Sans + JetBrains Mono |
| Theme | next-themes |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/browse` | Browse all projects |
| `/submit` | Submit a project |
| `/project/[id]` | Project detail |
| `/verify` | Verification result |

---

## API Routes

| Route | Cache |
|-------|-------|
| `/api/projects` | 60s |
| `/api/project/[id]` | 60s |
| `/api/flags/[id]` | 60s |
| `/api/my-flags` | 60s |
