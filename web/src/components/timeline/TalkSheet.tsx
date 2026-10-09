"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMe } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Field, RpText, Textarea } from "../ui/primitives";

/** 말 걸기: 상대의 글이 역극방의 첫 메시지가 되고, 첫 답을 보내야 방이 생겨요. */
export function TalkSheet({ postId }: { postId: string }) {
  const me = useMe();
  const p = useStore((s) => s.data.posts.find((x) => x.id === postId));
  const c = useStore((s) => s.data.chars.find((x) => x.id === p?.charId));
  const talk = useStore((s) => s.talk);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const router = useRouter();
  const [text, setText] = useState("");
  if (!me || !p || !c) return null;
  return (
    <>
      <SheetTitle sub="이 글이 역극방의 첫 메시지가 돼요. 첫 답을 보내면 방이 만들어지고, 두 캐릭터의 역극 목록에 추가돼요.">{c.name}에게 말 걸기</SheetTitle>
      <div className="mb-3.5 rounded-r border-l-2 border-gold bg-sunk/60 px-3 py-2 text-sm">
        <b>{c.name}</b><br /><RpText text={p.text} />
      </div>
      <Field label={`${me.name}의 첫 역극`} htmlFor="talk-in" hint={`${text.length} / 2000`}>
        <Textarea id="talk-in" autoFocus maxLength={2000} className="min-h-[160px]" value={text} onChange={(e) => setText(e.target.value)} />
      </Field>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button onClick={async () => { const t = text.trim(); if (!t) { toast("첫 역극을 써 주세요."); return; } try { const id = await talk(p.id, t); closeSheet(); router.push(`/room/${id}`); } catch (e) { toast((e as Error).message); } }}>역극 시작</Button>
      </SheetActions>
    </>
  );
}
