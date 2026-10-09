"use client";

import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CATS } from "@/lib/constants";
import { ago, cx, fmtDate, ymd } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Empty } from "../ui/primitives";
import { Compose } from "./Compose";
import { PostCard } from "./PostCard";
import { SunStrip } from "./SunStrip";

const catDot: Record<string, string> = { event: "bg-aurora", story: "bg-gold", notice: "bg-muted", academic: "bg-astra" };

/** 타임라인: 오늘의 빛 → 글쓰기 → 운영 공지 → 다가오는 일정 1건 → 전체 피드(필터 없음). */
export function TimelineView() {
  const now = useNow();
  const posts = useStore((s) => s.data.posts);
  const notice = useStore((s) => s.data.notice);
  const events = useStore((s) => s.data.events);
  const sorted = [...posts].sort((a, b) => b.at - a.at);
  const today = ymd(new Date(now));
  const up = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <>
      <SunStrip />
      <Compose />
      {(notice || up) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          {notice && (
            <div className="flex gap-3 rounded-2xl border border-gold/25 bg-gold-soft/60 px-5 py-4 text-sm">
              <Bell size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-gold" />
              <div className="min-w-0">
                <span className="eyebrow">운영 공지 · {ago(notice.at, now)}</span>
                <p className="mt-0.5 leading-relaxed">{notice.text}</p>
              </div>
            </div>
          )}
          {up && (
            <Link href="/calendar" className="card-flat group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-sunk/60 sm:max-w-[250px]">
              <i className={cx("size-2 shrink-0 rounded-full", catDot[up.cat])} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{up.title}</span>
                <span className="block text-xs text-muted">{fmtDate(up.date)} · {CATS[up.cat]}</span>
              </span>
              <ChevronRight size={16} className="text-muted" />
            </Link>
          )}
        </div>
      )}
      <div className="mt-5 flex flex-col gap-3">
        {sorted.map((p) => <PostCard key={p.id} p={p} now={now} />)}
        {!sorted.length && <Empty>아직 글이 없어요.</Empty>}
      </div>
    </>
  );
}
