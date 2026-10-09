"use client";

import { useEffect, useState } from "react";
import { ago } from "@/lib/format";
import { LIVE } from "@/lib/firebase";
import { useMe, useNow, useTypingNames } from "@/lib/hooks";
import { setTyping, watchRoom } from "@/lib/live";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { Msg } from "@/lib/types";
import { Avatar } from "../ui/identity";
import { ImageGrid, SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Empty, Pill, RpText, Textarea } from "../ui/primitives";
import { Composer, ReadOnlyBar } from "./Composer";
import { Message } from "./Message";

/** 1:1 역극방. 첫 메시지는 타임라인 원문 인용. 두 캐릭터만 쓰고, 멤버 전체가 읽을 수 있어요. */
export function RoomView({ id }: { id: string }) {
  const me = useMe();
  const now = useNow();
  const r = useStore((s) => s.data.rooms.find((x) => x.id === id));
  const chars = useStore((s) => s.data.chars);
  const stage = useStore((s) => s.data.stage);
  const { rpSend, rpDone, rpReopen, markRoomRead } = useStore();
  const openSheet = useOverlay((s) => s.openSheet);

  const msgCount = r?.messages.length ?? 0;
  const roomId = r?.id;
  const meId = me?.id;
  const typingNames = useTypingNames(`room:${id}`);
  useEffect(() => {
    if (!LIVE) return;
    return watchRoom(id);
  }, [id]);
  // 방에 들어오거나 새 메시지가 오면 읽음 처리. (r 자체를 의존성에 넣으면 읽음 갱신이 다시 효과를 부르니 id만.)
  useEffect(() => { if (roomId && meId) markRoomRead(roomId); }, [roomId, meId, msgCount, markRoomRead]);
  useEffect(() => { const el = document.scrollingElement; if (el) window.scrollTo(0, el.scrollHeight); }, [msgCount]);

  if (!me) return null;
  if (!r) return <Empty>역극방을 찾을 수 없어요.</Empty>;
  const [a, b] = r.members.map((m) => chars.find((c) => c.id === m)!);
  const src = chars.find((c) => c.id === r.source.charId)!;
  const member = r.members.includes(me.id);

  return (
    <>
      <div className="card mt-2 flex items-center gap-3 px-4 py-3">
        <div className="flex -space-x-2.5"><Avatar c={a} stage={stage} size="sm" className="ring-2 ring-surface" /><Avatar c={b} stage={stage} size="sm" className="ring-2 ring-surface" /></div>
        <div className="min-w-0 flex-1">
          <b className="block truncate font-display text-[16px] font-semibold">{a.name} <span className="lat text-muted">&</span> {b.name}</b>
          <div className="text-xs text-muted">{r.status === "done" ? <Pill>완료</Pill> : <Pill tone="gold">진행 중</Pill>} <span className="ml-1">메시지 {r.messages.length + 1}</span></div>
        </div>
        {member && r.status !== "done" && <Button variant="ghost" size="sm" onClick={() => { rpDone(r.id); toast("완료된 역극으로 옮겼어요."); }}>완료</Button>}
      </div>

      <div className="mt-4 flex flex-col gap-6">
        <div className="rounded-2xl border border-gold/25 bg-gold-soft/50 p-4">
          <span className="eyebrow mb-2 block">타임라인에서 시작 · {ago(r.source.at, now)}</span>
          <div className="grid grid-cols-[36px_minmax(0,1fr)] gap-2.5">
            <Avatar c={src} stage={r.source.stage} size="sm" className="size-9" />
            <div className="min-w-0">
              <div className="mb-0.5 text-[13px] font-semibold">{src.name}</div>
              <div><RpText text={r.source.text} /></div>
              <ImageGrid srcs={r.source.images} className="mt-2" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 px-1">
          {r.messages.map((m) => <Message key={m.id} m={m} now={now} onEdit={member && r.status !== "done" ? (x) => openSheet(<EditMsgSheet roomId={r.id} m={x} />) : undefined} />)}
        </div>
      </div>

      {!member ? (
        <ReadOnlyBar>관전 중이에요. 이 역극은 두 캐릭터만 쓸 수 있어요.</ReadOnlyBar>
      ) : r.status === "done" ? (
        <ReadOnlyBar>완료된 역극이에요. <button className="underline underline-offset-2" onClick={() => rpReopen(r.id)}>다시 열기</button></ReadOnlyBar>
      ) : (
        <Composer placeholder={`${me.name} · 대사 (지문)`} onSend={(t, img) => rpSend(r.id, t, img)} typingNames={typingNames} onTyping={() => { if (LIVE) setTyping(`room:${r.id}`, me.id); }} />
      )}
    </>
  );
}

function EditMsgSheet({ roomId, m }: { roomId: string; m: Msg }) {
  const rpEdit = useStore((s) => s.rpEdit);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [text, setText] = useState(m.text);
  return (
    <>
      <SheetTitle sub="수정하면 ‘수정됨’ 표시가 붙어요.">메시지 수정</SheetTitle>
      <Textarea value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} aria-label="메시지 내용" />
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button onClick={() => { if (!text.trim() && !m.image) { toast("내용을 써 주세요."); return; } rpEdit(roomId, m.id, text.trim()); closeSheet(); }}>저장</Button>
      </SheetActions>
    </>
  );
}
