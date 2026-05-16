import { create } from 'zustand';
import { useDataSourceStore } from './useDataSourceStore';
import type { ScorecardRow, DATrailingAvg } from '../lib/scorecard/types';

export const STANDARD_SAFETY_WEIGHT = 52.1;
export const STANDARD_QUALITY_WEIGHT = 48.2;

interface DAPerformanceState {
  rows: ScorecardRow[];
  loadedWeeks: string[];
  mostRecentWeek: string;
  fileName: string;
  _trailingAverages: DATrailingAvg[];

  mergeRows: (newRows: ScorecardRow[]) => void;
  rowsForWeek: (week: string) => ScorecardRow[];
  trailingAverages: DATrailingAvg[];
  setFileName: (name: string) => void;
  clearData: () => void;
}

function computeTrailingAverages(
  rows: ScorecardRow[]
): DATrailingAvg[] {
  const groups: Record<string, ScorecardRow[]> = {};
  rows.forEach(row => {
    if (!groups[row.transporterId]) groups[row.transporterId] = [];
    groups[row.transporterId].push(row);
  });

  return Object.values(groups).map(weekRows => {
    const scores = weekRows.map(r => r.overallScore).filter(s => s > 0);
    const safetyScores = weekRows
      .filter(r => r.hasSafetyData)
      .map(r => r.normalizedSafetyScore);
    const qualityScores = weekRows.map(r => r.normalizedQualityScore).filter(s => s > 0);

    return {
      transporterId: weekRows[0].transporterId,
      name: weekRows[0].name,
      weekCount: weekRows.length,
      totalPackages: weekRows.reduce((sum, r) => sum + r.packagesDelivered, 0),
      avgOverallScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      avgSafetyScore: safetyScores.length > 0 ? safetyScores.reduce((a, b) => a + b, 0) / safetyScores.length : 0,
      avgQualityScore: qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0,
    };
  });
}

function recomputeDerived(rows: ScorecardRow[]) {
  const weeks = [...new Set(rows.map(r => r.week))].sort();
  const mostRecent = weeks.length > 0 ? weeks[weeks.length - 1] : '';
  const trailingAvgs = computeTrailingAverages(rows);
  return { weeks, mostRecent, trailingAvgs };
}

export const useDAPerformanceStore = create<DAPerformanceState>((set, get) => {
  // Initialize from central store
  const central = useDataSourceStore.getState();
  const { weeks, mostRecent, trailingAvgs } = recomputeDerived(central.scorecardRows);

  return {
    rows: central.scorecardRows,
    loadedWeeks: weeks,
    mostRecentWeek: mostRecent,
    fileName: central.scorecardLastUpload,
    _trailingAverages: trailingAvgs,

    mergeRows: (newRows) => {
      // Delegate to central store for dedup
      useDataSourceStore.getState().mergeScorecard(newRows);

      // Sync back from central store
      const central = useDataSourceStore.getState();
      const { weeks, mostRecent, trailingAvgs } = recomputeDerived(central.scorecardRows);

      set({
        rows: central.scorecardRows,
        loadedWeeks: weeks,
        mostRecentWeek: mostRecent,
        fileName: central.scorecardLastUpload,
        _trailingAverages: trailingAvgs,
      });
    },

    rowsForWeek: (week) => {
      return get().rows.filter(r => r.week === week);
    },

    trailingAverages: [],

    setFileName: (name) => set({ fileName: name }),

    clearData: () => {
      useDataSourceStore.getState().clearScorecard();
      set({
        rows: [],
        loadedWeeks: [],
        mostRecentWeek: '',
        fileName: '',
        _trailingAverages: [],
      });
    },
  };
});

// Sync central store changes back to DA store
useDataSourceStore.subscribe((state) => {
  const daStore = useDAPerformanceStore.getState();
  const { weeks, mostRecent, trailingAvgs } = recomputeDerived(state.scorecardRows);
  useDAPerformanceStore.setState({
    rows: state.scorecardRows,
    loadedWeeks: weeks,
    mostRecentWeek: mostRecent,
    fileName: state.scorecardLastUpload || daStore.fileName,
    _trailingAverages: trailingAvgs,
  });
});
