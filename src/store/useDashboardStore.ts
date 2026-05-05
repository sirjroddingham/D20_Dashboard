import { create } from 'zustand';
import type { RTSDataRow, DashboardFilters } from '../types';

interface DashboardState {
  rawData: RTSDataRow[];
  filteredData: RTSDataRow[];
  filters: DashboardFilters;
  isLoading: boolean;
  fileName: string;

  setRawData: (data: RTSDataRow[]) => void;
  setFileName: (name: string) => void;
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  clearData: () => void;
}

function applyFilters(rawData: RTSDataRow[], filters: DashboardFilters): RTSDataRow[] {
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

export const useDashboardStore = create<DashboardState>((set, get) => ({
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
