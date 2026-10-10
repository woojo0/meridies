"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useEffect } from "react";
import { LIVE } from "@/lib/firebase";
import { watchDoc } from "@/lib/live";
import { useStore } from "@/lib/store";
import { DocView } from "./DocView";

/** 운영자가 고친 문서가 있으면 그걸, 없으면 기본 원문을 보여줘요. */
export function LiveDoc({ id, fallback, embedded }: { id: "world" | "handbook" | "rules"; fallback: string; embedded?: boolean }) {
  const entry = useStore((s) => s.docTexts[id]);
  const admin = useStore((s) => s.session.admin);
  useEffect(() => { if (LIVE) return watchDoc(id); }, [id]);
  const text = entry?.text ?? fallback;
  return (
    <>
      {(entry?.updatedAt || admin) && (
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted">
          <span>{entry?.updatedAt ? <>최종 수정 {new Date(entry.updatedAt).toLocaleDateString("ko-KR")}{entry.summary ? ` · ${entry.summary}` : ""}</> : null}</span>
          {admin && <Link href={`/more/admin?tab=docs&doc=${id}`} className="inline-flex items-center gap-1 text-gold underline-offset-2 hover:underline"><Pencil size={12} strokeWidth={1.8} />이 문서 수정</Link>}
        </div>
      )}
      <DocView src={text} embedded={embedded} />
    </>
  );
}
