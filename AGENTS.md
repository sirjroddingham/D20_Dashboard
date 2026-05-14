# D20 Dashboard - Agent Instructions

## Project Overview

D20 Dashboard is a multi-module analytics platform for D20 Industries, LLC. It is being expanded
from the original single-page RTS Dashboard into a full suite of reporting tools including
DA Performance and CDF/DSB modules. All modules share a common theme, layout shell, and design system.

## Project Location

- **Local root**: `/home/jrod/CODE_PROJECTS/D20_Dashboard`
- **GitHub repo**: `https://github.com/sirjroddingham/D20_Dashboard`
- **All source** lives under `src/`. No nested subdirectory — the repo root IS the project root.

## Commands

```bash
npm run dev       # Vite dev server (hot reload) — uses .env (VITE_BASE_PATH=/)
npm run build      # tsc -b && vite build — uses .env.production (VITE_BASE_PATH=/)
npm run lint        # eslint .
npm run preview     # vite preview (serve production build)

# GitHub Pages build (temporary remote testing):
npx vite build --mode production.github   # uses .env.production.github (VITE_BASE_PATH=/D20_Dashboard/)
```

**Important**: There are **no tests** in this repo. Do not attempt to run a test suite.

## Architecture

### Routing
- Uses `react-router-dom` with `HashRouter` (for GitHub Pages compatibility).
- Will switch to `BrowserRouter` when deployed to the VPS server.
- Routes are defined in `App.tsx`. All pages live under `src/pages/`.

### Layout Shell
- `src/components/Layout.tsx` — wraps all pages: collapsible Sidebar + top bar + `<Outlet />`
- `src/components/Sidebar.tsx` — collapsible sidebar navigation
- Sidebar open/closed state is persisted in `localStorage` via `useLayoutStore`.

### State / Stores (`src/store/`)
- `useRTSStore.ts` — RTS module data, filters, and derived state
- `useDAPerformanceStore.ts` — DA Performance module (stub, to be built)
- `useCDFStore.ts` — CDF/DSB module (stub, to be built)
- `useThemeStore.ts` — dark/light mode, persists to `localStorage` key `d20-dashboard-theme`
- `useLayoutStore.ts` — sidebar open/closed state

### Pages (`src/pages/`)
- `RTSDashboard.tsx` — existing RTS charts, filters, and detail table
- `DAPerformance.tsx` — DA Performance reporting (in development)
- `CDFSB.tsx` — CDF/DSB reporting (in development)

### Data / Lib (`src/lib/`)
- `rts/` — RTS-specific: `headerMap.ts`, `utils.ts`, `types.ts`
- `da/` — DA Performance: `headerMap.ts`, `types.ts` (stubs)
- `cdf/` — CDF/DSB: `headerMap.ts`, `types.ts` (stubs)
- `shared/` — Shared utilities: date parsing, generic helpers

### CSV Upload
- `CSVUpload.tsx` accepts an `onParsed` callback prop — it is NOT coupled to any specific store.
- Each page provides its own handler and schema target.

## Styling

- **Dark mode** uses `data-theme` attribute on `<html>` toggled by `ThemeProvider`.
- CSS variables are defined in `src/index.css` for both `[data-theme="light"]` and `[data-theme="dark"]`.
- ECharts tooltips use `.echarts-tooltip-custom` class for custom styling.
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

## Gotchas

- `tsc -b` is required before `vite build` — project uses TypeScript project references.
- Dark/light theming is handled through `useThemeStore` which persists preference in `localStorage`.
- The FilterBar RTS toggles are checkbox-based multi-select managed in `useRTSStore`.
- DetailTable shows columns: Delivery Associate, Tracking ID, Impact DCR, RTS Code,
  Additional Info, Exemption Reason, Planned Delivery Date. Supports column search and 50-row pagination.
