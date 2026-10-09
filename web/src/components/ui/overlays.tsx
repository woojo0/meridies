"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useOverlay } from "@/lib/overlay";
import { cx } from "@/lib/format";
import { IconButton } from "./primitives";

/* ── Sheet: 모바일은 아래에서 올라오는 시트, 데스크톱은 가운데 다이얼로그 ── */
export function SheetRoot() {
  const { sheet, sheetMode, closeSheet } = useOverlay();
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSheet(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, closeSheet]);
  if (!sheet) return null;
  const letter = sheetMode === "letter";
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="anim-fadein absolute inset-0 bg-black/45" onClick={closeSheet} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          "absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden shadow-float",
          letter
            ? "top-0 max-h-none bg-[#15120c] text-[#E9DFC4] lg:top-1/2 lg:left-1/2 lg:h-auto lg:max-h-[92vh] lg:w-[min(560px,96vw)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:bottom-auto"
            : "anim-up rounded-t-[24px] bg-surface lg:top-1/2 lg:left-1/2 lg:bottom-auto lg:w-[min(520px,92vw)] lg:max-h-[86vh] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[24px] lg:animate-none",
        )}
      >
        {!letter && <div className="mx-auto mt-2.5 mb-1 h-1 w-10 shrink-0 rounded-full bg-line-strong lg:hidden" />}
        <div className={cx("min-h-0 flex-1 overflow-y-auto", letter ? "flex flex-col" : "px-5 pb-[calc(22px+env(safe-area-inset-bottom,0px))] pt-3 lg:px-7 lg:py-7")}>
          {sheet}
        </div>
      </div>
    </div>
  );
}

export function SheetTitle({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="text-[19px]">{children}</h2>
      {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
    </div>
  );
}

export function SheetActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 flex gap-2 [&>*]:flex-1">{children}</div>;
}

/* ── Toast ── */
export function ToastRoot() {
  const t = useOverlay((s) => s.toast);
  if (!t) return null;
  return (
    <div className="anim-up pointer-events-none fixed bottom-[calc(84px+env(safe-area-inset-bottom,0px))] left-1/2 z-[80] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-full bg-ink px-4.5 py-2.5 text-center text-sm text-bg shadow-float lg:bottom-10">
      {t}
    </div>
  );
}

/* ── 결과 화면 공통 (공부·아르바이트·뽑기·운세) ── */
export function ResultSheet({ eyebrow, big, bigClass, children, actions }: { eyebrow?: string; big?: React.ReactNode; bigClass?: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  const closeSheet = useOverlay((s) => s.closeSheet);
  return (
    <>
      <div className="px-2 py-4 text-center">
        {eyebrow && <span className="eyebrow block">{eyebrow}</span>}
        {big !== undefined && <div className={cx("my-1.5 font-display text-[30px] font-semibold", bigClass)}>{big}</div>}
        <div className="space-y-1 [&>p]:my-1">{children}</div>
      </div>
      <SheetActions>{actions ?? <button onClick={closeSheet} className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-4 font-semibold text-gold-ink">확인</button>}</SheetActions>
    </>
  );
}

/* ── Lightbox: 탭하면 전체 화면, 여러 장이면 좌우로 순환, 한 번 더 탭하면 2배 ── */
export function LightboxRoot() {
  const lb = useOverlay((s) => s.lightbox);
  const close = useOverlay((s) => s.closeLightbox);
  if (!lb) return null;
  return <Lightbox key={`${lb.i}:${lb.srcs.join("|")}`} srcs={lb.srcs} start={lb.i} close={close} />;
}

function Lightbox({ srcs, start, close }: { srcs: string[]; start: number; close: () => void }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const x0 = useRef<number | null>(null);
  const n = srcs.length;
  const go = useCallback((d: number) => { if (n > 1) { setI((v) => (v + d + n) % n); setZoom(false); } }, [n]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [close, go]);

  return (
    <div role="dialog" aria-modal="true" aria-label="이미지 크게 보기" className="anim-fadein fixed inset-0 z-[90] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between px-2 pt-[calc(8px+env(safe-area-inset-top,0px))] pb-2 text-[13px]">
        <span className="pl-3 tnum">{n > 1 ? `${i + 1} / ${n}` : ""}</span>
        <IconButton label="닫기" onClick={close} className="text-white hover:bg-white/10"><X size={22} strokeWidth={1.6} /></IconButton>
      </div>
      <div
        className="grid flex-1 place-items-center overflow-auto pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        onTouchStart={(e) => { x0.current = e.touches.length === 1 ? e.touches[0].clientX : null; }}
        onTouchEnd={(e) => {
          if (x0.current == null || zoom) return;
          const dx = e.changedTouches[0].clientX - x0.current; x0.current = null;
          if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcs[i]}
          alt="확대한 이미지"
          onClick={() => setZoom((z) => !z)}
          className={cx("select-none object-contain", zoom ? "max-h-none max-w-none w-[200vw] cursor-zoom-out" : "max-h-[calc(100vh-120px)] max-w-[100vw] cursor-zoom-in")}
        />
      </div>
      {n > 1 && (
        <>
          <button aria-label="이전 이미지" onClick={() => go(-1)} className="absolute left-2.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25"><ChevronLeft size={22} /></button>
          <button aria-label="다음 이미지" onClick={() => go(1)} className="absolute right-2.5 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25"><ChevronRight size={22} /></button>
        </>
      )}
    </div>
  );
}

/* ── 이미지 그리드 (타임라인·역극 첨부) ── */
export function ImageGrid({ srcs, className }: { srcs: string[]; className?: string }) {
  const open = useOverlay((s) => s.openLightbox);
  if (!srcs.length) return null;
  const n = srcs.length;
  return (
    <div className={cx("grid gap-1 overflow-hidden rounded-xl", n >= 2 && "grid-cols-2", className)}>
      {srcs.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={s}
          alt="첨부 이미지"
          loading="lazy"
          onClick={() => open(srcs, i)}
          className={cx("w-full cursor-zoom-in bg-sunk object-cover", n === 1 ? "max-h-[420px]" : "aspect-[4/3] max-h-[340px] h-full", n === 3 && i === 0 && "row-span-2 h-full")}
        />
      ))}
    </div>
  );
}

/* ── 첨부 미리보기 ── */
export function PreviewImages({ srcs, onRemove }: { srcs: string[]; onRemove: (i: number) => void }) {
  if (!srcs.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {srcs.map((s, i) => (
        <div key={i} className="relative size-[72px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s} alt="첨부 미리보기" className="size-full rounded-[4px] object-cover" />
          <button aria-label="이미지 빼기" onClick={() => onRemove(i)} className="absolute -right-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-ink text-bg"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}
