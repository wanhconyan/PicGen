import { create } from 'zustand';

type AppState = {
  globalLoading: boolean;
  globalError: string | null;
  pollingIntervalMs: number;
  setGlobalLoading: (loading: boolean) => void;
  setGlobalError: (error: string | null) => void;
  setPollingIntervalMs: (value: number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  globalLoading: false,
  globalError: null,
  pollingIntervalMs: 5000,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  setGlobalError: (globalError) => set({ globalError }),
  setPollingIntervalMs: (pollingIntervalMs) => set({ pollingIntervalMs }),
}));
