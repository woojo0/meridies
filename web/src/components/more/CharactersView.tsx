"use client";
/* eslint-disable @next/next/no-img-element -- 사용자가 올린 두상 */

import Link from "next/link";
import { useState } from "react";
import { DORMS } from "@/lib/constants";
import { prof, useStore } from "@/lib/store";
import type { DormId } from "@/lib/types";
import { Crest, DormDot } from "../ui/identity";
import { Chip, ChipRow, Empty } from "../ui/primitives";

/** 캐릭터 목록: 3:4 두상 카드. 전체/기숙사별 필터. 이름 / 성별·키·생일. */
export function CharactersView() {
  const chars = useStore((s) => s.data.chars);
  const stage = useStore((s) => s.data.stage);
  const [dorm, setDorm] = useState<DormId | "all">("all");
  const list = chars.filter((c) => dorm === "all" || c.dorm === dorm).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  return (
    <>
      <ChipRow className="pt-2">
        <Chip on={dorm === "all"} onClick={() => setDorm("all")}>전체 · {chars.length}</Chip>
        {DORMS.map((d) => (
          <Chip key={d.id} on={dorm === d.id} onClick={() => setDorm(d.id)}><Crest id={d.id} size={14} />{d.name} · {chars.filter((c) => c.dorm === d.id).length}</Chip>
        ))}
      </ChipRow>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5 lg:gap-4">
        {list.map((c) => {
          const p = prof(c, stage).p;
          const bits = [p.gender, p.height, p.birthday].filter(Boolean);
          const tint = c.dorm === "fifth" ? "var(--sunk)" : `color-mix(in srgb, var(--${c.dorm}) 14%, var(--sunk))`;
          return (
            <Link key={c.id} href={`/profile/${c.id}`} className="card group overflow-hidden transition-transform hover:-translate-y-0.5">
              <div className="relative aspect-[3/4] w-full overflow-hidden" style={{ background: tint }}>
                {p.avatar ? (
                  <img src={p.avatar} alt={`${c.name} 두상`} className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                ) : (
                  <svg viewBox="0 0 48 64" className="size-full" aria-hidden="true">
                    <circle cx="24" cy="24" r="11" style={{ fill: "var(--av-fg)" }} />
                    <path d="M4 64c1.5-14 9-21 20-21s18.5 7 20 21z" style={{ fill: "var(--av-fg)" }} />
                  </svg>
                )}
              </div>
              <div className="px-3 pt-2.5 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-[14.5px] font-semibold">{c.name}</span>
                  <DormDot id={c.dorm} className="size-2" />
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-muted">{bits.length ? bits.join(" · ") : "프로필 준비 중"}</div>
                {p.catchphrase && <div className="mt-0.5 truncate text-[11px] text-gold">[ {p.catchphrase} ]</div>}
              </div>
            </Link>
          );
        })}
        {!list.length && <Empty className="col-span-full">이 학부에는 아직 아무도 없어요.</Empty>}
      </div>
    </>
  );
}
