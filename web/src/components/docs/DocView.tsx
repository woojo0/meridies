"use client";

import { useMemo } from "react";
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

/** 문서 뷰: 상단 목차 칩을 누르면 해당 절로 이동. */
export function DocView({ src, embedded }: { src: string; embedded?: boolean }) {
  const blocks = useMemo(() => parseDoc(src), [src]);
  const toc = blocks.filter((b): b is Extract<Block, { t: "h2" }> => b.t === "h2");
  return (
    <>
      {!embedded && (
        <div className="sticky top-[62px] z-10 -mx-4 bg-bg/85 px-4 py-2 backdrop-blur-xl lg:-mx-8 lg:px-8">
          <ChipRow>
            {toc.map((b) => <Chip key={b.id} onClick={() => document.getElementById(b.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}>{b.text}</Chip>)}
          </ChipRow>
        </div>
      )}
      <article className="doc card mt-2 px-5 py-6 lg:px-8 lg:py-8">
        {blocks.map((b, i) => {
          switch (b.t) {
            case "h2": return <h2 key={i} id={b.id}>{b.text}</h2>;
            case "h3": return <h3 key={i}>{b.text}</h3>;
            case "lead": return <p key={i} className="lead">{b.text}</p>;
            case "ul": return <ul key={i}>{b.items.map((x, k) => <li key={k}><Inline s={x} /></li>)}</ul>;
            case "ol": return <ol key={i}>{b.items.map((x, k) => <li key={k}><Inline s={x} /></li>)}</ol>;
            default: return <p key={i}>{b.lines.map((l, k) => <span key={k}><Inline s={l} />{k < b.lines.length - 1 && <br />}</span>)}</p>;
          }
        })}
      </article>
    </>
  );
}
