"use client";

import { Bell, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CATS } from "@/lib/constants";
import { ago, cx, fmtDate, ymd } from "@/lib/format";
import { useEffect, useRef } from "react";
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
  const postLimit = useStore((s) => s.postLimit);
  const hasMore = useStore((s) => s.postsHasMore);
  const loadMore = useStore((s) => s.loadMorePosts);
  const sentinel = useRef<HTMLDivElement>(null);
  const notice = useStore((s) => s.data.notice);
  const events = useStore((s) => s.data.events);
  const sorted = [...posts].sort((a, b) => b.at - a.at).slice(0, postLimit);
  const more = hasMore && (posts.length > postLimit || posts.length >= postLimit);
  // 바닥 근처에 오면 20개씩 더 불러와요.
  useEffect(() => {
    const el = sentinel.current; if (!el || !more) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) loadMore(); }, { rootMargin: "400px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, loadMore, sorted.length]);
  const today = ymd(new Date(now));
  const up = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <>
      <SunStrip />
      <Compose />
      {(notice || up) && (
        <div className="mt-3 flex flex-col gap-2">
          {notice && (
            <div className="flex gap-3 rounded-2xl border border-gold/25 bg-gold-soft/60 px-5 py-4 text-sm">
              <Bell size={18} strokeWidth={1.6} className="mt-[3px] shrink-0 text-gold" />
              <div className="min-w-0">
                <span className="eyebrow">운영 공지 · {ago(notice.at, now)}</span>
                <p className="mt-0.5 leading-relaxed">{notice.text}</p>
              </div>
            </div>
          )}
          {up && (
            <Link href="/calendar" className="card-flat group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-sunk/60">
              <span className="grid size-[18px] shrink-0 place-items-center"><i className={cx("size-2 rounded-full", catDot[up.cat])} /></span>
              <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                <span className="eyebrow">다가오는 일정</span>
                <span className="truncate text-sm font-semibold">{up.title}</span>
                <span className="text-xs text-muted">{fmtDate(up.date)} · {CATS[up.cat]}</span>
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
      <div ref={sentinel} className="h-px" aria-hidden="true" />
      {more ? <p className="py-6 text-center text-xs text-muted">더 불러오는 중…</p> : sorted.length >= 20 ? <p className="py-6 text-center text-xs text-muted">마지막 글이에요.</p> : null}
    </>
  );
}
