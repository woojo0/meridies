import { create } from "zustand";
import type { ReactNode } from "react";

export type DrawerTab = "rp" | "pen" | "noti";

interface Overlay {
  sheet: ReactNode | null;
  sheetMode: "default" | "letter";
  toast: string | null;
  drawerOpen: boolean;
  drawerTab: DrawerTab;
  lightbox: { srcs: string[]; i: number } | null;

  openSheet: (node: ReactNode, mode?: "default" | "letter") => void;
  closeSheet: () => void;
  showToast: (t: string) => void;
  openDrawer: (tab?: DrawerTab) => void;
  closeDrawer: () => void;
  setDrawerTab: (t: DrawerTab) => void;
  openLightbox: (srcs: string[], i: number) => void;
  closeLightbox: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useOverlay = create<Overlay>((set) => ({
  sheet: null,
  sheetMode: "default",
  toast: null,
  drawerOpen: false,
  drawerTab: "rp",
  lightbox: null,

  openSheet: (node, mode = "default") => set({ sheet: node, sheetMode: mode }),
  closeSheet: () => set({ sheet: null }),
  showToast: (t) => {
    clearTimeout(toastTimer);
    set({ toast: t });
    toastTimer = setTimeout(() => set({ toast: null }), 2600);
  },
  openDrawer: (tab) => set((s) => ({ drawerOpen: true, drawerTab: tab ?? s.drawerTab })),
  closeDrawer: () => set({ drawerOpen: false }),
  setDrawerTab: (t) => set({ drawerTab: t }),
  openLightbox: (srcs, i) => set({ lightbox: { srcs, i } }),
  closeLightbox: () => set({ lightbox: null }),
}));

export const toast = (t: string) => useOverlay.getState().showToast(t);
export const closeSheet = () => useOverlay.getState().closeSheet();
