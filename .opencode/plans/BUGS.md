# D20 Dashboard — Bug Audit Checklist

> **Created:** 2026-05-17  
> **Scope:** Full source review of `src/` in `/home/jrod/CODE_PROJECTS/D20_Dashboard`  
> **Purpose:** Handoff checklist for agent to fix all identified bugs  
> **Status:** All items unchecked — fix sequentially by priority (Critical → Important → Suggestion)  
> **Verification after each fix:** `npx tsc --noEmit` && `npx eslint src/ --max-warnings 0` && `npm run build`

---

## 🔴 Critical — Data Loss

- [ ] **BUG 1 — CDF merge key excludes `trackingId`**
  - **File:** `src/store/useDataSourceStore.ts:17–20`
  - **Problem:** Key is `${week}::${deliveryAssociate}` only. If a DA has multiple defects in the same week (different tracking IDs), all but the first are silently dropped as "duplicates" on every upload.
  - **Fix:** Change key to `${row.week}::${row.deliveryAssociate}::${row.trackingId}`. Use `row.week` (from filename) instead of calling `dateToISOWeek(row.deliveryDate)` — this also eliminates the mismatch between key week and stored `row.week`.
  - **Verify:** Upload a CDF file with a DA who has 2+ defects in the same week. Confirm all tracking IDs are retained in the store.

---

## 🟡 Important — Correctness / Wrong Results

- [ ] **BUG 2 — `trailingAverages` initialized to `[]` overrides computed value**
  - **File:** `src/store/useDAPerformanceStore.ts` (line 67 vs line 91)
  - **Problem:** Object init sets `_trailingAverages: trailingAvgs` (computed) but then `trailingAverages: []` (hardcoded empty). The empty array wins. Trailing Averages section renders empty on first load until a store subscription fires.
  - **Fix:** Change line 91 to `trailingAverages: trailingAvgs`.
  - **Verify:** With scorecard data pre-loaded, navigate to DA Performance. Confirm Trailing Averages table renders data immediately on mount.

- [ ] **BUG 3 — `useDefectFreeEmployees` ignores selected week**
  - **File:** `src/store/useCDFStore.ts:172–213` (call site: `src/pages/CDFSB.tsx:238`)
  - **Problem:** `idsWithDefects` is built from ALL `enrichedCdfRows` regardless of selected week. A DA with a defect in W18 never appears in the Defect Free table for W19.
  - **Fix:** 
    1. Add `selectedWeek` parameter to `useDefectFreeEmployees`
    2. Filter `rows` by week before computing `idsWithDefects`
    3. Update call site in `CDFSB.tsx:238` to pass `selectedWeek`
  - **Verify:** Upload CDF W18 (with defects) and W19 (clean). Select W19. Confirm DAs who only had W18 defects appear in the Defect Free table.

- [ ] **BUG 4 — `selectedWeek` stale closure in `DAPerformance.tsx`**
  - **File:** `src/pages/DAPerformance.tsx:40`
  - **Problem:** `useState(mostRecentWeek)` captures `mostRecentWeek` at mount (`''`). When data loads later, `selectedWeek` stays `''`, causing `weekRows` to return ALL rows from ALL weeks (duplicate keys, broken rankings).
  - **Fix:** Add sync effect:
    ```ts
    useEffect(() => {
      if (mostRecentWeek && !selectedWeek) {
        setSelectedWeek(mostRecentWeek);
      }
    }, [mostRecentWeek]);
    ```
  - **Verify:** Navigate to DA Performance before uploading any scorecard. Upload a scorecard. Confirm rankings show only one week's data, not all weeks mixed.

- [ ] **BUG 5 — Null metric scores substitute as `0`**
  - **File:** `src/lib/scorecard/parseScorecard.ts:119` (safety) and `133` (quality)
  - **Problem:** `(m.score ?? 0) * (m.weight / 100)` — a DA excluded from a metric gets `0 * weight` added to the total, deflating their score. "Not evaluated" is treated as "scored zero."
  - **Fix:** Skip metrics where `score === null` from both the weighted total AND the weight accumulation:
    ```ts
    safetyMetrics.forEach(m => {
      if (m.score === null) return;
      totalSafetyWeight += m.weight;
      weightedSafetyTotal += m.score * (m.weight / 100);
    });
    ```
    Apply same fix for quality metrics. Keep normalization logic unchanged.
  - **Verify:** Check a DA in the scorecard CSV who has a blank/null score for one safety or quality metric. Confirm their computed score matches the expected weighted average of only the non-null metrics.

