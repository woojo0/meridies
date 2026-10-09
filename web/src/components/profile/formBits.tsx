"use client";
/* eslint-disable @next/next/no-img-element -- 사용자가 올린 미리보기 이미지 */

import { X } from "lucide-react";
import { useState } from "react";
import { cx, shrinkImage } from "@/lib/format";
import { toast } from "@/lib/overlay";

/** 이미지 선택 카드 (두상/전신). */
export function ImagePick({ label, value, onChange, round, compact }: { label: string; value: string | null; onChange: (src: string | null) => void; round?: boolean; compact?: boolean }) {
  return (
    <label className={cx("card relative flex cursor-pointer flex-col items-center gap-2 text-center text-xs text-muted hover:border-gold", compact ? "p-4" : "p-5")}>
      {value ? (
        <img src={value} alt={label} className={cx("object-cover", round ? (compact ? "size-20 rounded-full" : "size-24 rounded-full") : (compact ? "h-20 w-auto rounded-lg" : "h-24 w-auto rounded-lg"))} />
      ) : (
        <span className={cx("grid place-items-center bg-sunk", round ? (compact ? "size-20 rounded-full" : "size-24 rounded-full") : (compact ? "h-20 w-12 rounded-lg" : "h-24 w-14 rounded-lg"))}>{label}</span>
      )}
      {label} {value ? "바꾸기" : "올리기"}
      <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { onChange(await shrinkImage(f)); } catch { toast("이미지를 읽지 못했어요."); } }} />
      {value && <button type="button" aria-label={`${label} 지우기`} onClick={(e) => { e.preventDefault(); onChange(null); }} className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-surface text-muted shadow-card hover:text-crit"><X size={13} /></button>}
    </label>
  );
}

/** 키워드 칩 입력. 쉼표·Enter로 추가. */
export function KeywordsInput({ id, value, onChange, max = 12 }: { id?: string; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const items = raw.split(/[,\n/]/).map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    onChange([...value, ...items.filter((i) => !value.includes(i))].slice(0, max));
    setDraft("");
  };
  return (
    <div className="field-input flex min-h-[46px] flex-wrap items-center gap-1.5 py-1.5">
      {value.map((k) => (
        <span key={k} className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-0.5 text-[13px] text-gold">
          {k}
          <button type="button" aria-label={`${k} 빼기`} onClick={() => onChange(value.filter((x) => x !== k))} className="text-gold/70 hover:text-crit"><X size={12} /></button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => { if (/[,\n/]/.test(e.target.value)) add(e.target.value); else setDraft(e.target.value); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(draft); } if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1)); }}
        onBlur={() => add(draft)}
        className="min-w-[80px] flex-1 bg-transparent text-[15px] focus:outline-none"
        aria-label="키워드 입력"
      />
    </div>
  );
}
