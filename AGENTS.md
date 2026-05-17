# D20 Dashboard - Agent Instructions

## Project Overview

D20 Industries analytics platform: RTS, DA Performance, and CDF defect data in a unified React app. Deployable to GitHub Pages (HashRouter) or VPS (BrowserRouter).

## Project Location

- **Local root**: `/home/jrod/CODE_PROJECTS/D20_Dashboard`
- **GitHub repo**: `https://github.com/sirjroddingham/D20_Dashboard`
- **All source** lives under `src/`. The repo root IS the project root.
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

**Dev server**: Always use `nohup npx vite --port 5173 > /tmp/vite.log 2>&1 & disown` to keep Vite alive in background. Kill with `pkill -f vite` when done testing.

## Architecture

### Routing
- `react-router-dom` with `HashRouter` (GitHub Pages). Routes in `App.tsx`, pages in `src/pages/`.
- **Playwright must use `#/` prefix** for HashRouter (e.g., `http://localhost:5173/#/da-performance`).
- Four routes: `/` → RTS, `/da-performance` → DA, `/cdf-dsb` → CDF, `/data` → Data Management.

### Layout Shell
- `src/components/Layout.tsx` — Sidebar + top bar + `<Outlet />` + footer
- `src/components/Sidebar.tsx` — collapsible (240px ↔ 64px), persisted via `useLayoutStore` (localStorage: `d20-dashboard-layout`)

### Central Data Store (`src/store/useDataSourceStore.ts`)
- **Single source of truth** for all 4 data types: RTS, Scorecard, CDF, DSB
- Each type has rows, loaded weeks, merge (idempotent by week+key), and clear actions
- Module-specific stores subscribe to this central store

### Module Stores (`src/store/`)
- `useRTSStore.ts` — subscribes to central store; filtered data, filter state
- `useDAPerformanceStore.ts` — subscribes to central store; scorecard rows, trailing averages
- `useCDFStore.ts` — derived hooks (not a Zustand store): filtered rows, employee summaries, DPMO, defect-free employees
- `useThemeStore.ts` — dark/light mode, localStorage `d20-dashboard-theme`, `themeVersion` timestamp for chart re-renders
- `useLayoutStore.ts` — sidebar open/closed, localStorage `d20-dashboard-layout`

### Pages (`src/pages/`)
- `RTSDashboard.tsx` — RTS charts, filters, detail table (fully functional)
- `DAPerformance.tsx` — DA rankings, multi-week merge, trailing averages (fully functional)
- `CDFSB.tsx` — CDF Defect Dashboard: charts, filters, ranking tables, detail table (fully functional; DSB data parsed but not yet displayed)
- `DataManagement.tsx` — Centralized upload hub with summary cards for all 4 data types

### Charts (`src/components/`)
- `StackedBarChart.tsx` — RTS stacked bar chart with dataZoom slider
- `RTSPieChart.tsx` — RTS distribution pie chart
- `CDFCharts.tsx` — `CDFCategoryChart` (pie), `CDFDefectsByDayChart` (stacked bar), `CDFDefectSplitChart` (pie, unused)
- `ScoreDistributionChart.tsx` — DA score distribution pies
- `useChartTheme.ts` — Hook for ECharts theme + colors, re-renders on theme change

### CSV Upload
- `DataUpload.tsx` — Unified upload component, auto-detects file type via `detectCsvType()`
- No `CSVUpload.tsx` or `ScorecardCSVUpload.tsx` (removed)

### Data / Lib (`src/lib/`)
- `rts/parseRTSCSV.ts` — RTS parser
- `scorecard/parseScorecard.ts` — DA Scorecard parser with weighted score calculation
- `cdf/parseCDF.ts` — CDF defect parser
- `dsb/parseDSB.ts` — DSB concession parser
- `detectCsvType.ts` — Auto-detects CSV type from headers
- `colors.ts` / `echartsThemes.ts` — Shared theme, CSS vars via `[data-theme]` on `<html>`
- `utils.ts` — `getBarChartData` and shared utilities

## Scoring Rules (from `Code.js`)