- [ ] **BUG 6 — DSB week filter uses `dateToISOWeek()` instead of `r.week`**
  - **File:** `src/pages/CDFSB.tsx:59` (`useFilteredDSBRows`) and `252–255` (`dsbWeekRows`)
  - **Problem:** After the filename-week fix, `r.week` is the authoritative week. But DSB filtering still calls `dateToISOWeek(r.concessionDate || r.deliveryDate)`, which can produce a different week than `r.week` when dates span weeks.
  - **Fix:**
    - Line 59: `filtered = filtered.filter(r => r.week === selectedWeek);`
    - Line 252–255: `return dsbRows.filter(r => r.week === dsbSelectedWeek);`
  - **Verify:** Upload a DSB file where row-level dates span multiple ISO weeks. Select a specific week. Confirm only rows matching the filename's week appear.

- [ ] **BUG 7 — "All Weeks" option missing when only 1 week loaded**
  - **File:** `src/pages/CDFSB.tsx:347–352` (CDF) and `396–401` (DSB)
  - **Problem:** `selectedWeek` defaults to `'__all__'`, but `<option value="__all__">` only renders when `cdfLoadedWeeks.length > 1`. With 1 week, the `<select>` has no matching option — blank display, state/UI mismatch.
  - **Fix:** Change condition to `length >= 1` so the "All Weeks" option always renders when any data exists.
  - **Verify:** Upload a single-week CDF (and separately a single-week DSB). Confirm the week dropdown shows both the week and "All Weeks" options, and the selected value matches the visible option.

- [ ] **BUG 8 — `toISOWeek` uses Jan 4 directly, not Monday of Jan 4's week**
  - **File:** `src/lib/rts/helpers.ts:6`
  - **Problem:** ISO 8601 requires the Monday of the week containing Jan 4 as the anchor. Using Jan 4 directly shifts the calculation by up to 3 days, producing wrong week numbers near year-end/start.
  - **Fix:**
    ```ts
    const weekStart = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = weekStart.getUTCDay() || 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - (dayOfWeek - 1));
    const weekNo = String(Math.ceil(((dt.getTime() - weekStart.getTime()) / 86400000 + 1) / 7)).padStart(2, '0');
    ```
  - **Verify:** Test dates near year boundaries:
    - Dec 29, 2024 (should be W1 2025)
    - Dec 31, 2025 (should be W1 2026)
    - Jan 1, 2024 (should be W52 2023)
  - **Note:** This affects `dateToISOWeek` used by RTS merge key and DSB filtering. Fix once, benefits everywhere.

- [ ] **BUG 9 — Safety trailing filter is no-op**
  - **File:** `src/pages/DAPerformance.tsx:144`
  - **Problem:** `trailingAverages.filter(t => t.avgSafetyScore > 0 || t.weekCount > 0)` — `t.weekCount > 0` is always true (every entry has 1+ week). DAs with zero safety data appear in safety rankings.
  - **Fix:** `trailingAverages.filter(t => t.avgSafetyScore > 0)`
  - **Verify:** With a scorecard containing a DA who has no safety data, confirm they don't appear in the Trailing Safety top/bottom tables.

- [ ] **BUG 10 — `CDFFilterBar` date inputs accidentally activate filter on focus+blur**
  - **File:** `src/components/CDFFilterBar.tsx:108–121` and `src/components/DSBBFilterBar.tsx` (equivalent lines)
  - **Problem:** `value={filters.dateStart || dateRange.min}` — shows min/max as placeholder. On focus+blur, `onChange` fires with the placeholder value, setting `filters.dateStart = dateRange.min`, accidentally activating a filter.
  - **Fix:**
    ```tsx
    value={filters.dateStart}
    placeholder={dateRange.min}
    ```
    (Same for `dateEnd` and in `DSBBFilterBar`.)
  - **Verify:** Clear all filters. Confirm date inputs show placeholder text. Click into the field and click out without changing anything. Confirm no filter is activated.

- [ ] **BUG 11 — Partial CSV header mapping lets corrupt rows into store**
  - **File:** `src/lib/headerMap.ts` (used by `src/lib/rts/parseRTSCSV.ts:24`)
  - **Problem:** `mapCsvHeaders` returns a partial mapping even when most required fields are missing. Parser checks `Object.keys(mapping).length === 0` — a mapping with 1 key passes the check. Rows with empty `transporterId`, `trackingId`, etc. are produced and merged with key `Unknown::`.
  - **Fix:** Define required headers per CSV type. Return `[]` if any required field is absent:
    ```ts
    const RTS_REQUIRED = ['deliveryAssociate', 'trackingId', 'deliveryDate'];
    if (RTS_REQUIRED.some(k => !(k in mapping))) return [];
    ```
    Add a descriptive error message or log warning.
  - **Verify:** Upload a CSV with only 1 of the expected RTS headers. Confirm it is rejected (not silently parsed as garbage).

---

## 🔵 Suggestions — UX Polish / Dead Code

- [ ] **BUG 12 — DSB merge key collapses blank `trackingId` rows**
  - **File:** `src/store/useDataSourceStore.ts:22–24`
  - **Problem:** `${row.week}::${row.trackingId}` — if `trackingId` is empty string, all blank-ID rows in the same week share the key.
  - **Fix:** Append row index for empty tracking IDs: `${row.week}::${row.trackingId || row._id}`

