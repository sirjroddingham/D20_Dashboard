import { create } from 'zustand';
import type { RTSDataRow, RTSFilters } from '../lib/rts/types';

function toISOWeek(d: Date): string {
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const year = dt.getUTCFullYear();
  const weekStart = new Date(Date.UTC(year, 0, 4));
  const weekNo = String(Math.ceil(((dt.getTime() - weekStart.getTime()) / 86400000 + 1) / 7)).padStart(2, '0');
  return `${year}-W${weekNo}`;
}

function getWeekKey(row: RTSDataRow): string {
  if (!row.normalizedDate) return 'Unknown';
  return toISOWeek(row.normalizedDate);
}

interface RTSStoreState {
  rawData: RTSDataRow[];
  filteredData: RTSDataRow[];
  filters: RTSFilters;
  isLoading: boolean;
  fileName: string;

  setRawData: (data: RTSDataRow[]) => void;
  mergeRows: (newRows: RTSDataRow[]) => void;
  setFileName: (name: string) => void;
  setFilters: (filters: Partial<RTSFilters>) => void;
  resetFilters: () => void;
  clearData: () => void;
}

function applyFilters(rawData: RTSDataRow[], filters: RTSFilters): RTSDataRow[] {
  return rawData.filter(row => {
    if (filters.dateRange) {
      if (!row.normalizedDate) return false;
      const [start, end] = filters.dateRange;
      if (start && row.normalizedDate < start) return false;
      if (end && row.normalizedDate >= end) return false;
    }
    if (filters.employee && row.deliveryAssociate.trim().toLowerCase() !== filters.employee.toLowerCase()) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const searchable = [
        row.deliveryAssociate,
        row.trackingId,
        row.rtsCode,
        row.serviceArea,
        row.additionalInformation,
      ].join(' ').toLowerCase();
      if (!searchable.includes(search)) return false;
    }
    if (filters.rtsCodes.length > 0 && !filters.rtsCodes.includes(row.rtsCode)) return false;
    if (filters.impactDcr && row.impactDcr !== filters.impactDcr) return false;
    return true;
  });
}

export const useRTSStore = create<RTSStoreState>((set, get) => ({
  rawData: [],
  filteredData: [],
  isLoading: false,
  fileName: '',
  filters: {
    dateRange: null,
    employee: '',
    search: '',
    rtsCodes: [],
    impactDcr: '',
  },

  setRawData: (data) => {
    const state = get();
    const filtered = applyFilters(data, state.filters);
    set({ rawData: data, filteredData: filtered });
  },

  mergeRows: (newRows) => {
    const existing = get().rawData;
    const existingKeys = new Set(existing.map(r => `${getWeekKey(r)}::${r.transporterId}`));
    const toAdd = newRows.filter(r => !existingKeys.has(`${getWeekKey(r)}::${r.transporterId}`));

    if (toAdd.length === 0) {
      set({ fileName: `Uploaded (${newRows.length} rows, all duplicates)` });
      return;
    }

    const merged = [...existing, ...toAdd];
    const state = get();
    const filtered = applyFilters(merged, state.filters);

    set({
      rawData: merged,
      filteredData: filtered,
      fileName: `${toAdd.length} rows added (${merged.length} total)`,
    });
  },

  setFileName: (name) => set({ fileName: name }),

  setFilters: (partialFilters) => {
    const state = get();
    const newFilters = { ...state.filters, ...partialFilters };
    const filtered = applyFilters(state.rawData, newFilters);
    set({ filters: newFilters, filteredData: filtered });
  },

  resetFilters: () => {
    const state = get();
    set({
      filters: { dateRange: null, employee: '', search: '', rtsCodes: [], impactDcr: '' },
      filteredData: state.rawData,
    });
  },

  clearData: () => {
    set({
      rawData: [],
      filteredData: [],
      filters: { dateRange: null, employee: '', search: '', rtsCodes: [], impactDcr: '' },
      fileName: '',
    });

  },
}));
