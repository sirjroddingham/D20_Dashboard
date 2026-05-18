import { create } from 'zustand';
import type { RTSDataRow } from '../lib/rts/types';
import type { ScorecardRow } from '../lib/scorecard/types';
import type { CDFRow } from '../lib/cdf/types';
import type { DSBRow } from '../lib/dsb/types';
function rtsMergeKey(row: RTSDataRow): string {
  return row.transporterId ? `${row.week}::${row.transporterId}` : `${row.week}::${row._id}`;
}

function scorecardMergeKey(row: ScorecardRow): string {
  return row.transporterId ? `${row.week}::${row.transporterId}` : `${row.week}::${row._id}`;
}

function cdfMergeKey(row: CDFRow): string {
  return row.deliveryAssociate && row.trackingId
    ? `${row.week}::${row.deliveryAssociate}::${row.trackingId}`
    : `${row.week}::${row._id}`;
}

function dsbMergeKey(row: DSBRow): string {
  return row.trackingId ? `${row.week}::${row.trackingId}` : `${row.week}::${row._id}`;
}

interface UploadSummary {
  type: 'rts' | 'scorecard' | 'cdf' | 'dsb';
  fileName: string;
  totalRows: number;
  mergedRows: number;
  duplicateRows: number;
  timestamp: number;
}

export interface DataSourceState {
  // RTS data
  rtsRows: RTSDataRow[];
  rtsLoadedWeeks: string[];
  rtsLastUpload: string;

  // Scorecard data
  scorecardRows: ScorecardRow[];
  scorecardLoadedWeeks: string[];
  scorecardMostRecentWeek: string;
  scorecardLastUpload: string;

  // CDF data
  cdfRows: CDFRow[];
  cdfLoadedWeeks: string[];
  cdfLastUpload: string;

  // DSB data
  dsbRows: DSBRow[];
  dsbLoadedWeeks: string[];
  dsbLastUpload: string;

  // Upload history
  uploadSummaries: UploadSummary[];

  // Actions
  mergeRts: (rows: RTSDataRow[]) => { merged: number; duplicates: number };
  mergeScorecard: (rows: ScorecardRow[]) => { merged: number; duplicates: number };
  mergeCdf: (rows: CDFRow[]) => { merged: number; duplicates: number };
  mergeDsb: (rows: DSBRow[]) => { merged: number; duplicates: number };

  clearRts: () => void;
  clearScorecard: () => void;
  clearCdf: () => void;
  clearDsb: () => void;
  clearAll: () => void;

  addUploadSummary: (summary: UploadSummary) => void;
  clearUploadSummaries: () => void;
}

