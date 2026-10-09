"use client";

import { useEffect, useMemo, useState } from "react";
import { cx } from "@/lib/format";
import { Chip, ChipRow } from "../ui/primitives";

type Block =
  | { t: "h2"; id: string; text: string }
  | { t: "h3"; text: string }
  | { t: "lead"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "p"; lines: string[] };

/** 아주 작은 마크다운: ##, ###, > 인용, * 목록, 1. 목록, **굵게**. */
export function parseDoc(src: string): Block[] {
  let h = 0;
  return src.trim().split(/\n\s*\n/).map((raw): Block => {
    const b = raw.trim();
    if (b.startsWith("## ")) return { t: "h2", id: `h${h++}`, text: b.slice(3) };
    if (b.startsWith("### ")) return { t: "h3", text: b.slice(4) };
    if (b.startsWith("> ")) return { t: "lead", text: b.slice(2) };
    const lines = b.split("\n");
    if (lines.every((l) => /^\* /.test(l))) return { t: "ul", items: lines.map((l) => l.slice(2)) };
    if (lines.every((l) => /^\d+\. /.test(l))) return { t: "ol", items: lines.map((l) => l.replace(/^\d+\. /, "")) };
    return { t: "p", lines };
  });
}

function Inline({ s }: { s: string }) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => (p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>))}</>;
}

/** 문서 뷰. 모바일: 상단 목차 칩. PC: 오른쪽에 따라붙는 목차. */
export function DocView({ src, embedded }: { src: string; embedded?: boolean }) {
  const blocks = useMemo(() => parseDoc(src), [src]);
  const toc = blocks.filter((b): b is Extract<Block, { t: "h2" }> => b.t === "h2");
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (embedded || !toc.length) return;
    const els = toc.map((t) => document.getElementById(t.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [toc, embedded]);

  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const article = (
    <article className="doc card mt-2 px-5 py-6 lg:px-8 lg:py-8">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "h2": return <h2 key={i} id={b.id} className="scroll-mt-24">{b.text}</h2>;
          case "h3": return <h3 key={i}>{b.text}</h3>;
          case "lead": return <p key={i} className="lead">{b.text}</p>;
          case "ul": return <ul key={i}>{b.items.map((x, k) => <li key={k}><Inline s={x} /></li>)}</ul>;
          case "ol": return <ol key={i}>{b.items.map((x, k) => <li key={k}><Inline s={x} /></li>)}</ol>;
          default: return <p key={i}>{b.lines.map((l, k) => <span key={k}><Inline s={l} />{k < b.lines.length - 1 && <br />}</span>)}</p>;
        }
      })}
    </article>
  );

  if (embedded) return article;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px] lg:gap-7">
      {/* 모바일 목차 */}
      <div className="sticky top-[62px] z-10 -mx-4 bg-bg/85 px-4 py-2 backdrop-blur-xl lg:hidden">
        <ChipRow>
          {toc.map((b) => <Chip key={b.id} on={active === b.id} onClick={() => jump(b.id)}>{b.text}</Chip>)}
        </ChipRow>
      </div>
      <div className="min-w-0">{article}</div>
      {/* PC 목차 */}
      <aside className="hidden lg:block">
        <nav aria-label="목차" className="sticky top-[84px] mt-2 border-l border-line pl-4">
          <span className="eyebrow mb-2 block">목차</span>
          <ul className="flex flex-col gap-0.5">
            {toc.map((b) => (
              <li key={b.id}>
                <button
                  onClick={() => jump(b.id)}
                  className={cx(
                    "-ml-[17px] block w-[calc(100%+17px)] border-l-2 py-1.5 pl-4 text-left text-[13px] leading-snug transition-colors",
                    active === b.id ? "border-gold font-semibold text-ink" : "border-transparent text-muted hover:text-ink",
                  )}
                >
                  {b.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
