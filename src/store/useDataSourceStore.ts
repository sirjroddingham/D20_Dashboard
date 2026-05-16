import { create } from 'zustand';
import type { RTSDataRow } from '../lib/rts/types';
import type { ScorecardRow } from '../lib/scorecard/types';
import type { CDFRow } from '../lib/cdf/types';
import type { DSBRow } from '../lib/dsb/types';
import { toISOWeek, dateToISOWeek } from '../lib/rts/helpers';

function rtsMergeKey(row: RTSDataRow): string {
  const week = row.normalizedDate ? toISOWeek(row.normalizedDate) : 'Unknown';
  return `${week}::${row.transporterId}`;
}

function scorecardMergeKey(row: ScorecardRow): string {
  return `${row.week}::${row.transporterId}`;
}

function cdfMergeKey(row: CDFRow): string {
  const week = dateToISOWeek(row.deliveryDate);
  return `${week}::${row.deliveryAssociate}`;
}

function dsbMergeKey(row: DSBRow): string {
  const week = dateToISOWeek(row.concessionDate || row.deliveryDate);
  return `${week}::${row.deliveryAssociate}`;
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
  mergeRts: (rows: RTSDataRow[]) => void;
  mergeScorecard: (rows: ScorecardRow[]) => void;
  mergeCdf: (rows: CDFRow[]) => void;
  mergeDsb: (rows: DSBRow[]) => void;

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

    if (toAdd.length === 0) {
      set({ rtsLastUpload: `${newRows.length} rows (all duplicates)` });
      return;
    }

    const merged = [...existing, ...toAdd];
    const weeks = [...new Set(merged.map((r) => r.normalizedDate ? toISOWeek(r.normalizedDate) : 'Unknown'))].sort();

    set({
      rtsRows: merged,
      rtsLoadedWeeks: weeks,
      rtsLastUpload: `${toAdd.length} rows added (${merged.length} total)`,
    });
  },

  // Scorecard merge
  mergeScorecard: (newRows) => {
    const existing = get().scorecardRows;
    const existingKeys = new Set(existing.map(scorecardMergeKey));
    const toAdd = newRows.filter((r) => !existingKeys.has(scorecardMergeKey(r)));

    if (toAdd.length === 0) {
      set({ scorecardLastUpload: `${newRows[0]?.week ?? 'Week'} uploaded (duplicate, no new data)` });
      return;
    }

    const merged = [...existing, ...toAdd];
    const weeks = [...new Set(merged.map((r) => r.week))].sort();
    const mostRecent = weeks.length > 0 ? weeks[weeks.length - 1] : '';

    set({
      scorecardRows: merged,
      scorecardLoadedWeeks: weeks,
      scorecardMostRecentWeek: mostRecent,
      scorecardLastUpload: `${toAdd.length} rows added (${weeks.length} week(s) loaded)`,
    });
  },

  // CDF merge
  mergeCdf: (newRows) => {
    const existing = get().cdfRows;
    const existingKeys = new Set(existing.map(cdfMergeKey));
    const toAdd = newRows.filter((r) => !existingKeys.has(cdfMergeKey(r)));

    if (toAdd.length === 0) {
      set({ cdfLastUpload: `${newRows.length} rows (all duplicates)` });
      return;
    }

    const merged = [...existing, ...toAdd];
    const weeks = [...new Set(merged.map((r) => dateToISOWeek(r.deliveryDate)))].sort();

    set({
      cdfRows: merged,
      cdfLoadedWeeks: weeks,
      cdfLastUpload: `${toAdd.length} rows added (${merged.length} total)`,
    });
  },

  // DSB merge
  mergeDsb: (newRows) => {
    const existing = get().dsbRows;
    const existingKeys = new Set(existing.map(dsbMergeKey));
    const toAdd = newRows.filter((r) => !existingKeys.has(dsbMergeKey(r)));

    if (toAdd.length === 0) {
      set({ dsbLastUpload: `${newRows.length} rows (all duplicates)` });
      return;
    }

    const merged = [...existing, ...toAdd];
    const weeks = [...new Set(
      merged.map((r) => dateToISOWeek(r.concessionDate || r.deliveryDate))
    )].sort();

    set({
      dsbRows: merged,
      dsbLoadedWeeks: weeks,
      dsbLastUpload: `${toAdd.length} rows added (${merged.length} total)`,
    });
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
