"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/format";
import { Avatar, Logo } from "../ui/identity";
import { IconButton } from "../ui/primitives";
import type { Character } from "@/lib/types";

export function Badge({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return (
    <span className={cx("absolute -right-0.5 top-0.5 min-w-[18px] rounded-full bg-crit px-1.5 text-center text-[11px] font-bold leading-[18px] text-white ring-2 ring-bg", className)}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function TopBar({ me, title, root, unread, wide, docWide }: { me: Character | null; title?: string; root: boolean; unread: number; wide?: boolean; docWide?: boolean }) {
  const router = useRouter();
  const openDrawer = useOverlay((s) => s.openDrawer);
  const stage = useStore((s) => s.data.stage);
  return (
    <header className="sticky top-0 z-30 bg-bg/85 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
      <div className={cx("mx-auto flex h-[62px] items-center gap-2 px-5 lg:px-8", wide ? "max-w-[1330px]" : docWide ? "max-w-[960px]" : "max-w-[var(--content)]")}>
        {root ? (
          <div className="flex min-w-0 items-center text-ink lg:hidden">
            <Logo height={30} />
          </div>
        ) : (
          <>
            <IconButton label="뒤로" onClick={() => router.back()} className="-ml-2.5"><ChevronLeft size={24} strokeWidth={1.6} /></IconButton>
            <span className="min-w-0 truncate font-display text-[18px] font-semibold">{title}</span>
          </>
        )}
        {root && <span className="hidden font-display text-[22px] font-semibold lg:block">{title}</span>}
        <span className="flex-1" />
        {me && (
          <button onClick={() => openDrawer()} aria-label="캐릭터 메뉴 열기" className="relative grid size-11 place-items-center rounded-full lg:hidden">
            <span className="rounded-full p-[2px] ring-1 ring-line"><Avatar c={me} stage={stage} size="sm" className="size-[32px]" /></span>
            <Badge n={unread} />
          </button>
        )}
      </div>
    </header>
  );
}
