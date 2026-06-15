# Genatio Frontend

Next.js frontend for the Genatio grant platform.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Components | shadcn/ui |
| Animations | Framer Motion + Canvas API |
| Wallet | RainbowKit + wagmi v2 + viem |
| Blockchain | genlayer-js |
| Fonts | Plus Jakarta Sans · JetBrains Mono |
| Theme | next-themes (Light / Dark / System) |

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page — hero, live stats ticker, active project cards, animated background |
| `/browse` | Browse all projects — active and ended tabs, live funding progress, score rings |
| `/submit` | 3-step project submission form — validates input, submits to GenLayer contract, waits for AI verification result |
| `/project/[id]` | Project detail — funding progress, countdown, funders list, flag modal with dispute flow |
| `/verify` | Verification result page — animated score ring, approved/rejected status after submit |

---

## Hooks

| Hook | Description |
|---|---|
| `useProjects` | Fetches and polls all projects by status every 2 minutes |
| `useProject` | Fetches a single project by ID |
| `useFunders` | Fetches the funder list for a project from the GenLayer contract |
| `useStats` | Derives platform-wide stats (total raised, project count, donor count) from active projects |
| `useWallet` | Thin wrapper around wagmi `useAccount` for connected address and connection state |

---

## API Routes

| Route | Description |
|---|---|
| `GET /api/projects?status=active` | Returns all projects filtered by status from the GenLayer contract |
| `GET /api/project/[id]` | Returns a single project by ID |
| `GET /api/flags/[id]` | Returns flag/dispute data for a project |
| `GET /api/my-flags` | Returns flags raised by the connected wallet |

---

## Design Tokens

All colors are CSS custom properties — no hardcoded hex values in components.

### Dark mode (default)
```
--color-background:      #060B18
--color-surface:         #0C1220
--color-elevated:        #121929
--color-border-subtle:   #1E2D45
--color-accent-blue:     #2D9CDB
--color-accent-cyan:     #00C6FF
--color-success:         #27AE60
--color-danger:          #EB5757
--color-text-primary:    #F0F4FF
--color-text-secondary:  #8899AA
--color-text-muted:      #4A5568
```

Semi-transparent values use `rgba(var(--color-background-rgb), 0.N)` and `color-mix(in srgb, var(--color-X) N%, transparent)` — no hardcoded rgba.

---

## Components

| Component | Description |
|---|---|
| `Navbar` | Fixed navbar with scroll blur, Framer Motion slide-in, mobile slide panel |
| `Logo` | SVG shield + checkmark icon with optional wordmark, all CSS variables |
| `AnimatedBackground` | Canvas particle field rendered behind all pages |
| `ProjectCard` | Card with score ring, funding progress bar, status badge |
| `ScoreRing` | Animated SVG ring displaying AI verification score |
| `FundingProgress` | Animated bar showing raised vs goal |
| `LiveStatsCard` | Platform stats with animated counters |
| `VerificationTicker` | Scrolling ticker of recent verification activity |
| `ThemeToggle` | Light/dark toggle using next-themes |
| `NotificationBell` | Bell icon in navbar for flag/dispute notifications |
| `Providers` | Wraps app with RainbowKit + wagmi + react-query providers |
| `ThemeProvider` | next-themes wrapper |
