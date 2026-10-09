"use client";

import Link from "next/link";
import { useState } from "react";
import { DORMS } from "@/lib/constants";
import { useStore } from "@/lib/store";
import type { DormId } from "@/lib/types";
import { Avatar, Crest, DormTag } from "../ui/identity";
import { Chip, ChipRow, Empty } from "../ui/primitives";

/** 캐릭터 목록. 학부 칩은 목록 탐색용(타임라인에는 필터를 두지 않아요). */
export function CharactersView() {
  const chars = useStore((s) => s.data.chars);
  const stage = useStore((s) => s.data.stage);
  const [dorm, setDorm] = useState<DormId | "all">("all");
  const list = chars.filter((c) => dorm === "all" || c.dorm === dorm);
  return (
    <>
      <ChipRow className="pt-2">
        <Chip on={dorm === "all"} onClick={() => setDorm("all")}>전체 · {chars.length}</Chip>
        {DORMS.map((d) => (
          <Chip key={d.id} on={dorm === d.id} onClick={() => setDorm(d.id)}><Crest id={d.id} size={14} />{d.name} · {chars.filter((c) => c.dorm === d.id).length}</Chip>
        ))}
      </ChipRow>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((c) => (
          <Link key={c.id} href={`/profile/${c.id}`} className="card group flex min-w-0 flex-col items-center gap-2 p-4 text-center transition-transform hover:-translate-y-0.5">
            <span className="rounded-full p-[3px] ring-1 ring-line group-hover:ring-gold/50"><Avatar c={c} stage={stage} size="lg" className="size-16" /></span>
            <span className="font-semibold leading-tight">{c.name}</span>
            <DormTag c={c} stage={stage} />
          </Link>
        ))}
        {!list.length && <Empty className="col-span-full">이 학부에는 아직 아무도 없어요.</Empty>}
      </div>
    </>
  );
}
