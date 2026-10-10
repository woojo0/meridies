"use client";

import { Eye, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ago, cx } from "@/lib/format";
import { useMe, useNow } from "@/lib/hooks";
import { toast } from "@/lib/overlay";
import { dmKey, useStore, type ChatMsg } from "@/lib/store";
import { Avatar } from "../ui/identity";
import { Empty, Note } from "../ui/primitives";

export const DM_NOTICE = "오너 간 DM은 운영진이 열람할 수 있어요. 커뮤 운영과 분쟁 조정을 위한 조치예요.";

/** 오너 DM 목록. 멤버: 내 대화. 운영자: 모든 대화(열람). */
export function DmListView() {
  const me = useMe();
  const admin = useStore((s) => s.session.admin);
  const chars = useStore((s) => s.data.chars);
  const dms = useStore((s) => s.dms);
  const now = useNow();
  const list = Object.values(dms).filter((t) => admin || (me && t.chars.includes(me.id))).sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0));
  const nameOf = (id: string) => chars.find((c) => c.id === id)?.name ?? "(삭제된 캐릭터)";
  const nickOf = (id: string) => chars.find((c) => c.id === id)?.ownerNick ?? "";
  if (!admin && !me) return <Empty className="py-16">캐릭터를 등록하면 다른 오너와 DM을 주고받을 수 있어요.</Empty>;
  return (
    <>
      <Note className="mt-2">{admin ? "운영자 열람 모드예요. 모든 오너 DM을 읽을 수 있고, 보낼 수는 없어요." : `${DM_NOTICE} 상대 오너와 처음 DM을 시작하려면 그 캐릭터 프로필에서 오너 닉네임을 누르세요.`}</Note>
      <div className="card-flat mt-3">
        {list.map((t) => {
          const other = me && !admin ? t.chars.find((id) => id !== me.id) ?? t.chars[0] : null;
          const oc = other ? chars.find((c) => c.id === other) : null;
          const unread = me ? t.unread?.[me.id] ?? 0 : 0;
          return (
            <Link key={t.key} href={`/dm/${t.key}`} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-sunk/60">
              {oc ? <Avatar c={oc} stage={0} size="sm" /> : <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-sunk text-muted"><Eye size={14} /></span>}
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{admin ? t.chars.map((id) => `${nameOf(id)}${nickOf(id) ? ` (${nickOf(id)})` : ""}`).join(" ↔ ") : `${nameOf(other!)} 오너${nickOf(other!) ? ` · ${nickOf(other!)}` : ""}`}</span>
                  {unread > 0 && <span className="rounded-full bg-crit px-1.5 text-[10.5px] font-bold leading-4 text-white">{unread}</span>}
                </span>
                <span className="block truncate text-xs text-muted">{t.lastText || "대화 시작 전"}{t.lastAt ? ` · ${ago(t.lastAt, now)}` : ""}</span>
              </span>
            </Link>
          );
        })}
        {!list.length && <Empty>{admin ? "아직 오너 DM이 없어요." : "아직 주고받은 DM이 없어요."}</Empty>}
      </div>
    </>
  );
}

/** 오너 DM 대화: /dm/[key]. key = 두 캐릭터 id를 정렬해 __로 이은 값 */
export function DmView() {
  const { key } = useParams<{ key: string }>();
  const me = useMe();
  const admin = useStore((s) => s.session.admin);
  const chars = useStore((s) => s.data.chars);
  const now = useNow();
  const stage = useStore((s) => s.data.stage);
  const thread = useStore((s) => s.dms[key]);
  const openDm = useStore((s) => s.openDm);
  const closeDm = useStore((s) => s.closeDm);
  const sendDm = useStore((s) => s.sendDm);
  const msgs = useMemo(() => thread?.messages ?? [], [thread]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const ids = key.split("__");
  const valid = ids.length === 2 && ids[0] !== ids[1];
  const mine = !!me && ids.includes(me.id);
  const canRead = valid && (admin || mine);
  const other = mine ? ids.find((id) => id !== me!.id)! : null;
  const oc = other ? chars.find((c) => c.id === other) : null;

  useEffect(() => { if (!canRead) return; openDm(key); return () => closeDm(key); }, [key, canRead, openDm, closeDm]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  if (!canRead) return <Empty className="py-16">볼 수 없는 대화예요.</Empty>;

  const send = async () => {
    const t = text.trim(); if (!t || !other) return;
    setBusy(true);
    try { await sendDm(other, t); setText(""); } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };
  const nameOf = (id: string) => chars.find((c) => c.id === id)?.name ?? "(삭제된 캐릭터)";
  const nickOf = (id: string) => chars.find((c) => c.id === id)?.ownerNick ?? "";
  const title = mine && oc ? `${oc.name} 오너${oc.ownerNick ? ` · ${oc.ownerNick}` : ""}` : ids.map((id) => `${nameOf(id)}${nickOf(id) ? ` (${nickOf(id)})` : ""}`).join(" ↔ ");

  return (
    <div className="card mt-2 flex h-[70vh] min-h-[480px] flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        {oc ? <Avatar c={oc} stage={stage} size="sm" /> : <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-sunk text-muted"><Eye size={14} /></span>}
        <div className="min-w-0 flex-1">
          <span className="block truncate font-display text-[15px] font-semibold">{title}</span>
          <span className="block text-xs text-muted">{mine ? DM_NOTICE : "운영자 열람 모드 · 보낼 수는 없어요"}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!msgs.length && <Empty>아직 메시지가 없어요.{mine && " 첫 메시지를 보내 보세요."}</Empty>}
        <div className="flex flex-col gap-2.5">
          {msgs.map((m) => <Bubble key={m.id} m={m} mine={!!me && m.from === me.id} label={!mine || m.from !== me?.id ? `${nameOf(m.from)} 오너` : ""} now={now} />)}
        </div>
        <div ref={endRef} />
      </div>
      {mine ? (
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
          <button onClick={send} disabled={busy || !text.trim()} aria-label="보내기" className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-gold-ink transition disabled:opacity-40">
            <Send size={19} strokeWidth={1.9} className="-translate-x-px translate-y-px" />
          </button>
        </div>
      ) : (
        <div className="border-t border-line px-4 py-3 text-center text-[12.5px] text-muted">운영자는 읽기만 할 수 있어요.</div>
      )}
    </div>
  );
}

function Bubble({ m, mine, label, now }: { m: ChatMsg; mine: boolean; label: string; now: number }) {
  return (
    <div className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
      <div className={cx("max-w-[78%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed", mine ? "rounded-br-md bg-gold text-gold-ink" : "rounded-bl-md bg-sunk")}>{m.text}</div>
      <span className="mt-1 px-1 text-[11px] text-muted">{label ? `${label} · ` : ""}{ago(m.at, now)}</span>
    </div>
  );
}

export { dmKey };
