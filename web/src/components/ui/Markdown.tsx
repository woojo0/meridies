"use client";

import { useMemo, type ReactNode } from "react";
import { cx } from "@/lib/format";

/**
 * 프로필 소개용 작은 마크다운.
 * 지원: # ## ### 제목, **굵게**, *기울임*, ~~취소~~, `코드`, > 인용, - 목록, 1. 목록, --- 구분선, 빈 줄 문단, 줄바꿈 유지.
 * HTML은 해석하지 않아요(안전).
 */
function inline(s: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|~~[^~]+~~|`[^`]+`|__[^_]+__|_[^_\n]+_)/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**") || t.startsWith("__")) out.push(<b key={`${key}-${i++}`}>{t.slice(2, -2)}</b>);
    else if (t.startsWith("~~")) out.push(<s key={`${key}-${i++}`} className="opacity-70">{t.slice(2, -2)}</s>);
    else if (t.startsWith("`")) out.push(<code key={`${key}-${i++}`} className="rounded bg-sunk px-1 py-0.5 text-[0.9em]">{t.slice(1, -1)}</code>);
    else out.push(<i key={`${key}-${i++}`}>{t.slice(1, -1)}</i>);
    last = m.index + t.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function lines(text: string, key: number) {
  const ls = text.split("\n");
  return ls.map((l, i) => <span key={`${key}-l${i}`}>{inline(l, key * 100 + i)}{i < ls.length - 1 && <br />}</span>);
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = useMemo(() => text.replace(/\r/g, "").trim().split(/\n\s*\n/), [text]);
  if (!text.trim()) return null;
  return (
    <div className={cx("md break-words leading-[1.8]", className)}>
      {blocks.map((raw, k) => {
        const b = raw.trim();
        if (/^---+$/.test(b)) return <hr key={k} className="my-4 border-0 border-t border-line" />;
        const h = /^(#{1,3})\s+(.*)$/.exec(b);
        if (h) {
          const lvl = h[1].length;
          const cls = lvl === 1 ? "mt-5 mb-2 text-[22px]" : lvl === 2 ? "mt-4 mb-1.5 text-[18px]" : "mt-3 mb-1 text-[15.5px]";
          return <h3 key={k} className={cx("font-display font-semibold", cls)}>{inline(h[2], k)}</h3>;
        }
        if (b.startsWith("> ")) return <blockquote key={k} className="my-2 border-l-2 border-gold pl-3 text-muted">{lines(b.split("\n").map((l) => l.replace(/^>\s?/, "")).join("\n"), k)}</blockquote>;
        const ls = b.split("\n");
        if (ls.every((l) => /^[-*]\s/.test(l))) return <ul key={k} className="my-2 list-disc pl-5">{ls.map((l, i) => <li key={i}>{inline(l.slice(2), k * 100 + i)}</li>)}</ul>;
        if (ls.every((l) => /^\d+\.\s/.test(l))) return <ol key={k} className="my-2 list-decimal pl-5">{ls.map((l, i) => <li key={i}>{inline(l.replace(/^\d+\.\s/, ""), k * 100 + i)}</li>)}</ol>;
        return <p key={k} className="my-2 first:mt-0 last:mb-0">{lines(b, k)}</p>;
      })}
    </div>
  );
}
