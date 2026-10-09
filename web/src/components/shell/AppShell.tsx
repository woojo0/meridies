"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { JOB_MS, STUDY_MS } from "@/lib/constants";
import { LIVE } from "@/lib/firebase";
import { useHydrated, useMe, useNow } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { Avatar, BrandMark } from "../ui/identity";
import { LightboxRoot, SheetRoot, ToastRoot } from "../ui/overlays";
import { Button } from "../ui/primitives";
import { CharDrawer } from "./CharDrawer";
import { TabBar, TABS } from "./TabBar";
import { Badge, TopBar } from "./TopBar";

const TITLES: Record<string, string> = {
  "/timeline": "타임라인", "/dorm": "기숙사", "/calendar": "달력", "/shop": "상점", "/more": "더보기", "/characters": "캐릭터",
  "/more/world": "공개 세계관", "/more/handbook": "루체른 생활 편람", "/more/rules": "규칙", "/more/characters": "캐릭터 목록", "/more/admin": "운영자 도구",
  "/join": "캐릭터 등록",
};
const titleFor = (pathname: string) => TITLES[pathname] ?? (/^\/profile\/[^/]+\/edit$/.test(pathname) ? "프로필 수정" : pathname.startsWith("/profile/") ? "프로필" : pathname.startsWith("/room/") ? "역극" : "");

export function useUnreadCount() {
  const me = useMe();
  const now = useNow();
  const notifs = useStore((s) => s.data.notifs);
  const threads = useStore((s) => s.data.threads);
  return useMemo(() => {
    if (!me) return 0;
    let n = notifs.filter((x) => x.to === me.id && !x.read).length;
    n += threads.filter((t) => t.a === me.id || t.b === me.id).reduce((a, t) => a + t.letters.filter((l) => l.from !== me.id && !l.read && l.deliverAt <= now).length, 0);
    if (me.job && now - me.job.start >= JOB_MS) n++;
    if (me.studyJob && now - me.studyJob.start >= STUDY_MS) n++;
    return n;
  }, [me, now, notifs, threads]);
}

/** 짧은 알림음 (오디오 파일 없이 WebAudio로). 브라우저 정책상 사용자가 화면을 한 번 누른 뒤에만 소리가 나요. */
function chime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const t0 = ctx.currentTime;
    [[880, 0], [1174.66, 0.12]].forEach(([f, d]) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(0.18, t0 + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.35);
      o.connect(g).connect(ctx.destination); o.start(t0 + d); o.stop(t0 + d + 0.4);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {}
}

/** 새 알림(역극 답장 등)이 오면 토스트 + 알림음. */
function useNotificationAlerts() {
  const me = useMe();
  const notifs = useStore((s) => s.data.notifs);
  const seen = useRef<Set<string> | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (!me) return;
    const mine = notifs.filter((n) => n.to === me.id);
    if (!seen.current) { seen.current = new Set(mine.map((n) => n.id)); return; }
    const fresh = mine.filter((n) => !n.read && !seen.current!.has(n.id));
    fresh.forEach((n) => seen.current!.add(n.id));
    if (!fresh.length) return;
    const n = fresh[0];
    const inRoom = n.link?.v === "room" && pathname === `/room/${n.link.id}`;
    if (!inRoom) { toast(fresh.length > 1 ? `${n.text} 외 ${fresh.length - 1}건` : n.text); chime(); }
  }, [notifs, me, pathname]);
}

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <div className="anim-fadein flex flex-col items-center gap-3 text-muted">
        <BrandMark size={40} />
        <span className="lat text-sm">Meridies</span>
      </div>
    </div>
  );
}

function LiveError({ msg }: { msg: string }) {
  const logout = useStore((s) => s.logout);
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="card max-w-[460px] p-7 text-center">
        <BrandMark size={36} className="mx-auto" />
        <h1 className="mt-4 text-[20px]">연결에 문제가 있어요</h1>
        <p className="mt-2.5 break-words text-sm leading-relaxed text-muted">{msg}</p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="ghost" onClick={() => location.reload()}>다시 시도</Button>
          <Button variant="ghost" onClick={() => logout()}>로그아웃</Button>
        </div>
      </div>
    </div>
  );
}

