# D20 Dashboard - Agent Instructions

## Project Overview

D20 Dashboard is a multi-module analytics platform for D20 Industries, LLC. It integrates RTS,
DA Performance, and CDF/DSB data into a unified React app deployable to GitHub Pages and a VPS.
All modules share a common theme, layout shell, and design system.

## Project Location

- **Local root**: `/home/jrod/CODE_PROJECTS/D20_Dashboard`
- **GitHub repo**: `https://github.com/sirjroddingham/D20_Dashboard`
- **All source** lives under `src/`. No nested subdirectory — the repo root IS the project root.
- **Data files** live under `/home/jrod/CODE_PROJECTS/D20_Scorecard/`

## Commands

```bash
npm run dev       # Vite dev server (hot reload) — uses .env (VITE_BASE_PATH=/)
npm run build     # tsc -b && vite build — uses .env.production (VITE_BASE_PATH=/)
npm run lint      # eslint .
npm run preview   # vite preview (serve production build)

# GitHub Pages build (temporary remote testing):
npx vite build --mode production.github   # uses .env.production.github (VITE_BASE_PATH=/D20_Dashboard/)
```

**Important**: There are **no tests** in this repo. Do not attempt to run a test suite.

## Architecture

### Routing
- Uses `react-router-dom` with `HashRouter` (for GitHub Pages compatibility).
- Will switch to `BrowserRouter` when deployed to the VPS server.
- Routes are defined in `App.tsx`. All pages live under `src/pages/`.
- **Playwright must use `#/` prefix** for HashRouter (e.g., `http://localhost:5173/#/da-performance`).

### Layout Shell
- `src/components/Layout.tsx` — wraps all pages: collapsible Sidebar + top bar + `<Outlet />`
- `src/components/Sidebar.tsx` — collapsible sidebar navigation
- Sidebar open/closed state is persisted in `localStorage` via `useLayoutStore`.

### State / Stores (`src/store/`)
- `useRTSStore.ts` — RTS module data, filters, and derived state
- `useDAPerformanceStore.ts` — DA Performance: merge-on-upload (idempotent by week+transporterId), trailing averages cached in state
- `useCDFSBStore.ts` — CDF/DSB module (**stub**, not yet implemented)
- `useThemeStore.ts` — dark/light mode, persists to `localStorage` key `d20-dashboard-theme`
- `useLayoutStore.ts` — sidebar open/closed state

### Pages (`src/pages/`)
- `RTSDashboard.tsx` — RTS charts, filters, and detail table (fully functional)
- `DAPerformance.tsx` — DA Performance rankings with multi-week merge, trailing averages (fully functional)
- `CDFSB.tsx` — CDF/DSB (**placeholder**, not yet implemented)

### Data / Lib (`src/lib/`)
- `scorecard/types.ts` — ScorecardRow, Metric, DATrailingAvg types
- `scorecard/parseScorecard.ts` — Header-driven CSV parser, weighted score calculation, perfect thresholds
- `rts/types.ts` — RTS-specific types
- `headerMap.ts` — Header mapping utilities
- `colors.ts` — Shared color constants
- `echartsThemes.ts` — ECharts theme definitions
- `utils.ts` — Shared utilities

### CSV Upload
- `CSVUpload.tsx` — Generic upload component with `onParsed` callback, NOT coupled to any store.
- `ScorecardCSVUpload.tsx` — DA Performance-specific upload with drag-and-drop, compacts to header row.

## Scoring Rules (from `Code.js`)

### Metrics
- **Safety** (5 metrics, excludes FICO): Speeding, Seatbelt-Off, Distractions, Sign/Signal, Following Distance
- **Quality** (5 metrics, excludes PSB): CDF DPMO, CED, DCR, DSB DPMO, POD
- Each metric has `score * (weight/100)`, normalized to standard weights (52.1 safety, 48.2 quality) when total weight differs.

### Perfect Thresholds
- Perfect Overall: 99.995
- Perfect Safety: 52.095
- Perfect Quality: 48.195

### Rankings
- Top/Bottom 10 per category per week
- Perfect-score expansion: if >N perfect scorers exist, show all perfect instead of top N
- Trailing Averages (multi-week): grouped by transporterId, scores averaged, packages summed
- Heat map coloring: 90%+ green, 80% yellow-green, 70% yellow, 60% orange, 50% red-orange, <50% red
- "No Safety Data" section for DAs without safety metrics

### Key Identifiers
- **Transporter ID** is the guaranteed-unique primary key for DA joins.
- Scorecard CSV is self-contained: includes `Packages Delivered` — no separate upload needed.
- Scorecard CSV header `"Delivery Associate "` has a trailing space — must trim.

