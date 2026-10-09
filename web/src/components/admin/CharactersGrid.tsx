"use client";
/* eslint-disable @next/next/no-img-element -- 사용자가 올린 두상 */

import { ExternalLink, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dorm as dormOf } from "@/lib/constants";
import { money } from "@/lib/format";
import { toast, useOverlay } from "@/lib/overlay";
import { prof, useStore } from "@/lib/store";
import type { Character } from "@/lib/types";
import { DormDot } from "../ui/identity";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Empty, Field, Input, Textarea } from "../ui/primitives";

type Menu = { x: number; y: number; c: Character } | null;

/** 운영자용 캐릭터 목록: 두상 카드. 우클릭(또는 ⋯)으로 프로필·수정·메시지·삭제. */
export function CharactersGrid() {
  const chars = useStore((s) => s.data.chars);
  const users = useStore((s) => s.users);
  const stage = useStore((s) => s.data.stage);
  const openSheet = useOverlay((s) => s.openSheet);
  const router = useRouter();
  const [menu, setMenu] = useState<Menu>(null);
  const wrapRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 밖을 누르거나 Esc를 누르면 닫혀요. (우클릭 자체로는 닫히지 않게 mousedown 기준)
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    const id = setTimeout(() => { document.addEventListener("mousedown", onDown); document.addEventListener("keydown", onKey); }, 0);
    return () => { clearTimeout(id); document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [menu]);

  const openMenu = (e: React.MouseEvent, c: Character) => {
    e.preventDefault(); e.stopPropagation();
    // 데스크톱 축소(zoom) 보정: 섹션 기준 좌표로 바꿔 absolute로 띄워요.
    const wrap = wrapRef.current; if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const scaleEl = document.querySelector<HTMLElement>(".app-scale");
    const z = scaleEl ? parseFloat(getComputedStyle(scaleEl).zoom || "1") || 1 : 1;
    const W = 200, H = 200;
    const x = Math.max(0, Math.min((e.clientX - rect.left) / z, rect.width / z - W));
    const y = Math.max(0, Math.min((e.clientY - rect.top) / z, rect.height / z - H));
    setMenu({ x, y, c });
  };

  const list = [...chars].sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return (
    <section ref={wrapRef} className="card relative mt-3 p-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-[17px]">캐릭터 관리</h3>
        <span className="text-xs text-muted">{chars.length}명 · 카드를 우클릭하면 메뉴가 열려요</span>
      </div>
      <p className="mb-4 text-[13.5px] leading-relaxed text-muted">클릭하면 프로필, 우클릭하면 수정·운영자 메시지·삭제. 삭제하면 캐릭터·성적·재화·비밀 설정이 지워지고 그 계정은 다시 등록할 수 있어요.</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7 lg:gap-4">
        {list.map((c) => {
          const p = prof(c, stage).p;
          const owner = users.find((u) => u.charId === c.id);
          const tint = c.dorm === "fifth" ? "var(--sunk)" : `color-mix(in srgb, var(--${c.dorm}) 14%, var(--sunk))`;
          return (
            <button
              key={c.id}
              onClick={() => router.push(`/profile/${c.id}`)}
              onContextMenu={(e) => openMenu(e, c)}
              className="card group overflow-hidden text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden" style={{ background: tint }}>
                {p.avatar ? (
                  <img src={p.avatar} alt="" className="size-full object-cover" />
                ) : (
                  <svg viewBox="0 0 48 64" className="size-full" aria-hidden="true">
                    <circle cx="24" cy="24" r="11" style={{ fill: "var(--av-fg)" }} />
                    <path d="M4 64c1.5-14 9-21 20-21s18.5 7 20 21z" style={{ fill: "var(--av-fg)" }} />
                  </svg>
                )}
                <span
                  role="button"
                  aria-label="메뉴"
                  onClick={(e) => openMenu(e, c)}
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-surface/90 text-muted shadow-card transition-colors hover:text-ink"
                >⋯</span>
              </div>
              <div className="px-3 pt-2.5 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-display text-[14.5px] font-semibold">{c.name}</span>
                  <DormDot id={c.dorm} className="size-2" />
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-muted">{dormOf(c.dorm).name} · {money(c.money)}</div>
                <div className="truncate text-[11px] text-muted/80">{owner?.email ?? "계정 없음"}</div>
              </div>
            </button>
          );
        })}
        {!list.length && <Empty className="col-span-full">아직 캐릭터가 없어요.</Empty>}
      </div>

      {menu && (
        <div
          ref={menuRef}
          role="menu"
          className="anim-up absolute z-[70] w-[200px] rounded-2xl border border-line bg-surface p-1.5 shadow-float"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="truncate px-3 py-1.5 text-xs text-muted">{menu.c.name}</div>
          {[
            { l: "프로필 보기", i: <ExternalLink size={15} />, f: () => router.push(`/profile/${menu.c.id}`) },
            { l: "프로필 수정", i: <Pencil size={15} />, f: () => router.push(`/profile/${menu.c.id}/edit`) },
            { l: "운영자 메시지 보내기", i: <MessageSquare size={15} />, f: () => openSheet(<AdminMessageSheet c={menu.c} />) },
          ].map((m) => (
            <button key={m.l} role="menuitem" onClick={() => { setMenu(null); m.f(); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] hover:bg-sunk">
              <span className="text-muted">{m.i}</span>{m.l}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <button role="menuitem" onClick={() => { const c = menu.c; setMenu(null); openSheet(<DeleteCharSheet id={c.id} name={c.name} />); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[14px] text-crit hover:bg-sunk">
            <Trash2 size={15} />삭제
          </button>
        </div>
      )}
    </section>
  );
}

function AdminMessageSheet({ c }: { c: Character }) {
  const adminMessage = useStore((s) => s.adminMessage);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <SheetTitle sub="알림으로 전달돼요. 받는 쪽에는 ‘운영자’ 이름으로 보여요.">{c.name}에게 운영자 메시지</SheetTitle>
      <Field label="내용" htmlFor="am-t"><Textarea id="am-t" className="min-h-[140px]" value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button disabled={busy || !text.trim()} onClick={async () => { setBusy(true); try { await adminMessage(c.id, text.trim()); closeSheet(); toast("보냈어요."); } catch (e) { toast((e as Error).message); } finally { setBusy(false); } }}>{busy ? "보내는 중…" : "보내기"}</Button>
      </SheetActions>
    </>
  );
}

export function DeleteCharSheet({ id, name }: { id: string; name: string }) {
  const deleteCharacter = useStore((s) => s.deleteCharacter);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <SheetTitle sub="되돌릴 수 없어요. 확인을 위해 캐릭터 이름을 그대로 입력해 주세요.">{name} 삭제</SheetTitle>
      <Field label="캐릭터 이름" htmlFor="dc-n"><Input id="dc-n" value={typed} onChange={(e) => setTyped(e.target.value)} /></Field>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button variant="ink" disabled={typed.trim() !== name || busy} onClick={async () => { setBusy(true); try { await deleteCharacter(id); closeSheet(); toast(`${name}을(를) 삭제했어요.`); } catch (e) { toast((e as Error).message); } finally { setBusy(false); } }}>{busy ? "삭제 중…" : "삭제하기"}</Button>
      </SheetActions>
    </>
  );
}
