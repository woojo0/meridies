"use client";

import { cx } from "@/lib/format";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

/* ── Button: 알약 모양. primary는 금빛, ghost는 테두리, text는 글자만 ── */
type BtnVariant = "primary" | "ghost" | "text" | "ink";
type BtnSize = "md" | "sm";
export function Button({ variant = "primary", size = "md", block, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; block?: boolean }) {
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-semibold tracking-[.01em] transition-[background,opacity,color,transform] duration-150 active:scale-[.98] disabled:opacity-40 disabled:active:scale-100",
        size === "md" ? "min-h-11 px-5 text-[15px]" : "min-h-9 px-3.5 text-[13px]",
        variant === "primary" && "bg-gold text-gold-ink hover:brightness-105",
        variant === "ink" && "bg-ink text-bg hover:opacity-90",
        variant === "ghost" && "border border-line bg-surface text-ink hover:border-line-strong",
        variant === "text" && "text-ink underline-offset-4 hover:underline",
        block && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Icon button (44×44) ── */
export function IconButton({ className, children, label, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...rest} aria-label={label} className={cx("relative grid size-11 shrink-0 place-items-center rounded-full transition-colors hover:bg-sunk disabled:opacity-30", className)}>
      {children}
    </button>
  );
}

/* ── Chip ── */
export function Chip({ on, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button
      {...rest}
      aria-pressed={on}
      className={cx(
        "inline-flex min-h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors",
        on ? "border-gold/50 bg-gold-soft text-gold" : "border-line bg-surface text-muted hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ChipRow({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cx("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1", className)}>
      {children}
    </div>
  );
}

/* ── Pill ── */
export function Pill({ tone = "default", className, children }: { tone?: "default" | "gold" | "ink" | "good" | "crit"; className?: string; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-block rounded-full px-2 py-px text-[11.5px] font-semibold tracking-[.02em]",
        tone === "default" && "bg-sunk text-muted",
        tone === "gold" && "bg-gold-soft text-gold",
        tone === "ink" && "bg-ink text-bg",
        tone === "good" && "bg-sunk text-good",
        tone === "crit" && "bg-sunk text-crit",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ── Section heading: 세리프 제목 + 뒤로 이어지는 가는 선 ── */
export function SectionHead({ title, aside, className, size = "md" }: { title: ReactNode; aside?: ReactNode; className?: string; size?: "md" | "sm" }) {
  return (
    <div className={cx("mb-3 mt-9 flex items-center gap-3", className)}>
      <h2 className={cx("shrink-0", size === "md" ? "text-[20px]" : "text-[16px]")}>{title}</h2>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
      {aside && <span className="shrink-0 text-xs text-muted">{aside}</span>}
    </div>
  );
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <span className={cx("eyebrow block", className)}>{children}</span>;
}

/* ── Field ── */
export function Field({ label, htmlFor, hint, children, className }: { label: ReactNode; htmlFor?: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("mb-3.5 flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-muted">{label}</label>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}
export const Input = ({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx("field-input", className)} />;
export const Textarea = ({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx("field-input", className)} />;
export const Select = ({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={cx("field-input", className)} />;

/* ── Tabs: 알약 세그먼트 ── */
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { k: T; l: ReactNode }[]; value: T; onChange: (k: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cx("no-scrollbar mb-5 flex gap-1 overflow-x-auto rounded-full bg-sunk p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.k}
          role="tab"
          aria-selected={value === t.k}
          onClick={() => onChange(t.k)}
          className={cx(
            "flex-[1_0_auto] whitespace-nowrap rounded-full px-3.5 py-2 text-[13.5px] transition-all",
            value === t.k ? "bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,.08)]" : "text-muted hover:text-ink",
          )}
        >
          {t.l}
        </button>
      ))}
    </div>
  );
}

/* ── List rows (카드 안에서 쓰는 행) ── */
export const RowTitle = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx("block font-semibold", className)}>{children}</span>
);
export const RowSub = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx("block truncate text-[13px] text-muted", className)}>{children}</span>
);
/** 카드 안의 행. 마지막 행은 구분선 없음. */
export const rowCls = "group flex w-full min-h-14 items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-sunk/60 border-b border-line last:border-b-0 first:rounded-t-[var(--r)] last:rounded-b-[var(--r)]";

export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("py-8 text-center text-sm text-muted", className)}>{children}</div>;
}

export function Note({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("my-3 rounded-xl bg-sunk/70 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted", className)}>{children}</p>;
}

/* ── Key/Value ── */
export function KV({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cx("mb-3.5 grid grid-cols-[76px_minmax(0,1fr)] gap-x-4 gap-y-2.5", className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="pt-0.5 text-[12.5px] tracking-[.04em] text-muted">{k}</dt>
          <dd className="m-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── 역극 텍스트: 괄호 안 지문은 흐리게 ── */
export function RpText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\([^()\n]+\))/g);
  return (
    <span className={cx("prose-rp", className)}>
      {parts.map((p, i) => (p.startsWith("(") && p.endsWith(")") ? <span key={i} className="jimun">{p}</span> : <span key={i}>{p}</span>))}
    </span>
  );
}

/* ── Progress ── */
export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx("my-3 h-1.5 overflow-hidden rounded-full bg-sunk", className)}>
      <i className="block h-full rounded-full bg-gold transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export const Hr = ({ className }: { className?: string }) => <hr className={cx("my-0 border-0 border-t border-line", className)} />;

/* ── Segmented ── */
export function Segmented<T extends string | number>({ options, value, onChange }: { options: { v: T; l: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" className="grid gap-1 rounded-full bg-sunk p-1" style={{ gridTemplateColumns: `repeat(${options.length},1fr)` }}>
      {options.map((o) => (
        <button
          key={String(o.v)}
          aria-pressed={o.v === value}
          onClick={() => onChange(o.v)}
          className={cx("rounded-full px-1 py-2.5 text-sm transition-all", o.v === value ? "bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,.08)]" : "text-muted hover:text-ink")}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}