## Styling

- **Dark mode** uses `data-theme` attribute on `<html>` toggled by `ThemeProvider`.
- CSS variables are defined in `src/index.css` for both `[data-theme="light"]` and `[data-theme="dark"]`.
- Tailwind is configured via `@tailwindcss/vite` plugin in `vite.config.ts`.

## Environment / Deployment

### .env files
- `.env` — local dev (`VITE_BASE_PATH=/`)
- `.env.production` — VPS server build (`VITE_BASE_PATH=/`)
- `.env.production.github` — GitHub Pages build (`VITE_BASE_PATH=/D20_Dashboard/`)

### Deployment targets
- **GitHub Pages** (temporary): `https://sirjroddingham.github.io/D20_Dashboard/`
  Uses `HashRouter` — no server-side redirect needed.
- **VPS (Ubuntu)**: Dedicated server, nginx with `try_files $uri /index.html`.
  Will switch to `BrowserRouter` at that time.

## Charts (ECharts)

- **Pie Chart**: Hover-only labels, click-to-filter on RTS codes. No static labels to avoid overlap.
- **Stacked Bar Chart**: Default shows "OODT" + "Other RTS". When filters are active, dynamically
  stacks all unique RTS codes from the filtered dataset. Uses `dataZoom` slider + `axis.interval: 'auto'`
  to prevent date label overlap.
- **ScoreDistributionChart**: Renders pie charts for Overall/Safety/Quality score bucket distributions.

## Gotchas

- `tsc -b` is required before `vite build` — project uses TypeScript project references.
- Dark/light theming is handled through `useThemeStore` which persists preference in `localStorage`.
- **Zustand v5**: Selectors returning new objects/arrays cause infinite re-renders — must cache in state.
- **Scorecard CSV header** `"Delivery Associate "` has a trailing space — parser must trim.
- **Multi-week merge**: `selectedWeek` must be synced to `mostRecentWeek` via `useEffect` on upload, otherwise `weekRows` returns ALL rows from ALL weeks, causing duplicate React keys.
- **Trailing Averages**: Only appears when 2+ weeks are loaded. Shows top/bottom 30 per category.

## Available Data Files

- Scorecard W15: `D20_Scorecard/Scorecard_Overall/DSP_Overview_Dashboard_D2IN_DGF1_2026-W15.csv` (80 DAs)
- Scorecard W17: `D20_Scorecard/DA_BONUS/Week 17-2026/DSP_Overview_Dashboard_D2IN_DGF1_2026-W17.csv`
- Scorecard W18: `D20_Scorecard/DA_BONUS/Week 18-2026/DSP_Overview_Dashboard_D2IN_DGF1_2026-W18.csv`
- Scorecard W19: `D20_Scorecard/DA_BONUS/Week 19-2026/DSP_Overview_Dashboard_D2IN_DGF1_2026-W19.csv` (80 DAs)
- CDF W19: `D20_Scorecard/DA_BONUS/Week 19-2026/DSP_Customer_Delivery_Feedback_negative_DGF1_2026-W19.csv` (57 rows)
- DSB W19: `D20_Scorecard/DA_BONUS/Week 19-2026/DSP_Delivery_Concessions_DGF1_2026-W19.csv` (17 rows)

## Progress

### Done (Phase 1)
- Full repo rename, routing shell, `Layout`, collapsible `Sidebar`, `ThemeToggle`, placeholder pages
- RTS dashboard fully functional with upload, parsing, filtering, charts, detail table
- DA Performance tab fully implemented:
  - Scorecard CSV parser with header-driven column mapping, resilient to column reorder
  - `useDAPerformanceStore` with merge-on-upload (idempotent by week+transporterId)
  - Week selector with auto-select on new upload
  - Overall/Safety/Quality ranking tables (top/bottom 10)
  - Perfect-score expansion (shows all if >10 perfect scorers)
  - Heat map coloring per Code.js thresholds
  - "No Safety Data" section for DAs without safety metrics
  - Score distribution pie charts per category (echarts)
  - Trailing Averages (top/bottom 30, multi-week)
  - Multi-week merge verified with 0 console errors

### Pending (Phase 2)
- CDF/DSB combined tab — not yet started
  - Define CDFRow and DSBRow types from sample files
  - Write CDF and DSB CSV parsers (both join on Transporter ID)
  - Build `useCDFSBStore` — accepts both CDF and DSB uploads, merges into unified per-DA defect summary
  - CDF/DSB page: combined defect tables, DPMO column (joins to `useDAPerformanceStore` by transporterId)
  - CDF/DSB page: category breakdown chart and defect-free vs with-defects split chart
