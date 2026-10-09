"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { JOB_MS, STUDY_MS } from "@/lib/constants";
import { useHydrated, useMe, useNow } from "@/lib/hooks";
import { useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { Avatar, BrandMark } from "../ui/identity";
import { LightboxRoot, SheetRoot, ToastRoot } from "../ui/overlays";
import { CharDrawer } from "./CharDrawer";
import { TabBar, TABS } from "./TabBar";
import { Badge, TopBar } from "./TopBar";

const TITLES: Record<string, string> = {
  "/timeline": "타임라인", "/dorm": "기숙사", "/calendar": "달력", "/shop": "상점", "/more": "더보기",
  "/more/world": "공개 세계관", "/more/handbook": "루체른 생활 편람", "/more/rules": "규칙", "/more/characters": "캐릭터 목록", "/more/admin": "운영자 도구",
  "/join": "캐릭터 등록",
};

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

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const hydrated = useHydrated();
  const me = useMe();
  const pathname = usePathname();
  const router = useRouter();
  const unread = useUnreadCount();
  const stage = useStore((s) => s.data.stage);
  const openDrawer = useOverlay((s) => s.openDrawer);

  useEffect(() => {
    if (hydrated && !me) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, me, pathname, router]);

  // 저장소를 불러오기 전에는 스플래시만 보여요. 자식은 숨긴 채로 렌더해 두어
  // Next.js가 세그먼트 구조를 검증(즉시 내비게이션)할 수 있게 해요.
  if (!hydrated || !me) {
    return (
      <>
        <Splash />
        <div hidden aria-hidden="true">{children}</div>
      </>
    );
  }

  const root = TABS.some((t) => t.href === pathname);
  const immersive = pathname.startsWith("/room/");
  const pageTitle = title ?? TITLES[pathname] ?? "";

  return (
    <div className="app-scale lg:pl-[var(--rail)]">
      <TopBar me={me} title={pageTitle} root={root} unread={unread} />
      <main
        className={cx(
          "mx-auto w-full max-w-[var(--content)] px-5 pt-2 pb-[calc(110px+env(safe-area-inset-bottom,0px))] lg:px-8 lg:pb-28",
          immersive && "pb-[calc(150px+env(safe-area-inset-bottom,0px))]",
          pathname === "/dorm" && "pb-[calc(190px+env(safe-area-inset-bottom,0px))]",
        )}
      >
        {children}
      </main>
      <TabBar hidden={immersive} />
      {/* 데스크톱: 우측 하단 플로팅 캐릭터 버튼 */}
      <button
        onClick={() => openDrawer()}
        aria-label="캐릭터 메뉴"
        className="fixed right-6 bottom-6 z-[35] hidden items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pl-1.5 pr-4 text-ink shadow-float transition hover:bg-sunk lg:flex"
      >
        <Avatar c={me} stage={stage} size="md" className="size-10" />
        <span className="text-sm font-medium">{me.name}</span>
        <Badge n={unread} className="-top-0.5 -right-0.5" />
      </button>
      <CharDrawer />
      <SheetRoot />
      <LightboxRoot />
      <ToastRoot />
    </div>
  );
}
