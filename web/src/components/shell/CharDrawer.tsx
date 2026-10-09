"use client";

import { ChevronRight, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { JOB_MS, STAGES, STUDY_MS, dorm as dormOf, subject } from "@/lib/constants";
import { ago, cx, money } from "@/lib/format";
import { useMe, useNow } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { PenpalTab } from "../letters/PenpalTab";
import { openJobSheet, openStudySheet } from "../profile/growthSheets";
import { RoomList } from "../rp/RoomList";
import { Avatar, Crest, DormDot } from "../ui/identity";
import { Button, Empty, IconButton, RowSub, RowTitle, rowCls } from "../ui/primitives";

/** 캐릭터 메뉴: 모바일은 오른쪽 서랍, 데스크톱은 플로팅 버튼 → 패널. 역극 / 펜팔 / 알림. */
export function CharDrawer() {
  const { drawerOpen, drawerTab, closeDrawer, setDrawerTab } = useOverlay();
  const me = useMe();
  const now = useNow();
  const router = useRouter();
  const stage = useStore((s) => s.data.stage);
  const rooms = useStore((s) => s.data.rooms);
  const notifs = useStore((s) => s.data.notifs);
  const threads = useStore((s) => s.data.threads);
  const markNotif = useStore((s) => s.markNotif);
  const chat = useStore((s) => (s.session.charId ? s.adminChats[s.session.charId] : undefined));
  const markAllNotifs = useStore((s) => s.markAllNotifs);
  const clearReadNotifs = useStore((s) => s.clearReadNotifs);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen || !me) return null;
  const c = me.id;
  const rpNew = rooms.filter((r) => r.members.includes(c) && r.lastAt > (r.read?.[c] || 0)).length;
  const newLetters = threads.filter((t) => t.a === c || t.b === c).reduce((a, t) => a + t.letters.filter((l) => l.from !== c && !l.read && l.deliverAt <= now).length, 0);
  const studyReady = !!(me.studyJob && now - me.studyJob.start >= STUDY_MS);
  const jobReady = !!(me.job && now - me.job.start >= JOB_MS);
  const myNotifs = notifs.filter((x) => x.to === c);
  const chatUnread = chat?.unreadChar ?? 0;
  const chatLast = chat?.lastText ?? "";
  const nCount = myNotifs.filter((x) => !x.read).length + (studyReady ? 1 : 0) + (jobReady ? 1 : 0) + chatUnread;
  const d = dormOf(me.dorm);

  const tabs = [
    { k: "rp", l: "역극", n: rpNew },
    { k: "pen", l: "펜팔", n: newLetters },
    { k: "noti", l: "알림", n: nCount },
  ] as const;

  return (
    <div className="fixed inset-0 z-50">
      <div className="anim-fadein absolute inset-0 bg-night/50" onClick={closeDrawer} />
      <aside role="dialog" aria-label="캐릭터 메뉴" className="anim-slidein absolute inset-y-0 right-0 flex w-[min(400px,90vw)] flex-col bg-bg pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-float lg:inset-y-3 lg:right-3 lg:rounded-3xl lg:border lg:border-line">
        <div className="flex items-center gap-3 p-4 pt-5">
          <span className="rounded-full p-[2px] ring-1 ring-line"><Avatar c={me} stage={stage} /></span>
          <div className="min-w-0 flex-1">
            <b className="block truncate font-display text-[16px]">{me.name}</b>
            <div className="flex items-center gap-1.5 text-[13px] text-muted"><DormDot id={me.dorm} /><span className="tnum">{money(me.money)}</span></div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { closeDrawer(); router.push(`/profile/${me.id}`); }}>프로필</Button>
          <IconButton label="닫기" onClick={closeDrawer}><X size={22} strokeWidth={1.6} /></IconButton>
        </div>
        <div role="tablist" className="mx-4 flex gap-1 rounded-full bg-sunk p-1">
          {tabs.map((t) => (
            <button key={t.k} role="tab" aria-selected={drawerTab === t.k} onClick={() => setDrawerTab(t.k)} className={cx("flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm transition-all", drawerTab === t.k ? "bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,.08)]" : "text-muted")}>
              {t.l}{t.n > 0 && <span className="rounded-full bg-crit px-1.5 text-[10.5px] font-bold leading-4 text-white">{t.n}</span>}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          {drawerTab === "rp" && (
            <>
              <Link href="/dorm" onClick={closeDrawer} className="card mb-3 flex items-center gap-3 p-3.5 transition-colors hover:bg-sunk/60">
                <Crest id={me.dorm} size={34} />
                <span className="min-w-0 flex-1">
                  <RowTitle>{d.name} 기숙사 역극</RowTitle>
                  <RowSub>{STAGES[stage]} · 학부 단체 역극방</RowSub>
                </span>
                <ChevronRight size={18} className="text-muted" />
              </Link>
              <div className="card-flat"><RoomList charId={c} showUnread onNavigate={closeDrawer} /></div>
            </>
          )}
          {drawerTab === "pen" && <PenpalTab />}
          {drawerTab === "noti" && (
            <>
            <Link href="/inbox" onClick={closeDrawer} className="card mb-3 flex items-center gap-3 p-3.5 transition-colors hover:bg-sunk/60">
              <span className="grid size-9 place-items-center rounded-full bg-gold-soft text-gold"><MessageSquare size={17} strokeWidth={1.7} /></span>
              <span className="min-w-0 flex-1"><RowTitle>운영자 문의함{chatUnread > 0 ? ` · ${chatUnread}` : ""}</RowTitle><RowSub>{chatLast || "운영자에게 직접 묻고 답을 받아요"}</RowSub></span>
              <ChevronRight size={18} className="text-muted" />
            </Link>
            {myNotifs.length > 0 && (
              <div className="mb-2 flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" disabled={!myNotifs.some((n) => !n.read)} onClick={async () => { try { await markAllNotifs(); } catch (e) { toast((e as Error).message); } }}>전체 확인</Button>
                <Button size="sm" variant="ghost" disabled={!myNotifs.some((n) => n.read)} onClick={async () => { try { await clearReadNotifs(); toast("확인한 알림을 지웠어요."); } catch (e) { toast((e as Error).message); } }}>확인한 것 지우기</Button>
              </div>
            )}
            <div className="card-flat flex flex-col">
              {studyReady && me.studyJob && (
                <button onClick={() => { closeDrawer(); openStudySheet(); }} className={rowCls}>
                  <span className="size-2 shrink-0 rounded-full bg-crit" />
                  <span className="min-w-0 flex-1"><RowTitle>공부가 끝났어요</RowTitle><RowSub>{subject(me.studyJob.subject).name} · 결과를 확인하세요</RowSub></span>
                </button>
              )}
              {jobReady && (
                <button onClick={() => { closeDrawer(); openJobSheet(); }} className={rowCls}>
                  <span className="size-2 shrink-0 rounded-full bg-crit" />
                  <span className="min-w-0 flex-1"><RowTitle>아르바이트가 끝났어요</RowTitle><RowSub>완료를 눌러 보상을 받으세요</RowSub></span>
                </button>
              )}
              {myNotifs.map((x) => (
                <button
                  key={x.id}
                  onClick={() => {
                    markNotif(x.id); closeDrawer();
                    if (x.link?.v === "inbox") router.push("/inbox");
                    else if (x.link?.v === "room") router.push(`/room/${x.link.id}`);
                    else if (x.link?.v === "profile") router.push(`/profile/${x.link.id}`);
                    else router.push("/timeline");
                  }}
                  className={rowCls}
                >
                  <span className={cx("size-2 shrink-0 rounded-full", x.read ? "bg-line" : "bg-crit")} />
                  <span className="min-w-0 flex-1"><span className="block text-[14.5px] leading-snug">{x.text}</span><RowSub>{ago(x.at, now)}</RowSub></span>
                </button>
              ))}
              {!myNotifs.length && !studyReady && !jobReady && <Empty>새 알림이 없어요.</Empty>}
            </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
