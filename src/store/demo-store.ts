// ============================================================
// VERDICT — Demo Mode Store
// Session-level UI state. Never persisted to database.
// Resets on logout (called from auth context).
// ============================================================

import { create } from "zustand";

interface DemoStore {
  active: boolean;
  activate: () => void;
  deactivate: () => void;
}

export const useDemoStore = create<DemoStore>()((set) => ({
  active: false,
  activate: () => set({ active: true }),
  deactivate: () => set({ active: false }),
}));
