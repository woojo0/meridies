"use client";

import { ChevronLeft, ChevronRight, Mail, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fmtDur } from "@/lib/format";
import { useMe, useTick } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { aliasOf } from "@/lib/letters";
import { NeedItemSheet } from "../shop/ItemSheet";
import { IconButton } from "../ui/primitives";

function LetterTop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 pt-[calc(8px+env(safe-area-inset-top,0px))] pb-2 text-[#E9DFC4]">
      <IconButton label="닫기" onClick={onClose} className="text-inherit hover:bg-white/10"><X size={22} strokeWidth={1.6} /></IconButton>
      <span className="min-w-0 flex-1 truncate text-center text-[13px] opacity-80">{children}</span>
    </div>
  );
}

function LetterBottom({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2 px-3 pt-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))] [&>button]:flex-1">{children}</div>;
}

const btnPrimary = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-r bg-[#E9DFC4] px-4 font-semibold text-[#2a2114]";
const btnGhost = "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-r border border-[#E9DFC455] px-4 font-semibold text-[#E9DFC4]";

/** 편지 한 장. 말풍선 없이 한 화면에 한 통, 좌우 스와이프로 이전/다음. */
export function LetterView({ threadId, index }: { threadId: string; index: number }) {
  const me = useMe();
  const now = useTick();
  const stage = useStore((s) => s.data.stage);
  const t = useStore((s) => s.data.threads.find((x) => x.id === threadId));
  const chars = useStore((s) => s.data.chars);
  const markRead = useStore((s) => s.markLetterRead);
  const { openSheet, closeSheet, openDrawer } = useOverlay();
  const [i, setI] = useState(index);
  const x0 = useRef<number | null>(null);

  const c = me?.id ?? "";
  const vis = t ? t.letters.map((l, idx) => ({ l, idx })).filter(({ l }) => l.from === c || l.deliverAt <= now) : [];
  const cur = vis[Math.max(0, Math.min(i, vis.length - 1))];

  useEffect(() => { if (cur && cur.l.from !== c && !cur.l.read) markRead(threadId, cur.idx); }, [cur, c, markRead, threadId]);

  if (!t || !me || !cur) return null;
  const nameOf = (id: string) => chars.find((x) => x.id === id)?.name ?? "";
  const other = t.a === c ? t.b : t.a;
  const l = cur.l;
  const mine = l.from === c;
  const dt = new Date(mine ? l.sentAt : l.deliverAt);
  const back = () => { closeSheet(); openDrawer("pen"); };

  return (
    <>
      <LetterTop onClose={back}>{aliasOf(t, other, stage, nameOf)}와(과)의 편지 · {i + 1}/{vis.length}</LetterTop>
      <div className="flex items-center justify-end gap-1 px-3 text-[#E9DFC4]">
        <IconButton label="이전 편지" disabled={i === 0} onClick={() => setI((v) => v - 1)} className="text-inherit hover:bg-white/10"><ChevronLeft size={22} /></IconButton>
        <IconButton label="다음 편지" disabled={i >= vis.length - 1} onClick={() => setI((v) => v + 1)} className="text-inherit hover:bg-white/10"><ChevronRight size={22} /></IconButton>
      </div>
      <div
        key={i}
        className="paper anim-unfold mx-3 min-h-0 flex-1 overflow-y-auto rounded-[4px] px-6 pt-7 pb-8"
        onTouchStart={(e) => { x0.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (x0.current == null) return;
          const dx = e.changedTouches[0].clientX - x0.current; x0.current = null;
          if (Math.abs(dx) > 60) { const ni = i + (dx < 0 ? 1 : -1); if (ni >= 0 && ni < vis.length) setI(ni); }
        }}
      >
        <span className="block text-right text-lg opacity-70">{dt.getMonth() + 1}월 {dt.getDate()}일</span>
        <span className="block">{mine ? `${aliasOf(t, other, stage, nameOf)}에게` : "이름 모를 친구에게"},</span>
        <div className="whitespace-pre-wrap break-words">{l.text}</div>
        <span className="mt-[34px] block text-right">{mine ? "— 내가 보낸 편지" : `— ${aliasOf(t, l.from, stage, nameOf)}`}</span>
        {mine && l.deliverAt > now && <div className="py-5 text-center font-body text-[13px] leading-normal opacity-70">이 편지는 아직 배달 중이에요. {fmtDur(l.deliverAt - now)} 뒤 도착.</div>}
      </div>
      <LetterBottom>
        <button className={btnGhost} onClick={back}>편지함으로</button>
        <button
          className={btnPrimary}
          onClick={() => {
            if (!(me.inv.pigeon > 0)) { openSheet(<NeedItemSheet id="pigeon" />); return; }
            openSheet(<LetterWrite threadId={threadId} />, "letter");
          }}
        >
          답장 쓰기
        </button>
      </LetterBottom>
    </>
  );
}

/** 편지 쓰기. 편지지 모양, 끝에 '봉투에 넣기'. */
export function LetterWrite({ threadId }: { threadId?: string }) {
  const me = useMe();
  const stage = useStore((s) => s.data.stage);
  const t = useStore((s) => s.data.threads.find((x) => x.id === threadId));
  const chars = useStore((s) => s.data.chars);
  const letterNew = useStore((s) => s.letterNew);
  const letterReply = useStore((s) => s.letterReply);
  const { closeSheet, openDrawer } = useOverlay();
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const id = setTimeout(() => ref.current?.focus(), 80); return () => clearTimeout(id); }, []);
  if (!me) return null;
  const nameOf = (id: string) => chars.find((x) => x.id === id)?.name ?? "";
  const other = t ? (t.a === me.id ? t.b : t.a) : null;
  const to = t && other ? aliasOf(t, other, stage, nameOf) : null;
  const back = () => { closeSheet(); openDrawer("pen"); };

  const send = async () => {
    const txt = text.trim();
    if (!txt) { toast("편지를 써 주세요."); return; }
    try {
    if (t) {
      const r = await letterReply(t.id, txt);
      if (r === "no-pigeon") { toast("마법 비둘기가 필요해요."); return; }
      closeSheet(); openDrawer("pen"); toast("비둘기가 답장을 물고 날아갔어요. 1시간 뒤에 도착해요.");
    } else {
      const r = await letterNew(txt);
      if (r === "no-stamp") { toast("마법 우표가 필요해요."); return; }
      if (r === "lost") { closeSheet(); openDrawer("noti"); toast("편지가 선생님 책상 위로 가 버렸어요."); return; }
      closeSheet(); openDrawer("pen"); toast("우표를 붙여 편지를 띄웠어요. 1시간 뒤에 도착해요.");
    }
    } catch (e) { toast((e as Error).message); }
  };

  return (
    <>
      <LetterTop onClose={back}>{to ? `${to}에게 답장 · 마법 비둘기 1마리` : "새 편지 · 마법 우표 1장 · 받는 사람은 무작위"}</LetterTop>
      <div className="paper mx-3 min-h-0 flex-1 overflow-y-auto rounded-[4px] px-6 pt-7 pb-8">
        <span className="block">{to ? `${to}에게,` : "이름 모를 친구에게,"}</span>
        <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} aria-label="편지 내용" placeholder="여기에 써 주세요…" />
      </div>
      <LetterBottom>
        <button className={btnGhost} onClick={back}>그만 쓰기</button>
        <button className={btnPrimary} onClick={send}><Mail size={18} strokeWidth={1.6} /> 봉투에 넣기</button>
      </LetterBottom>
    </>
  );
}
