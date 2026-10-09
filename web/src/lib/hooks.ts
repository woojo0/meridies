"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useStore } from "./store";

/* ── 전역 1초 시계 (구독자가 있을 때만 돈다) ── */
let nowCache = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const clockSubs = new Set<() => void>();
function subscribeClock(cb: () => void) {
  clockSubs.add(cb);
  if (!timer) {
    nowCache = Date.now();
    timer = setInterval(() => { nowCache = Date.now(); clockSubs.forEach((f) => f()); }, 1000);
  }
  return () => { clockSubs.delete(cb); if (!clockSubs.size && timer) { clearInterval(timer); timer = undefined; } };
}

/** 현재 커뮤 시각(데모 시간 이동 포함). `ms` 단위로만 다시 렌더돼요. 서버에서는 0. */
export function useNow(ms = 30_000) {
  const shift = useStore((s) => s.shift);
  const t = useSyncExternalStore(
    subscribeClock,
    () => { if (!nowCache) nowCache = Date.now(); return Math.floor(nowCache / ms) * ms; },
    () => 0,
  );
  return t + shift;
}

/** 카운트다운용 1초 시계. */
export const useTick = () => useNow(1000);

export function useMe() {
  const id = useStore((s) => s.session.charId);
  return useStore((s) => s.data.chars.find((c) => c.id === id) ?? null);
}

export function useChar(id: string | undefined) {
  return useStore((s) => s.data.chars.find((c) => c.id === id));
}

/** 브라우저에 저장된 상태를 불러온 뒤 true. */
export function useHydrated() {
  const hydrated = useStore((s) => s.hydrated);
  useEffect(() => {
    if (!useStore.persist.hasHydrated()) {
      useStore.persist.rehydrate();
    } else if (!useStore.getState().hydrated) {
      useStore.setState({ hydrated: true });
    }
  }, []);
  return hydrated;
}

/* ── 테마 ── */
export type Theme = "system" | "light" | "dark";
const THEME_KEY = "meridies-theme";
const themeSubs = new Set<() => void>();
function readTheme(): Theme {
  try { const t = localStorage.getItem(THEME_KEY); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; }
}
export function useTheme(): [Theme, (t: Theme) => void] {
  const t = useSyncExternalStore((cb) => { themeSubs.add(cb); return () => { themeSubs.delete(cb); }; }, readTheme, () => "system" as Theme);
  const set = (v: Theme) => {
    try { localStorage.setItem(THEME_KEY, v); } catch {}
    const root = document.documentElement;
    if (v === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", v);
    themeSubs.forEach((f) => f());
  };
  return [t, set];
}
