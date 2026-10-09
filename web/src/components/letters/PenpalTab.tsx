"use client";

import { Stamp } from "lucide-react";
import { ago } from "@/lib/format";
import { useMe, useNow } from "@/lib/hooks";
import { aliasOf } from "@/lib/letters";
import { useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { Thread } from "@/lib/types";
import { Button, Empty } from "../ui/primitives";
import { NeedItemSheet } from "../shop/ItemSheet";
import { LetterView, LetterWrite } from "./LetterSheet";

/** 우편함: 봉투 카드 + 밀랍 스탬프. 안 읽은 편지는 봉인된 상태. */
export function PenpalTab() {
  const me = useMe();
  const now = useNow();
  const stage = useStore((s) => s.data.stage);
  const threads = useStore((s) => s.data.threads);
  const chars = useStore((s) => s.data.chars);
  const { openSheet, closeDrawer } = useOverlay();
  if (!me) return null;
  const c = me.id;
  const nameOf = (id: string) => chars.find((x) => x.id === id)?.name ?? "";
  const mine = threads.filter((t) => t.a === c || t.b === c);

  const openThread = (t: Thread) => {
    const vis = t.letters.filter((l) => l.from === c || l.deliverAt <= now);
    const fu = vis.findIndex((l) => l.from !== c && !l.read);
    closeDrawer();
    openSheet(<LetterView threadId={t.id} index={fu >= 0 ? fu : vis.length - 1} />, "letter");
  };

  return (
    <>
      <p className="mb-3 text-[13px] text-muted">
        {stage >= 2 ? "졸업과 함께 편지인들의 정체가 공개되었어요." : "보낸 사람도 받는 사람도 서로를 몰라요. 정체는 졸업(2차 성장) 때 공개돼요. 펜팔은 프로필에 나오지 않아요."}
      </p>
      <div className="flex flex-col gap-2.5">
        {mine.map((t) => {
          const other = t.a === c ? t.b : t.a;
          const vis = t.letters.filter((l) => l.from === c || l.deliverAt <= now);
          const last = vis.at(-1);
          if (!last) return null;
          const unread = t.letters.some((l) => l.from !== c && !l.read && l.deliverAt <= now);
          const flying = t.letters.some((l) => l.from === c && l.deliverAt > now);
          return (
            <button
              key={t.id}
              onClick={() => openThread(t)}
              className="envelope relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 overflow-hidden rounded-[6px] bg-paper px-4 pt-4 pb-3.5 text-left text-paper-ink shadow-[0_1px_0_var(--paper-line),0_3px_10px_#0001] transition hover:-translate-y-px"
            >
              <span className="relative font-hand text-2xl leading-tight">{aliasOf(t, other, stage, nameOf)}</span>
              <span
                aria-hidden="true"
                className={`relative row-span-2 grid size-[34px] place-items-center rounded-full font-latin text-base font-semibold italic ${unread ? "bg-seal text-[#F3D9DD] shadow-[inset_0_0_0_3px_#0002]" : "text-paper-ink/70 shadow-[inset_0_0_0_1.5px_var(--paper-line)]"}`}
              >
                {unread ? "M" : ""}
              </span>
              <span className="relative text-xs opacity-75">
                {unread ? "봉인된 편지가 있어요" : flying ? "답장이 배달 중이에요" : `편지 ${vis.length}통`} · {ago(last.from === c ? last.sentAt : last.deliverAt, now)}
              </span>
              {flying && <span className="absolute right-14 top-2 rounded-[3px] border border-dashed border-current px-1.5 text-[10.5px] opacity-60">배달 중</span>}
            </button>
          );
        })}
        {!mine.length && <Empty>아직 주고받은 편지가 없어요.</Empty>}
      </div>
      <Button
        block
        className="mt-3.5"
        onClick={() => {
          if (!(me.inv.stamp > 0)) { openSheet(<NeedItemSheet id="stamp" />); return; }
          closeDrawer();
          openSheet(<LetterWrite />, "letter");
        }}
      >
        <Stamp size={18} strokeWidth={1.6} /> 새 편지 띄우기 · 우표 {me.inv.stamp || 0}장
      </Button>
      <p className="mt-2 text-center text-[12.5px] text-muted">답장에는 마법 비둘기가 필요해요 · 보유 {me.inv.pigeon || 0}마리</p>
    </>
  );
}
