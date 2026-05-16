import { create } from 'zustand';
import { useDataSourceStore } from './useDataSourceStore';
import type { RTSDataRow, RTSFilters } from '../lib/rts/types';

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

const defaultFilters: RTSFilters = {
  dateRange: null,
  employee: '',
  search: '',
  rtsCodes: [],
  impactDcr: '',
};

export const useRTSStore = create<RTSStoreState>((set, get) => {
  // Initialize from central store
  const central = useDataSourceStore.getState();
  const filtered = applyFilters(central.rtsRows, defaultFilters);

  return {
    rawData: central.rtsRows,
    filteredData: filtered,
    filters: { ...defaultFilters },
    isLoading: false,
    fileName: central.rtsLastUpload,

    setRawData: (data) => {
      useDataSourceStore.getState().mergeRts(data);
      const state = get();
      const filtered = applyFilters(data, state.filters);
      set({ rawData: data, filteredData: filtered });
    },

    mergeRows: (newRows) => {
      // Delegate to central store for dedup
      useDataSourceStore.getState().mergeRts(newRows);

      // Sync back from central store
      const central = useDataSourceStore.getState();
      const state = get();
      const filtered = applyFilters(central.rtsRows, state.filters);

      set({
        rawData: central.rtsRows,
        filteredData: filtered,
        fileName: central.rtsLastUpload,
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
        filters: { ...defaultFilters },
        filteredData: applyFilters(state.rawData, defaultFilters),
      });
    },

    clearData: () => {
      useDataSourceStore.getState().clearRts();
      set({
        rawData: [],
        filteredData: [],
        filters: { ...defaultFilters },
        fileName: '',
      });
    },
  };
});

// Sync central store changes back to RTS store
useDataSourceStore.subscribe((state) => {
  const rtsStore = useRTSStore.getState();
  const filtered = applyFilters(state.rtsRows, rtsStore.filters);
  useRTSStore.setState({
    rawData: state.rtsRows,
    filteredData: filtered,
    fileName: state.rtsLastUpload || rtsStore.fileName,
  });
});
