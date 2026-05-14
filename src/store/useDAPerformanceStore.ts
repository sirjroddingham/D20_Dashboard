import { create } from 'zustand';

interface DAPerformanceState {
  rawData: any[];
  filteredData: any[];
  isLoading: boolean;
  fileName: string;
  
  setRawData: (data: any[]) => void;
  setFileName: (name: string) => void;
}

export const useDAPerformanceStore = create<DAPerformanceState>((set) => ({
  rawData: [],
  filteredData: [],
  isLoading: false,
  fileName: '',
  
  setRawData: (data) => set({ rawData: data, filteredData: data }),
  setFileName: (name) => set({ fileName: name }),
}));
