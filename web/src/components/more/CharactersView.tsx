"use client";

import Link from "next/link";
import { useState } from "react";
import { DORMS } from "@/lib/constants";
import { prof, useStore } from "@/lib/store";
import type { DormId } from "@/lib/types";
import { Avatar, Crest, DormDot } from "../ui/identity";
import { Chip, ChipRow, Empty, rowCls } from "../ui/primitives";

/** 캐릭터 목록: 전체/기숙사별 필터. 두 줄 — 이름 / 성별·키·생일. */
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
      <div className="card-flat mt-3 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:px-3">
        {list.map((c) => {
          const p = prof(c, stage).p;
          const bits = [p.gender, p.height, p.birthday].filter(Boolean).join(" · ");
          return (
            <Link key={c.id} href={`/profile/${c.id}`} className={rowCls}>
              <Avatar c={c} stage={stage} size="md" className="size-12" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold"><DormDot id={c.dorm} />{c.name}</span>
                <span className="block truncate text-[13px] text-muted">{bits || "프로필 준비 중"}</span>
              </span>
            </Link>
          );
        })}
        {!list.length && <Empty className="col-span-full">이 학부에는 아직 아무도 없어요.</Empty>}
      </div>
    </>
  );
}