- [ ] **BUG 13 — `getBottomN` never expands for tied performers**
  - **File:** `src/pages/DAPerformance.tsx:29–32`
  - **Problem:** `getTopN` expands to show all perfect scorers, but `getBottomN` hard-slices to exactly N. Tied-at-bottom DAs are arbitrarily excluded.
  - **Fix:** After `sorted.slice(-n)`, check if the item just above the cutoff has the same score. If so, expand to include all tied items.

- [ ] **BUG 14 — `DetailTable` search pre-lowercases stored value**
  - **File:** `src/components/DetailTable.tsx:63`
  - **Problem:** `e.target.value.toLowerCase()` is stored and bound back to `value={}`. User types "ABC", sees "abc" in real time.
  - **Fix:** Store raw value, lowercase only at comparison time.

- [ ] **BUG 15 — Chart badge reports "row count" as "defects"**
  - **File:** `src/components/CDFCharts.tsx:262–271` and `src/components/DSBCharts.tsx` (equivalent)
  - **Problem:** `total += 1` counts unique rows with any defect, but bar heights sum per-category counts. Badge total does not equal stacked bar total.
  - **Fix:** Either count total defect categories (`total += r.defectCategories.length`) or rename badge to "rows with defects".

- [ ] **BUG 16 — `StackedBarChart` event listeners lost on ECharts recreation**
  - **File:** `src/components/StackedBarChart.tsx:47–96`
  - **Problem:** `mousemove`, `globalout`, and `click` listeners attach to the old chart instance. After theme change or resize causes instance disposal/recreation, effects do not re-run.
  - **Fix:** Add `chartRef.current?.getEchartsInstance()` as a dependency or use `onChartReady` callback from ReactECharts.

- [ ] **BUG 17 — `parseRTSCSV` rowCounter never reset**
  - **File:** `src/lib/rts/parseRTSCSV.ts:5–8`
  - **Problem:** `resetRowCounter()` exported but never called. Counter grows unboundedly across uploads.
  - **Fix:** Call `resetRowCounter()` in `clearRts()` or remove the global counter entirely.

- [ ] **BUG 18 — `Sidebar` subscribes to full theme store**
  - **File:** `src/components/Sidebar.tsx:39`
  - **Problem:** `useThemeStore()` without selector causes full sidebar re-render on every theme toggle.
  - **Fix:** Remove the call if sidebar doesn't use theme state, or use `useThemeStore(s => s.dark)` if needed.

- [ ] **BUG 19 — Dead code**
  - `src/components/EmptyState.tsx` — never imported. **Delete.**
  - `src/components/CDFRankingTables.tsx` — `TopPerformersTable` exported but never rendered. **Remove or use.**

---

## Execution Order (Recommended)

1. **BUG 1** — Fix CDF merge key first; it is data loss on every upload
2. **BUGs 4 + 2 together** — Both affect DA Performance page initialization
3. **BUG 5** — Score calculation affects all rankings; verify against a known scorecard
4. **BUG 3** — Defect-free table correctness
5. **BUGs 6 + 7** — DSB filtering consistency and week dropdown
6. **BUG 8** — ISO week math; verify with year-boundary test dates
7. **BUG 9** — One-line fix
8. **BUGs 10 + 11** — Input UX and data integrity
9. **BUGs 12–19** — Polish items, fix as time allows

---

## Pre-flight Checklist (Before Starting)

- [ ] Verify current state: `git status`, `git log --oneline -5`
- [ ] Confirm baseline passes: `npx tsc --noEmit`, `npx eslint src/ --max-warnings 0`, `npm run build`
- [ ] Note any existing warnings (Vite chunk size >500kB is pre-existing and cosmetic)

## Post-fix Checklist (After All Fixes)

- [ ] All 3 checks pass: tsc, eslint (0 warnings), build
- [ ] Manual test: Upload RTS, Scorecard (multi-week), CDF, DSB files
- [ ] Verify DA Performance rankings with 2+ weeks loaded
- [ ] Verify CDF defect detail table with multi-week data
- [ ] Verify week dropdowns in CDF and DSB sections
- [ ] Commit with descriptive message: `fix: resolve audit findings (merge keys, stale closures, score calculation, etc.)`
- [ ] Push to `main`

---

## Architectural Notes for the Fixing Agent

- **Central store** (`useDataSourceStore`) is the single source of truth. Module stores (`useDAPerformanceStore`, `useRTSStore`) subscribe to it.
- **Merge keys** must be unique per row. CDF uses `week + DA + trackingId`. DSB uses `week + trackingId`. RTS uses `week + transporterId`. Scorecard uses `week + transporterId`.
- **Zustand v5**: Avoid selectors that return new objects/arrays (infinite re-renders).
- **No StrictMode** in `main.tsx` — effects run once.
- **HashRouter** — use `#/` prefix in URLs for local testing.
- **No tests** — manual verification only.
ENDOFFILE