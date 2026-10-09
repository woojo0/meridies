"use client";

import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ago, cx } from "@/lib/format";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { Post } from "@/lib/types";
import { Avatar, DormTag } from "../ui/identity";
import { ImageGrid, SheetActions, SheetTitle } from "../ui/overlays";
import { Button, RpText, Textarea } from "../ui/primitives";
import { TalkSheet } from "./TalkSheet";

/** 글 카드: 두상, 캐릭터명, 학부 색 점, 성별·키, 작성 시간, 본문, 이미지. 말풍선(열린 역극 수) · 마음. */
export function PostCard({ p, now }: { p: Post; now: number }) {
  const c = useStore((s) => s.data.chars.find((x) => x.id === p.charId));
  const meId = useStore((s) => s.session.charId);
  const rooms = useStore((s) => s.data.rooms);
  const toggleLike = useStore((s) => s.toggleLike);
  const openSheet = useOverlay((s) => s.openSheet);
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  if (!c || !meId) return null;

  const mine = p.charId === meId;
  const myRoom = rooms.find((r) => r.source.postId === p.id && r.members.includes(meId));
  const cnt = rooms.filter((r) => r.source.postId === p.id).length;
  const liked = p.likes.includes(meId);
  const actCls = "inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] leading-none transition-colors tnum";

  return (
    <article className="card px-5 py-4">
      <div className="flex items-center gap-3.5">
        <Link href={`/profile/${c.id}`} aria-label={`${c.name} 프로필`} className="shrink-0"><Avatar c={c} stage={p.stage} /></Link>
        <div className="min-w-0 flex-1">
          <Link href={`/profile/${c.id}`} className="block truncate text-[15px] font-semibold leading-tight underline-offset-[3px] hover:underline">{c.name}</Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <DormTag c={c} stage={p.stage} />
            <span>·</span>
            <span>{ago(p.at, now)}{p.edited ? " · 수정됨" : ""}</span>
          </div>
        </div>
        {mine && (
          <span className="relative -mr-1.5 self-start">
            <button aria-label="글 메뉴" onClick={() => setMenu((m) => !m)} className="grid size-8 place-items-center rounded-full text-muted hover:bg-sunk hover:text-ink"><MoreHorizontal size={18} /></button>
            {menu && (
              <span className="card-flat absolute right-0 top-9 z-10 flex min-w-[120px] flex-col overflow-hidden p-1 shadow-float">
                <button className="rounded-lg px-3 py-2 text-left text-sm hover:bg-sunk" onClick={() => { setMenu(false); openSheet(<EditPostSheet p={p} />); }}>수정</button>
                <button className="rounded-lg px-3 py-2 text-left text-sm text-crit hover:bg-sunk" onClick={() => { setMenu(false); openSheet(<DeletePostSheet p={p} />); }}>삭제</button>
              </span>
            )}
          </span>
        )}
      </div>
      <div className="mt-3.5 text-[15px]"><RpText text={p.text} /></div>
      <ImageGrid srcs={p.images} className="mt-3" />
      <div className="-mb-1 -ml-2.5 mt-3 flex flex-wrap items-center gap-0.5">
        {mine ? (
          <span className={cx(actCls, "text-muted")} aria-label={`이 글에서 시작된 역극 ${cnt}개`}><MessageCircle size={18} strokeWidth={1.6} />{cnt || ""}</span>
        ) : myRoom ? (
          <button onClick={() => router.push(`/room/${myRoom.id}`)} aria-label="역극방 열기" className={cx(actCls, "bg-gold-soft text-gold")}>
            <MessageCircle size={18} strokeWidth={1.8} className="fill-gold/25" />{cnt || ""} <span className="text-[12px]">이어가기</span>
          </button>
        ) : (
          <button onClick={() => openSheet(<TalkSheet postId={p.id} />)} aria-label="말 걸기" className={cx(actCls, "text-ink hover:bg-sunk")}>
            <MessageCircle size={18} strokeWidth={1.6} />{cnt || ""}
          </button>
        )}
        <button onClick={() => toggleLike(p.id)} aria-pressed={liked} aria-label="마음" className={cx(actCls, liked ? "text-gold" : "text-muted hover:bg-sunk hover:text-ink")}>
          <Heart size={18} strokeWidth={1.6} className={cx(liked && "fill-current")} />{p.likes.length || ""}
        </button>
      </div>
    </article>
  );
}

function EditPostSheet({ p }: { p: Post }) {
  const editPost = useStore((s) => s.editPost);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [text, setText] = useState(p.text);
  return (
    <>
      <SheetTitle>글 수정</SheetTitle>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="글 내용" />
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button onClick={() => { if (!text.trim() && !p.images.length) { toast("내용을 써 주세요."); return; } editPost(p.id, text.trim()); closeSheet(); toast("글을 수정했어요."); }}>저장</Button>
      </SheetActions>
    </>
  );
}

function DeletePostSheet({ p }: { p: Post }) {
  const deletePost = useStore((s) => s.deletePost);
  const rooms = useStore((s) => s.data.rooms.filter((r) => r.source.postId === p.id).length);
  const closeSheet = useOverlay((s) => s.closeSheet);
  return (
    <>
      <SheetTitle sub={rooms ? `이 글에서 시작된 역극 ${rooms}개의 첫 메시지는 그대로 남아요.` : undefined}>글을 삭제할까요?</SheetTitle>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button variant="ink" onClick={() => { deletePost(p.id); closeSheet(); toast("글을 삭제했어요."); }}>삭제</Button>
      </SheetActions>
    </>
  );
}
