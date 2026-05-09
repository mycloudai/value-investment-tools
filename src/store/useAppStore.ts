import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrencyCode } from '../lib/toolkit';

export interface JournalEntry {
  id: string;
  ticker: string;
  buyPrice: number;
  thesis: string;
  assumptions: string;
  risks: string;
  sellConditions: string;
  review: string;
  updatedAt: string;
}

export interface PortfolioEntry {
  id: string;
  ticker: string;
  shares: number;
  buyPrice: number;
  currentPrice: number;
  intrinsicValue: number;
  updatedAt: string;
}

interface AppSnapshot {
  toolInputs: Record<string, Record<string, number | string>>;
  displayCurrency: CurrencyCode;
  apiKey: string;
  cachedFmpData: Record<string, Record<string, unknown>>;
  journalEntries: JournalEntry[];
  portfolioEntries: PortfolioEntry[];
}

interface AppStore extends AppSnapshot {
  setToolField: (toolId: string, key: string, value: number | string) => void;
  replaceToolInputs: (toolId: string, values: Record<string, number | string>) => void;
  setDisplayCurrency: (currencyCode: CurrencyCode) => void;
  setApiKey: (apiKey: string) => void;
  cacheFmpPayload: (ticker: string, endpoint: string, payload: unknown) => void;
  upsertJournalEntry: (entry: JournalEntry) => void;
  deleteJournalEntry: (id: string) => void;
  upsertPortfolioEntry: (entry: PortfolioEntry) => void;
  deletePortfolioEntry: (id: string) => void;
  importSnapshot: (snapshot: Partial<AppSnapshot>) => void;
}

const defaultSnapshot: AppSnapshot = {
  toolInputs: {},
  displayCurrency: 'USD',
  apiKey: '',
  cachedFmpData: {},
  journalEntries: [],
  portfolioEntries: [],
};

const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...defaultSnapshot,
      setToolField: (toolId, key, value) =>
        set((state) => ({
          toolInputs: {
            ...state.toolInputs,
            [toolId]: {
              ...(state.toolInputs[toolId] ?? {}),
              [key]: value,
            },
          },
        })),
      replaceToolInputs: (toolId, values) =>
        set((state) => ({
          toolInputs: {
            ...state.toolInputs,
            [toolId]: values,
          },
        })),
      setDisplayCurrency: (displayCurrency) => set(() => ({ displayCurrency })),
      setApiKey: (apiKey) => set(() => ({ apiKey })),
      cacheFmpPayload: (ticker, endpoint, payload) =>
        set((state) => ({
          cachedFmpData: {
            ...state.cachedFmpData,
            [ticker.toUpperCase()]: {
              ...(state.cachedFmpData[ticker.toUpperCase()] ?? {}),
              [endpoint]: payload,
            },
          },
        })),
      upsertJournalEntry: (entry) =>
        set((state) => {
          const exists = state.journalEntries.some((item) => item.id === entry.id);
          return {
            journalEntries: exists
              ? state.journalEntries.map((item) => (item.id === entry.id ? entry : item))
              : [entry, ...state.journalEntries],
          };
        }),
      deleteJournalEntry: (id) =>
        set((state) => ({
          journalEntries: state.journalEntries.filter((entry) => entry.id !== id),
        })),
      upsertPortfolioEntry: (entry) =>
        set((state) => {
          const exists = state.portfolioEntries.some((item) => item.id === entry.id);
          return {
            portfolioEntries: exists
              ? state.portfolioEntries.map((item) => (item.id === entry.id ? entry : item))
              : [entry, ...state.portfolioEntries],
          };
        }),
      deletePortfolioEntry: (id) =>
        set((state) => ({
          portfolioEntries: state.portfolioEntries.filter((entry) => entry.id !== id),
        })),
      importSnapshot: (snapshot) =>
        set((state) => ({
          toolInputs: snapshot.toolInputs ?? state.toolInputs,
          displayCurrency: snapshot.displayCurrency ?? state.displayCurrency,
          apiKey: snapshot.apiKey ?? state.apiKey,
          cachedFmpData: snapshot.cachedFmpData ?? state.cachedFmpData,
          journalEntries: snapshot.journalEntries ?? state.journalEntries,
          portfolioEntries: snapshot.portfolioEntries ?? state.portfolioEntries,
        })),
    }),
    {
      name: 'mycloudai-value-tools',
    },
  ),
);

export default useAppStore;