"use client";

import { useEffect, useSyncExternalStore } from "react";
import { LIVE } from "./firebase";
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
export const useTick = () => useNow(1000);

export function useMe() {
  const id = useStore((s) => s.session.charId);
  return useStore((s) => s.data.chars.find((c) => c.id === id) ?? null);
}
export function useChar(id: string | undefined) {
  return useStore((s) => s.data.chars.find((c) => c.id === id));
}

/** 데모: 브라우저 저장소 복원 뒤 true. 실제 서버: 로그인 상태와 첫 데이터가 도착한 뒤 true. */
export function useHydrated() {
  const hydrated = useStore((s) => s.hydrated);
  useEffect(() => {
    if (!useStore.persist.hasHydrated()) useStore.persist.rehydrate();
    if (LIVE) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      (require("./live") as typeof import("./live")).startLive();
    } else if (!useStore.getState().hydrated) {
      useStore.setState({ hydrated: true });
    }
  }, []);
  return hydrated;
}

/** 방의 입력중 캐릭터 이름들 (나 제외, 최근 6초). */
export function useTypingNames(key: string) {
  const now = useTick();
  const map = useStore((s) => s.typing[key]);
  const meId = useStore((s) => s.session.charId);
  const chars = useStore((s) => s.data.chars);
  if (!map) return [] as string[];
  return Object.entries(map)
    .filter(([id, t]) => id !== meId && now - t < 6000)
    .map(([id]) => chars.find((c) => c.id === id)?.name)
    .filter((n): n is string => !!n);
}

/** CSS 미디어 쿼리 구독. 서버에서는 false. */
export function useMediaQuery(q: string) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(q); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); },
    () => window.matchMedia(q).matches,
    () => false,
  );
}
export const useDesktop = () => useMediaQuery("(min-width: 900px)");

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
