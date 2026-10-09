"use client";

import { useEffect } from "react";
import { LIVE } from "@/lib/firebase";
import { watchDoc } from "@/lib/live";
import { useStore } from "@/lib/store";
import { DocView } from "./DocView";

/** 운영자가 고친 문서가 있으면 그걸, 없으면 기본 원문을 보여줘요. */
export function LiveDoc({ id, fallback, embedded }: { id: "world" | "handbook" | "rules"; fallback: string; embedded?: boolean }) {
  const entry = useStore((s) => s.docTexts[id]);
  useEffect(() => { if (LIVE) return watchDoc(id); }, [id]);
  const text = entry?.text ?? fallback;
  return (
    <>
      {entry?.updatedAt ? (
        <p className="mt-2 text-xs text-muted">최종 수정 {new Date(entry.updatedAt).toLocaleDateString("ko-KR")}{entry.summary ? ` · ${entry.summary}` : ""}</p>
      ) : null}
      <DocView src={text} embedded={embedded} />
    </>
  );
}
