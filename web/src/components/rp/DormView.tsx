"use client";

import { Key } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { STAGES, dorm as dormOf } from "@/lib/constants";
import { fmtDur } from "@/lib/format";
import { LIVE } from "@/lib/firebase";
import { useMe, useNow, useTypingNames } from "@/lib/hooks";
import { setTyping, watchDorm } from "@/lib/live";
import { useStore } from "@/lib/store";
import { Avatar, Crest } from "../ui/identity";
import { Chip, ChipRow, Empty, Note, SectionHead } from "../ui/primitives";
import { Composer } from "./Composer";
import { Message } from "./Message";

/** 기숙사 역극방: 학부 5개 × 성장 단계별 방 1개. 해당 기숙사 소속만 작성·열람. */
export function DormView() {
  const me = useMe();
  const now = useNow();
  const stage = useStore((s) => s.data.stage);
  const chars = useStore((s) => s.data.chars);
  const dormMsgs = useStore((s) => s.data.dormMsgs);
  const dormSend = useStore((s) => s.dormSend);
  const [viewDorm, setViewDorm] = useState<string | null>(null);
  const [viewStage, setViewStage] = useState<number | null>(null);

  const visit = me?.visit && me.visit.until > now ? me.visit : null;
  const shownDorm = visit ? viewDorm : null;
  const dormKey = `${(shownDorm as string) || me?.dorm || ""}-${viewStage ?? stage}`;
  const typingNames = useTypingNames(`dorm:${dormKey}`);
  useEffect(() => {
    if (!LIVE || !me) return;
    return watchDorm(((shownDorm as string) || me.dorm) as typeof me.dorm, viewStage ?? stage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dormKey]);
  useEffect(() => {
    const el = document.scrollingElement; if (el) window.scrollTo(0, el.scrollHeight);
  }, [dormMsgs, shownDorm, viewStage]);

  if (!me) return <Note className="mt-4">캐릭터를 등록하면 기숙사에 들어갈 수 있어요. 더보기 → 캐릭터 등록.</Note>;
  const d = dormOf((shownDorm as typeof me.dorm) || me.dorm);
  const guest = d.id !== me.dorm;
  const st = viewStage ?? stage;
  const live = st === stage;
  const msgs = dormMsgs[`${d.id}-${st}`] ?? [];
  const members = chars.filter((c) => c.dorm === d.id);

  return (
    <>
      {visit && (
        <ChipRow role="group" aria-label="기숙사 선택" className="pt-2">
          <Chip on={!guest} onClick={() => setViewDorm(null)}>내 기숙사</Chip>
          <Chip on={guest} onClick={() => setViewDorm(visit.dorm)}><Key size={14} /> {dormOf(visit.dorm).name} · <span className="tnum">{fmtDur(visit.until - now)}</span></Chip>
        </ChipRow>
      )}
      <div className="card relative mt-2 overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full blur-3xl" style={{ background: d.id === "fifth" ? "var(--glow)" : `color-mix(in srgb, var(--${d.id}) 26%, transparent)` }} aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <Crest id={d.id} size={56} />
          <div className="min-w-0">
            <span className="eyebrow">{d.sub} · {d.colorName}</span>
            <h1 className="text-[24px] leading-tight">{d.name} 기숙사 {d.lat && <span className="lat text-[17px] font-medium text-muted">{d.lat}</span>}</h1>
            <p className="mt-1 text-[13.5px] text-muted">“{d.motto}”</p>
          </div>
        </div>
        <ChipRow className="relative mt-4">
          {members.map((c) => (
            <Link key={c.id} href={`/profile/${c.id}`} className="inline-flex min-h-[34px] shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface py-0.5 pl-1 pr-3.5 text-[13px] hover:border-line-strong">
              <Avatar c={c} stage={stage} size="xs" />{c.name}
            </Link>
          ))}
        </ChipRow>
      </div>
      {stage > 0 && (
        <ChipRow role="group" aria-label="성장 단계별 기숙사 역극" className="mt-3">
          {STAGES.slice(0, stage + 1).map((x, i) => <Chip key={x} on={st === i} onClick={() => setViewStage(i)}>{x}{i === stage ? " · 진행 중" : " · 기록"}</Chip>)}
        </ChipRow>
      )}
      <SectionHead title="기숙사 역극" aside={`${STAGES[st]} · ${msgs.length}개 · ${guest ? "만능열쇠로 몰래 들어왔어요" : "학부원만 쓸 수 있어요"}`} className="mt-7" />
      <div className="card flex flex-col gap-6 px-5 py-5">
        {msgs.map((m) => <Message key={m.id} m={m} now={now} tint="dorm" />)}
        {!msgs.length && <Empty>첫 문장을 써 주세요.</Empty>}
      </div>
      {live ? (
        <Composer placeholder={`${me.name} · 대사 (지문)`} onSend={(t, img) => dormSend(d.id, t, img)} offsetForTabBar typingNames={typingNames} onTyping={() => { if (LIVE) setTyping(`dorm:${dormKey}`, me.id); }} />
      ) : (
        <Note>{STAGES[st]} 기숙사 역극은 끝난 기록이에요. 읽기만 할 수 있어요.</Note>
      )}
    </>
  );
}