### Metrics
- **Safety** (5, excludes FICO): Speeding, Seatbelt-Off, Distractions, Sign/Signal, Following Distance
- **Quality** (5, excludes PSB): CDF DPMO, CED, DCR, DSB DPMO, POD
- `score * (weight/100)`, normalized to standard weights (52.1 safety, 48.2 quality)

### Perfect Thresholds
- Perfect Overall: 99.995 | Safety: 52.095 | Quality: 48.195

### Rankings
- Top/Bottom 10 per category per week; perfect-score expansion shows all perfect scorers
- Trailing Averages (multi-week): grouped by transporterId, scores averaged, packages summed
- Heat map: 90%+ green, 80% yellow-green, 70% yellow, 60% orange, 50% red-orange, <50% red

### Key Identifiers
- **Transporter ID** is the guaranteed-unique primary key for DA joins
- Scorecard CSV is self-contained (includes `Packages Delivered`)
- Header `"Delivery Associate "` has a trailing space — parser must trim

## Environment / Deployment

### .env files
- `.env` — local dev (`VITE_BASE_PATH=/`)
- `.env.production` — VPS (`VITE_BASE_PATH=/`)
- `.env.production.github` — GitHub Pages (`VITE_BASE_PATH=/D20_Dashboard/`)

### Deployment
- **GitHub Pages** (temporary): `https://sirjroddingham.github.io/D20_Dashboard/` — HashRouter
- **VPS (Ubuntu)**: nginx `try_files $uri /index.html` — switch to BrowserRouter

## Gotchas

- `tsc -b` required before `vite build` — TypeScript project references (`tsconfig.app.json` + `tsconfig.node.json`)
- **Zustand v5**: Selectors returning new objects/arrays cause infinite re-renders — must cache in state
- **No StrictMode**: `main.tsx` renders without `StrictMode`
- **Multi-week merge**: `selectedWeek` must sync to `mostRecentWeek` on upload, otherwise `weekRows` returns ALL rows from ALL weeks (duplicate React keys)
- **Trailing Averages**: Only appears when 2+ weeks loaded; top/bottom 30 per category
- **ECharts 6 + echarts-for-react 3.0.6**: `theme` and `opts` props must be memoized (`useMemo`) to prevent instance disposal. Inline objects cause dispose+recreate on every render.
- **ECharts instance disposal in dev**: Vite HMR can dispose instances during hot updates. Test chart interactions in preview (`npm run preview`) for reliable behavior.
- **CDF/DSB**: DSB data is parsed and stored in `useDataSourceStore` but not yet displayed in the CDF page UI
- **Unused exports**: `CDFDefectSplitChart` and `TopPerformersTable` exist but are not rendered
- **`no-case-declarations` lint error**: Pre-existing in `DataUpload.tsx` (lines 152-153)
- **`react-hooks/set-state-in-effect` lint error**: Pre-existing in `DAPerformance.tsx` (line 46)

## Available Data Files

- RTS combined: `D20_Scorecard/RTS_Dashboard/TEST/Quality_RTS_D2IN_DGF1_2026_W11-W16_combined_fixed.csv`
- Scorecard W15: `D20_Scorecard/Scorecard_Overall/DSP_Overview_Dashboard_D2IN_DGF1_2026-W15.csv` (80 DAs)
- Scorecard W17: `D20_Scorecard/DA_BONUS/Week 17-2026/DSP_Overview_Dashboard_D2IN_DGF1_2026-W17.csv`
- Scorecard W18: `D20_Scorecard/DA_BONUS/Week 18-2026/DSP_Overview_Dashboard_D2IN_DGF1_2026-W18.csv`
- Scorecard W19: `D20_Scorecard/DA_BONUS/Week 19-2026/DSP_Overview_Dashboard_D2IN_DGF1_2026-W19.csv` (80 DAs)
- CDF W18: `D20_Scorecard/DA_BONUS/Week 18-2026/DSP_Customer_Delivery_Feedback_negative_DGF1_2026-W18.csv`
- CDF W19: `D20_Scorecard/DA_BONUS/Week 19-2026/DSP_Customer_Delivery_Feedback_negative_DGF1_2026-W19.csv` (57 rows)
- DSB W19: `D20_Scorecard/DA_BONUS/Week 19-2026/DSP_Delivery_Concessions_DGF1_2026-W19.csv` (17 rows)
