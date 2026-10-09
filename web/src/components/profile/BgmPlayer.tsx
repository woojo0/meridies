"use client";

import { Music, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/format";

/** 유튜브 링크에서 영상 id를 뽑아요. 못 뽑으면 null */
export function youtubeId(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  if (/^[\w-]{11}$/.test(u)) return u;
  try {
    const x = new URL(u.startsWith("http") ? u : `https://${u}`);
    const host = x.hostname.replace(/^www\.|^m\.|^music\./, "");
    if (host === "youtu.be") return x.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const v = x.searchParams.get("v"); if (v) return v;
      const m = x.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/); if (m) return m[1];
    }
  } catch { /* 아래로 */ }
  const m = u.match(/[?&]v=([\w-]{11})/); return m ? m[1] : null;
}

/* ── YouTube IFrame API 로더 (한 번만) ── */
type YTPlayer = { playVideo(): void; pauseVideo(): void; destroy(): void; getVideoData(): { title?: string }; setVolume(n: number): void };
type YTNs = { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { PLAYING: number; PAUSED: number; ENDED: number } };
declare global { interface Window { YT?: YTNs; onYouTubeIframeAPIReady?: () => void } }
let ytReady: Promise<YTNs> | null = null;
function loadYT(): Promise<YTNs> {
  if (ytReady) return ytReady;
  ytReady = new Promise((res) => {
    if (window.YT?.Player) { res(window.YT); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); res(window.YT!); };
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.async = true; document.head.appendChild(s);
  });
  return ytReady;
}

/** 프로필 카드 구석의 작은 BGM 플레이어. 재생/정지와 제목만. 소리는 숨긴 유튜브 플레이어가 내요. */
export function BgmPlayer({ url, title, className }: { url: string; title?: string; className?: string }) {
  const id = youtubeId(url);
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle");
  const [vtitle, setVtitle] = useState<string>("");

  useEffect(() => () => { player.current?.destroy(); player.current = null; }, [id]);

  if (!id) return null;
  const label = title?.trim() || vtitle || "BGM";

  const toggle = async () => {
    if (state === "playing") { player.current?.pauseVideo(); return; }
    if (player.current) { player.current.playVideo(); return; }
    setState("loading");
    try {
      const YT = await loadYT();
      if (!host.current) return;
      const el = document.createElement("div"); host.current.appendChild(el);
      player.current = new YT.Player(el, {
        videoId: id, width: 1, height: 1,
        playerVars: { autoplay: 1, controls: 0, loop: 1, playlist: id, playsinline: 1, rel: 0 },
        events: {
          onReady: (e: { target: YTPlayer }) => { setVtitle(e.target.getVideoData()?.title ?? ""); e.target.playVideo(); },
          onStateChange: (e: { data: number; target: YTPlayer }) => {
            if (e.data === YT.PlayerState.PLAYING) { setState("playing"); if (!vtitle) setVtitle(e.target.getVideoData()?.title ?? ""); }
            else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) setState("paused");
          },
          onError: () => setState("error"),
        },
      });
    } catch { setState("error"); }
  };

  return (
    <div className={cx("inline-flex max-w-[220px] items-center gap-1.5 rounded-full border border-line bg-surface/90 py-1 pl-1 pr-3 text-[12px] backdrop-blur", className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={state === "error"}
        aria-label={state === "playing" ? "BGM 정지" : "BGM 재생"}
        className={cx("grid size-7 shrink-0 place-items-center rounded-full transition", state === "playing" ? "bg-gold text-gold-ink" : "bg-sunk text-ink hover:bg-gold-soft")}
      >
        {state === "loading" ? <Music size={13} strokeWidth={2} className="animate-pulse" /> : state === "playing" ? <Pause size={13} strokeWidth={2.2} /> : <Play size={13} strokeWidth={2.2} className="translate-x-px" />}
      </button>
      <span className={cx("min-w-0 truncate", state === "error" ? "text-crit" : "text-muted")} title={label}>
        {state === "error" ? "재생할 수 없는 영상" : label}
      </span>
      <div ref={host} aria-hidden="true" className="pointer-events-none fixed -left-[9999px] top-0 size-px overflow-hidden opacity-0" />
    </div>
  );
}
