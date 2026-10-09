"use client";

import Link from "next/link";
import { useOverlay } from "@/lib/overlay";
import { ago, cx } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Msg } from "@/lib/types";
import { Avatar } from "../ui/identity";
import { RpText } from "../ui/primitives";

/** 역극 메시지: 말풍선 없이, 이름·시간·본문. 내 메시지는 이름이 금빛. */
export function Message({ m, now, onEdit, tint }: { m: Msg; now: number; onEdit?: (m: Msg) => void; tint?: "gold" | "dorm" }) {
  const c = useStore((s) => s.data.chars.find((x) => x.id === m.charId));
  const meId = useStore((s) => s.session.charId);
  const openLightbox = useOverlay((s) => s.openLightbox);
  if (!c) return null;
  const mine = m.charId === meId;
  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-2.5">
      <Link href={`/profile/${c.id}`} aria-label={c.name} className="self-start"><Avatar c={c} stage={m.stage} size="sm" className="size-9" /></Link>
      <div className="min-w-0">
        <div className={cx("mb-1 flex items-baseline gap-1.5 text-[13px] font-semibold", mine && tint !== "dorm" && "text-gold")} style={mine && tint === "dorm" ? { color: `var(--tint-${c.dorm})` } : undefined}>
          {c.name}
          <span className="text-[11.5px] font-normal text-muted">{ago(m.at, now)}{m.edited ? " · 수정됨" : ""}</span>
          {mine && onEdit && <button onClick={() => onEdit(m)} className="ml-auto text-[11.5px] font-normal text-muted underline-offset-2 hover:underline">수정</button>}
        </div>
        {m.text && <div><RpText text={m.text} /></div>}
        {m.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.image} alt="첨부 이미지" loading="lazy" onClick={() => openLightbox([m.image!], 0)} className="mt-2 max-h-[320px] max-w-full cursor-zoom-in rounded-[4px]" />
        )}
      </div>
    </div>
  );
}
