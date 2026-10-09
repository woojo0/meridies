"use client";

import { Send } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ago, cx } from "@/lib/format";
import { useMe, useNow } from "@/lib/hooks";
import { toast } from "@/lib/overlay";
import { useStore, type ChatMsg } from "@/lib/store";
import { Avatar } from "../ui/identity";
import { Empty } from "../ui/primitives";

/** 운영자 문의함. 멤버: 내 대화 하나. 운영자: 캐릭터별 대화 목록 + 대화창. */
export function InboxView() {
  const me = useMe();
  const admin = useStore((s) => s.session.admin);
  const sp = useSearchParams();
  const router = useRouter();
  const chars = useStore((s) => s.data.chars);
  const threads = useStore((s) => s.adminChats);
  const openChat = useStore((s) => s.openChat);
  const closeChat = useStore((s) => s.closeChat);

  const selected = admin ? sp.get("c") : me?.id ?? null;
  const [q, setQ] = useState("");
  const norm = (t: string) => t.replace(/\s+/g, "").toLowerCase();
  const found = q.trim() ? chars.filter((c) => norm(c.name).includes(norm(q))) : [];

  useEffect(() => { if (!selected) return; openChat(selected); return () => closeChat(selected); }, [selected, openChat, closeChat]);

  if (!admin && !me) return <Empty className="py-16">캐릭터를 등록하면 운영자에게 문의할 수 있어요.</Empty>;

  const list = admin
    ? Object.values(threads).map((t) => ({ t, c: chars.find((x) => x.id === t.charId) })).filter((x) => x.c).sort((a, b) => (b.t.lastAt ?? 0) - (a.t.lastAt ?? 0))
    : [];

  return (
    <div className={cx("mt-2", admin && "lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5")}>
      {admin && (
        <aside className="card-flat mb-3 flex max-h-[70vh] flex-col self-start lg:mb-0 lg:h-[70vh] lg:min-h-[480px]">
          <div className="border-b border-line px-4 py-3 text-[13px] font-semibold text-muted">대화 {list.length}</div>
          <div className="min-h-0 flex-1 overflow-y-auto">
          {list.map(({ t, c }) => (
            <button key={t.charId} onClick={() => router.replace(`/inbox?c=${t.charId}`)} className={cx("flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-sunk/60", selected === t.charId && "bg-sunk/70")}>
              <Avatar c={c!} stage={0} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{c!.name}</span>{t.unreadAdmin > 0 && <span className="rounded-full bg-crit px-1.5 text-[10.5px] font-bold leading-4 text-white">{t.unreadAdmin}</span>}</span>
                <span className="block truncate text-xs text-muted">{t.lastText || "대화 시작 전"}</span>
              </span>
            </button>
          ))}
          {!list.length && <Empty>아직 문의가 없어요.</Empty>}
          </div>
          <div className="border-t border-line px-4 py-3">
            <span className="mb-1.5 block text-[12px] text-muted">새 대화 시작 · 캐릭터 이름 검색</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && found[0]) { router.replace(`/inbox?c=${found[0].id}`); setQ(""); } }}
              aria-label="캐릭터 이름 검색"
              className="field-input min-h-10 text-[14px]"
            />
            {q.trim() && (
              <div className="mt-1.5 flex flex-col">
                {found.slice(0, 8).map((c) => (
                  <button key={c.id} onClick={() => { router.replace(`/inbox?c=${c.id}`); setQ(""); }} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13.5px] hover:bg-sunk">
                    <Avatar c={c} stage={0} size="xs" /><span className="truncate">{c.name}</span>{threads[c.id] && <span className="ml-auto text-[11px] text-muted">대화 있음</span>}
                  </button>
                ))}
                {!found.length && <span className="px-2 py-1.5 text-[12.5px] text-muted">맞는 캐릭터가 없어요.</span>}
              </div>
            )}
          </div>
        </aside>
      )}
      <div className="min-w-0">
        {selected ? <Chat charId={selected} isAdmin={admin} /> : <Empty className="py-16">왼쪽에서 대화를 고르세요.</Empty>}
      </div>
    </div>
  );
}

function Chat({ charId, isAdmin }: { charId: string; isAdmin: boolean }) {
  const now = useNow();
  const c = useStore((s) => s.data.chars.find((x) => x.id === charId));
  const stage = useStore((s) => s.data.stage);
  const thread = useStore((s) => s.adminChats[charId]);
  const msgs = useMemo(() => thread?.messages ?? [], [thread]);
  const sendChat = useStore((s) => s.sendChat);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  const send = async () => {
    const t = text.trim(); if (!t) return;
    setBusy(true);
    try { await sendChat(charId, t); setText(""); } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="card flex h-[70vh] min-h-[480px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        {c && <Avatar c={c} stage={stage} size="sm" />}
        <div className="min-w-0 flex-1">
          <span className="block truncate font-display text-[15px] font-semibold">{isAdmin ? c?.name ?? "캐릭터" : "운영자"}</span>
          <span className="block text-xs text-muted">{isAdmin ? "운영자로서 답장해요" : "운영자에게 직접 묻고 답을 받아요. 운영진만 볼 수 있어요."}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!msgs.length && <Empty>아직 메시지가 없어요. 첫 메시지를 보내 보세요.</Empty>}
        <div className="flex flex-col gap-2.5">
          {msgs.map((m) => <Bubble key={m.id} m={m} mine={isAdmin ? m.from === "admin" : m.from !== "admin"} now={now} />)}
        </div>
        <div ref={endRef} />
      </div>
      <div className="flex items-end gap-1.5 border-t border-line p-2 pl-3">
        <textarea
          rows={1}
          value={text}
          maxLength={1000}
          onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
          aria-label="메시지 입력"
          className="min-h-11 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-normal focus:outline-none"
        />
        <button onClick={send} disabled={busy || !text.trim()} aria-label="보내기" className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-[#fff8ea] transition disabled:opacity-40">
          <Send size={19} strokeWidth={1.9} className="-translate-x-px translate-y-px" />
        </button>
      </div>
    </div>
  );
}

function Bubble({ m, mine, now }: { m: ChatMsg; mine: boolean; now: number }) {
  return (
    <div className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
      <div className={cx("max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed", mine ? "rounded-br-md bg-gold text-[#fff8ea]" : "rounded-bl-md bg-sunk")}>{m.text}</div>
      <span className="mt-1 px-1 text-[11px] text-muted">{m.from === "admin" ? "운영자 · " : ""}{ago(m.at, now)}</span>
    </div>
  );
}
