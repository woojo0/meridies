"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/format";

export interface DropdownOption<T extends string> { v: T; l: ReactNode; sub?: ReactNode }

/** 기본 select 대신 쓰는 드롭다운. 카드 톤의 목록, 키보드(↑↓ Enter Esc) 지원. */
export function Dropdown<T extends string>({ value, options, onChange, placeholder = "고르기", id, className, disabled }: {
  value: T | ""; options: DropdownOption<T>[]; onChange: (v: T) => void; placeholder?: string; id?: string; className?: string; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const cur = options.find((o) => o.v === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const choose = (o: DropdownOption<T>) => { onChange(o.v); setOpen(false); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setOpen(true); setHi(Math.max(0, options.findIndex((o) => o.v === value))); return; }
      setHi((h) => (e.key === "ArrowDown" ? Math.min(options.length - 1, h + 1) : Math.max(0, h - 1)));
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && hi >= 0) choose(options[hi]); else setOpen((o) => !o);
    }
  };

  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => { setOpen((o) => !o); setHi(Math.max(0, options.findIndex((o) => o.v === value))); }}
        onKeyDown={onKey}
        className={cx(
          "field-input flex w-full items-center justify-between gap-2 text-left",
          open && "border-gold shadow-[0_0_0_3px_var(--glow)]",
          disabled && "opacity-50",
        )}
      >
        <span className={cx("min-w-0 truncate", !cur && "text-muted/70")}>{cur ? cur.l : placeholder}</span>
        <ChevronDown size={16} strokeWidth={1.8} className={cx("shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="anim-up absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[280px] overflow-y-auto rounded-2xl border border-line bg-surface p-1.5 shadow-float"
        >
          {options.map((o, i) => {
            const on = o.v === value;
            return (
              <li
                key={o.v}
                role="option"
                aria-selected={on}
                onMouseEnter={() => setHi(i)}
                onClick={() => choose(o)}
                className={cx(
                  "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[14px] transition-colors",
                  i === hi ? "bg-sunk" : "",
                  on && "font-semibold text-ink",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{o.l}</span>
                  {o.sub && <span className="block truncate text-xs font-normal text-muted">{o.sub}</span>}
                </span>
                {on && <Check size={15} strokeWidth={2} className="shrink-0 text-gold" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