export const useDataSourceStore = create<DataSourceState>((set, get) => ({
  // Initial state
  rtsRows: [],
  rtsLoadedWeeks: [],
  rtsLastUpload: '',

  scorecardRows: [],
  scorecardLoadedWeeks: [],
  scorecardMostRecentWeek: '',
  scorecardLastUpload: '',

  cdfRows: [],
  cdfLoadedWeeks: [],
  cdfLastUpload: '',

  dsbRows: [],
  dsbLoadedWeeks: [],
  dsbLastUpload: '',

  uploadSummaries: [],

  // RTS merge
  mergeRts: (newRows) => {
    const existing = get().rtsRows;
    const existingKeys = new Set(existing.map(rtsMergeKey));
    const toAdd = newRows.filter((r) => !existingKeys.has(rtsMergeKey(r)));
    const merged = toAdd.length;
    const duplicates = newRows.length - toAdd.length;

    if (merged === 0) {
      set({ rtsLastUpload: `${newRows.length} rows (all duplicates)` });
      return { merged: 0, duplicates: newRows.length };
    }

    const allRows = [...existing, ...toAdd];
    const weeks = [...new Set(allRows.map((r) => r.week))].sort();

    set({
      rtsRows: allRows,
      rtsLoadedWeeks: weeks,
      rtsLastUpload: `${toAdd.length} rows added (${allRows.length} total)`,
    });
    return { merged, duplicates };
  },

  // Scorecard merge
  mergeScorecard: (newRows) => {
    const existing = get().scorecardRows;
    const existingKeys = new Set(existing.map(scorecardMergeKey));
    const toAdd = newRows.filter((r) => !existingKeys.has(scorecardMergeKey(r)));
    const merged = toAdd.length;
    const duplicates = newRows.length - toAdd.length;

    if (merged === 0) {
      set({ scorecardLastUpload: `${newRows[0]?.week ?? 'Week'} uploaded (duplicate, no new data)` });
      return { merged: 0, duplicates: newRows.length };
    }

    const allRows = [...existing, ...toAdd];
    const weeks = [...new Set(allRows.map((r) => r.week))].sort();
    const mostRecent = weeks.length > 0 ? weeks[weeks.length - 1] : '';

    set({
      scorecardRows: allRows,
      scorecardLoadedWeeks: weeks,
      scorecardMostRecentWeek: mostRecent,
      scorecardLastUpload: `${toAdd.length} rows added (${weeks.length} week(s) loaded)`,
    });
    return { merged, duplicates };
  },

  // CDF merge
  mergeCdf: (newRows) => {
    const existing = get().cdfRows;
    const existingKeys = new Set(existing.map(cdfMergeKey));
    const toAdd = newRows.filter((r) => !existingKeys.has(cdfMergeKey(r)));
    const merged = toAdd.length;
    const duplicates = newRows.length - toAdd.length;

    if (merged === 0) {
      set({ cdfLastUpload: `${newRows.length} rows (all duplicates)` });
      return { merged: 0, duplicates: newRows.length };
    }

    const allRows = [...existing, ...toAdd];
    const weeks = [...new Set(allRows.map((r) => r.week))].sort();

    set({
      cdfRows: allRows,
      cdfLoadedWeeks: weeks,
      cdfLastUpload: `${toAdd.length} rows added (${allRows.length} total)`,
    });
    return { merged, duplicates };
  },

  // DSB merge
  mergeDsb: (newRows) => {
    const existing = get().dsbRows;
    const existingKeys = new Set(existing.map(dsbMergeKey));
    const toAdd = newRows.filter((r) => !existingKeys.has(dsbMergeKey(r)));
    const merged = toAdd.length;
    const duplicates = newRows.length - toAdd.length;

    if (merged === 0) {
      set({ dsbLastUpload: `${newRows.length} rows (all duplicates)` });
      return { merged: 0, duplicates: newRows.length };
    }

    const allRows = [...existing, ...toAdd];
    const weeks = [...new Set(allRows.map((r) => r.week))].sort();

    set({
      dsbRows: allRows,
      dsbLoadedWeeks: weeks,
      dsbLastUpload: `${toAdd.length} rows added (${allRows.length} total)`,
    });
    return { merged, duplicates };
  },

  // Clear actions
  clearRts: () => {
    set({
      rtsRows: [],
      rtsLoadedWeeks: [],
      rtsLastUpload: '',
    });
  },

  clearScorecard: () => {
    set({
      scorecardRows: [],
      scorecardLoadedWeeks: [],
      scorecardMostRecentWeek: '',
      scorecardLastUpload: '',
    });
  },

  clearCdf: () => {
    set({
      cdfRows: [],
      cdfLoadedWeeks: [],
      cdfLastUpload: '',
    });
  },

  clearDsb: () => {
    set({
      dsbRows: [],
      dsbLoadedWeeks: [],
      dsbLastUpload: '',
    });
  },

  clearAll: () => {
    set({
      rtsRows: [],
      rtsLoadedWeeks: [],
      rtsLastUpload: '',
      scorecardRows: [],
      scorecardLoadedWeeks: [],
      scorecardMostRecentWeek: '',
      scorecardLastUpload: '',
      cdfRows: [],
      cdfLoadedWeeks: [],
      cdfLastUpload: '',
      dsbRows: [],
      dsbLoadedWeeks: [],
      dsbLastUpload: '',
      uploadSummaries: [],
    });
  },

  // Upload summary tracking
  addUploadSummary: (summary) => {
    set((state) => ({
      uploadSummaries: [summary, ...state.uploadSummaries].slice(0, 50),
    }));
  },

  clearUploadSummaries: () => {
    set({ uploadSummaries: [] });
  },
}));
