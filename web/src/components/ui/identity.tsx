"use client";

import { dorm as dormOf } from "@/lib/constants";
import { cx } from "@/lib/format";
import { prof } from "@/lib/store";
import type { Character, DormId, Stage } from "@/lib/types";

/** 금빛 원 — 제국의 문장이자 검은 정오. */
export function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true" className={cx("shrink-0", className)}>
      <circle cx="14" cy="14" r="12" className="fill-gold" />
      <circle cx="17.5" cy="12" r="10.5" className="fill-bg" />
    </svg>
  );
}

const SIZES = { xs: 24, sm: 30, md: 42, lg: 84, xl: 112 } as const;
export type AvatarSize = keyof typeof SIZES;

/** 두상. 아직 올리지 않았으면 사람 실루엣(이름 초성 없음). */
export function Avatar({ c, stage, size = "md", className }: { c: Character; stage?: number; size?: AvatarSize; className?: string }) {
  const px = SIZES[size];
  const src = prof(c, stage ?? 0).p.avatar;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={`${c.name} 두상`} width={px} height={px} className={cx("shrink-0 rounded-full object-cover bg-sunk", className)} style={{ width: px, height: px }} />
    );
  }
  return (
    <svg width={px} height={px} viewBox="0 0 48 48" role="img" aria-label={`${c.name} 두상`} className={cx("shrink-0 rounded-full", className)} style={{ width: px, height: px }}>
      <rect width="48" height="48" style={{ fill: "var(--av-bg)" }} />
      <circle cx="24" cy="20" r="8.5" style={{ fill: "var(--av-fg)" }} />
      <path d="M8 48c1.5-10 8-15 16-15s14.5 5 16 15z" style={{ fill: "var(--av-fg)" }} />
    </svg>
  );
}

/** 전신 자리. */
export function FullBody({ c, stage }: { c: Character; stage: number }) {
  const src = prof(c, stage).p.body;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={`${c.name} 전신`} className="mx-auto max-h-[70vh] w-auto rounded-r" />;
  }
  return (
    <svg viewBox="0 0 160 300" role="img" aria-label={`${c.name} 전신 자리`} className="h-auto w-[min(240px,70%)]">
      <line x1="20" y1="286" x2="140" y2="286" style={{ stroke: "var(--line)" }} />
      <circle cx="80" cy="54" r="24" style={{ fill: "var(--av-fg)" }} />
      <path d="M52 92 Q80 80 108 92 L124 280 Q80 290 36 280 Z" style={{ fill: "var(--av-fg)" }} />
      <text x="80" y="200" textAnchor="middle" style={{ font: "500 11px var(--font-body)", fill: "var(--muted)" }}>전신 이미지 자리</text>
    </svg>
  );
}

/** 학부 문장: 색이 있는 원. 제5학부는 빈 원. */
export function Crest({ id, size = 32, className }: { id: DormId; size?: number; className?: string }) {
  if (id === "fifth") {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={cx("shrink-0", className)}>
        <circle cx="20" cy="20" r="17" style={{ fill: "none", stroke: "var(--fifth)", strokeWidth: 2 }} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className={cx("shrink-0", className)}>
      <circle cx="20" cy="20" r="18" style={{ fill: `var(--${id})` }} />
    </svg>
  );
}

/** 학부 색 점. 이름은 적지 않고 색으로만. */
export function DormDot({ id, className }: { id: DormId; className?: string }) {
  const f = id === "fifth";
  return (
    <span
      className={cx("inline-block size-2 shrink-0 rounded-full", className)}
      title={`${dormOf(id).name}`}
      style={f ? { boxShadow: "inset 0 0 0 1.5px var(--fifth)" } : { background: `var(--${id})` }}
    />
  );
}

/** 학부 점 + 성별·키. */
export function DormTag({ c, stage, className }: { c: Character; stage: number; className?: string }) {
  const p = prof(c, stage).p;
  const bits = [p.gender, p.height].filter(Boolean).join(" · ");
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted", className)}>
      <DormDot id={c.dorm} />
      {bits}
    </span>
  );
}

export function stageOf(c: Character, stage: number): Stage {
  return prof(c, stage).stage;
}
