import { create } from 'zustand';

interface CDFSBState {
  rawData: any[];
  filteredData: any[];
  isLoading: boolean;
  fileName: string;
  
  setRawData: (data: any[]) => void;
  setFileName: (name: string) => void;
}

export const useCDFSBStore = create<CDFSBState>((set) => ({
  rawData: [],
  filteredData: [],
  isLoading: false,
  fileName: '',
  
  setRawData: (data) => set({ rawData: data, filteredData: data }),
  setFileName: (name) => set({ fileName: name }),
}));
