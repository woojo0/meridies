"use client";

import { FlaskConical } from "lucide-react";
import { GRADES, RATION } from "@/lib/constants";
import { gIdx } from "@/lib/format";
import { useMe, useNow } from "@/lib/hooks";
import { toast } from "@/lib/overlay";
import { rationToday, useStore } from "@/lib/store";

/** 오늘의 빛: 제국력 828년, 하루 실효 일조 약 6시간. 하루 한 번 솔리스 배급. */
export function SunStrip() {
  const me = useMe();
  const now = useNow();
  const ration = useStore((s) => s.ration);
  if (!me) return null;
  const got = rationToday(me, now);
  const g = gIdx(me.scores.kw);
  const amt = RATION[g];
  const d = new Date(now);
  const hour = d.getHours() + d.getMinutes() / 60;
  const lit = hour >= 9 && hour < 15;

  return (
    <div className="card relative mt-2 overflow-hidden px-5 py-4">
      <div className="pointer-events-none absolute -right-10 -top-14 size-40 rounded-full bg-gold/15 blur-2xl" aria-hidden="true" />
      <div className="relative flex items-center gap-4">
        <span className="relative inline-block size-8 shrink-0" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-gold shadow-[0_0_18px_-2px_var(--gold)]" />
          <span className="absolute inset-0 rounded-full bg-surface transition-transform duration-700" style={{ transform: lit ? "translateX(40%)" : "translateX(18%)" }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-x-2.5">
            <span className="text-[12px] font-semibold tracking-[.06em] text-muted">오늘의 빛</span>
            <b className="tnum font-display text-[16px] leading-none">약 6시간</b>
            <span className="text-[11.5px] text-muted">제국력 828년</span>
          </div>
          <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-sunk" aria-hidden="true">
            <i className="absolute inset-y-0 left-[37%] w-1/4 rounded-full bg-gold" />
            <i className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-ink ring-2 ring-surface" style={{ left: `calc(${(hour / 24) * 100}% - 4px)` }} />
          </div>
        </div>
        {got ? (
          <span className="inline-flex h-7 shrink-0 items-center rounded-full bg-sunk px-2.5 text-[11.5px] text-muted">배급 받음</span>
        ) : (
          <button
            onClick={() => { const n = ration(); toast(n ? `솔리스 ${n}병을 배급받았어요. (광휘 실습 ${GRADES[g].k})` : "오늘 배급은 이미 받았어요."); }}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-gold/45 bg-surface px-2.5 text-[11.5px] font-medium text-gold shadow-[0_1px_0_var(--gold-soft)] transition-colors hover:bg-gold-soft active:translate-y-px"
          >
            <FlaskConical size={12} strokeWidth={1.9} /> 배급 {amt}병
          </button>
        )}
      </div>
    </div>
  );
}
