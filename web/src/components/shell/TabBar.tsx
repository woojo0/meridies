"use client";

import { Calendar, Home, LogOut, MessageSquare, MoreHorizontal, Rows3, ShoppingBag, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx, money } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Avatar, BrandMark, DormDot } from "../ui/identity";

export const TABS = [
  { href: "/timeline", label: "타임라인", Icon: Rows3 },
  { href: "/dorm", label: "기숙사", Icon: Home },
  { href: "/calendar", label: "달력", Icon: Calendar },
  { href: "/shop", label: "상점", Icon: ShoppingBag },
  { href: "/more", label: "더보기", Icon: MoreHorizontal },
] as const;

/** 데스크톱 레일에만 보이는 항목. 모바일은 더보기 안에 있어요. */
const DESKTOP_ONLY = [{ href: "/characters", label: "캐릭터", Icon: Users }, { href: "/inbox", label: "문의함", Icon: MessageSquare }] as const;

export function isTabActive(pathname: string, href: string) {
  if (href === "/more") return pathname.startsWith("/more") || pathname === "/join";
  if (href === "/characters") return pathname === "/characters" || pathname.startsWith("/profile/");
  return pathname === href || pathname.startsWith(href + "/");
}

/** 모바일: 떠 있는 알약 탭바. 데스크톱(≥900px): 좌측 레일. */
export function TabBar({ hidden }: { hidden?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useMe();
  const stage = useStore((s) => s.data.stage);
  const email = useStore((s) => s.session.email);
  const logout = useStore((s) => s.logout);
  const admin = useStore((s) => s.session.admin);
  const inboxUnread = useStore((s) => s.session.admin ? Object.values(s.adminChats).reduce((a, t) => a + (t.unreadAdmin || 0), 0) : (s.session.charId ? s.adminChats[s.session.charId]?.unreadChar ?? 0 : 0));
  const item = (href: string, label: string, Icon: typeof Rows3, desktopOnly = false) => {
    const on = isTabActive(pathname, href);
    const badge = href === "/inbox" ? inboxUnread : 0;
    return (
      <Link
        key={href}
        href={href}
        aria-current={on ? "page" : undefined}
        className={cx(
          "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-full text-[10.5px] transition-colors",
          "lg:min-h-0 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-3.5 lg:py-2.5 lg:text-[15px]",
          on ? "bg-gold-soft font-semibold text-gold lg:bg-gold-soft" : "text-muted hover:text-ink lg:hover:bg-sunk/70",
          desktopOnly && "hidden lg:flex",
        )}
      >
        <Icon size={21} strokeWidth={on ? 2 : 1.6} />
        <span>{label}</span>
        {badge > 0 && <span className="ml-auto rounded-full bg-crit px-1.5 text-[10.5px] font-bold leading-4 text-white">{badge}</span>}
      </Link>
    );
  };
  const [tl, dorm, cal, shop, more] = TABS;
  return (
    <nav
      aria-label="주 메뉴"
      className={cx(
        "fixed inset-x-3 bottom-[calc(10px+env(safe-area-inset-bottom,0px))] z-30 grid grid-cols-5 rounded-full border border-line bg-surface/92 p-1 shadow-float backdrop-blur-xl",
        "lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:bottom-0 lg:flex lg:w-[var(--rail)] lg:flex-col lg:gap-1 lg:rounded-none lg:border-0 lg:border-r lg:bg-surface lg:p-5 lg:shadow-none lg:backdrop-blur-none",
        hidden && "max-lg:hidden",
      )}
    >
      <div className="hidden lg:mb-8 lg:flex lg:flex-col lg:gap-1.5 lg:px-2 lg:pt-1">
        <Link href="/timeline" className="flex items-center gap-2.5">
          <BrandMark size={28} />
          <span className="font-display text-[22px] font-semibold tracking-tight">메리디에스</span>
        </Link>
        <span className="lat text-[13px] text-muted">Imperial Academy of Lucerne</span>
      </div>
      {item(tl.href, tl.label, tl.Icon)}
      {item(dorm.href, dorm.label, dorm.Icon)}
      {DESKTOP_ONLY.filter((d) => d.href !== "/inbox" || admin || !!me).map((d) => item(d.href, d.label, d.Icon, true))}
      {item(cal.href, cal.label, cal.Icon)}
      {item(shop.href, shop.label, shop.Icon)}
      {item(more.href, more.label, more.Icon)}
      <div className="mt-auto hidden lg:flex lg:flex-col lg:gap-2">
        {me && (
          <Link href={`/profile/${me.id}`} className="card-flat flex items-center gap-3 p-3 transition-colors hover:bg-sunk/60">
            <Avatar c={me} stage={stage} size="md" />
            <span className="min-w-0 flex-1 text-right">
              <span className="block truncate text-sm font-semibold">{me.name}</span>
              <span className="flex items-center justify-end gap-1.5 text-xs text-muted"><span className="tnum">{money(me.money)}</span><DormDot id={me.dorm} /></span>
            </span>
          </Link>
        )}
        <button onClick={async () => { await logout(); router.replace("/"); }} className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13px] text-muted transition-colors hover:bg-sunk/70 hover:text-ink">
          <LogOut size={16} strokeWidth={1.7} />
          <span className="min-w-0 flex-1 truncate">로그아웃{email ? ` · ${email}` : ""}</span>
        </button>
      </div>
    </nav>
  );
}