function Pending({ status, email }: { status: "pending" | "suspended"; email: string | null }) {
  const logout = useStore((s) => s.logout);
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="card max-w-[420px] p-7 text-center">
        <BrandMark size={36} className="mx-auto" />
        <h1 className="mt-4 text-[22px]">{status === "pending" ? "등불 마차를 기다리는 중" : "활동이 정지된 계정이에요"}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          {status === "pending" ? "가입 신청이 운영자에게 전달됐어요. 승인되면 이 화면이 자동으로 바뀌어요." : "운영자에게 문의해 주세요."}
          {email && <><br /><span className="text-xs">{email}</span></>}
        </p>
        <Button variant="ghost" className="mt-5" onClick={() => logout()}>로그아웃</Button>
      </div>
    </div>
  );
}

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const hydrated = useHydrated();
  const me = useMe();
  const session = useStore((s) => s.session);
  const pathname = usePathname();
  const router = useRouter();
  const unread = useUnreadCount();
  const stage = useStore((s) => s.data.stage);
  const openDrawer = useOverlay((s) => s.openDrawer);
  useNotificationAlerts();

  const liveError = useStore((s) => s.liveError);
  const signedIn = LIVE ? !!session.uid : !!session.charId;
  const approved = !LIVE || session.status === "member" || session.admin;
  const needsChar = LIVE && signedIn && approved && !session.charId && !session.admin;

  useEffect(() => {
    if (!hydrated) return;
    if (!signedIn) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (needsChar && pathname !== "/join") router.replace("/join");
  }, [hydrated, signedIn, needsChar, pathname, router]);

  if (LIVE && hydrated && signedIn && liveError) return <LiveError msg={liveError} />;
  const waiting = !hydrated || !signedIn || (needsChar && pathname !== "/join") || (LIVE && approved && !needsChar && !me && !session.admin);
  if (waiting) {
    return (<><Splash /><div hidden aria-hidden="true">{children}</div></>);
  }
  if (LIVE && !approved) return <Pending status={session.status === "suspended" ? "suspended" : "pending"} email={session.email} />;

  const root = TABS.some((t) => t.href === pathname) || pathname === "/characters";
  const immersive = pathname.startsWith("/room/");
  const pageTitle = title ?? titleFor(pathname);

  return (
    <div className="app-scale lg:pl-[var(--rail)]">
      <TopBar me={me} title={pageTitle} root={root} unread={unread} />
      <main
        className={cx(
          "mx-auto w-full max-w-[var(--content)] px-5 pt-2 pb-[calc(110px+env(safe-area-inset-bottom,0px))] lg:px-8 lg:pb-28",
          immersive && "pb-[calc(150px+env(safe-area-inset-bottom,0px))]",
          pathname === "/dorm" && "pb-[calc(190px+env(safe-area-inset-bottom,0px))]",
          (pathname.startsWith("/profile/") || pathname === "/characters" || pathname === "/join") && "lg:max-w-[1280px]",
        )}
      >
        {children}
      </main>
      <TabBar hidden={immersive} />
      {me && (
        <button
          onClick={() => openDrawer()}
          aria-label="캐릭터 메뉴"
          className="fixed right-6 bottom-6 z-[35] hidden items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 text-ink shadow-float transition hover:bg-sunk lg:flex"
        >
          <Avatar c={me} stage={stage} size="md" className="size-10" />
          <span className="text-sm font-medium">{me.name}</span>
          <Badge n={unread} className="-top-0.5 -right-0.5" />
        </button>
      )}
      <CharDrawer />
      <SheetRoot />
      <LightboxRoot />
      <ToastRoot />
    </div>
  );
}
