# Genatio Frontend

> Next.js 15 frontend for the Genatio trustless grant app.

---

## Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 15 + TypeScript |
| Styling | Tailwind CSS + CSS Custom Properties |
| UI Components | shadcn/ui |
| Animations | Framer Motion + Canvas API |
| Wallet | RainbowKit + wagmi v2 + viem |
| Blockchain | genlayer-js |
| Fonts | Plus Jakarta Sans + JetBrains Mono |
| Theme | next-themes (Light / Dark / System) |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with live stats, project grid, verification ticker |
| `/browse` | Browse all projects with search, filters, and sort |
| `/submit` | Multi-step project submission form |
| `/project/[id]` | Project detail with funding card, verification card, flag modal |
| `/verify` | Verification result with animated score ring |

---

## Hooks

| Hook | Description |
|------|-------------|
| `useProjects` | Fetches active/ended projects from `/api/projects` |
| `useProject` | Fetches single project from `/api/project/[id]` |
| `useStats` | Derives app stats from project data |
| `useWallet` | Thin wrapper around wagmi `useAccount` |

---

## API Routes

| Route | Description | Cache |
|-------|-------------|-------|
| `/api/projects` | Returns projects by status from contract | 60s |
| `/api/project/[id]` | Returns single project by ID | 60s |
| `/api/flags/[id]` | Returns flag data for a project | 60s |
| `/api/my-flags` | Returns flags raised by a wallet | 60s |

All API routes cache contract reads server-side to prevent rate limiting on the Bradbury RPC.

---

## Design System

| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `--color-background` | `#060B18` | `#EEF2F7` |
| `--color-surface` | `#0C1220` | `#F8FAFC` |
| `--color-accent-blue` | `#2D9CDB` | `#1D6FA4` |
| `--color-text-primary` | `#F0F4FF` | `#0F172A` |
| `--color-success` | `#27AE60` | `#15803D` |
| `--color-danger` | `#EB5757` | `#B91C1C` |

---

## Key Features

- **Server-side caching** — API routes cache Bradbury RPC responses for 60 seconds preventing rate limits under high traffic
- **Optimistic UI** — Projects appear immediately after ACCEPTED status without waiting for FINALIZED
- **Theme aware** — All colors use CSS variables — zero hardcoded hex values
- **Wallet gated actions** — Submit, Fund, and Flag require wallet connection
- **Flag notifications** — Flaggers see investigation results via contract reads on return visit
