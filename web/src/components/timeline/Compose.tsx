"use client";

import { ImagePlus, Send } from "lucide-react";
import { useRef, useState } from "react";
import { shrinkImage } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import { toast } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { Avatar } from "../ui/identity";
import { PreviewImages } from "../ui/overlays";
import { IconButton } from "../ui/primitives";

const DRAFT_KEY = "meridies-draft";

/** 타임라인 맨 위에 바로 쓰는 칸. 텍스트 + 이미지 최대 4장. 다른 곳에 갔다 와도 쓰던 글은 남아요. */
export function Compose() {
  const me = useMe();
  const stage = useStore((s) => s.data.stage);
  const addPost = useStore((s) => s.addPost);
  const [text, setText] = useState(() => { try { return sessionStorage.getItem(DRAFT_KEY) ?? ""; } catch { return ""; } });
  const [imgs, setImgs] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  if (!me) return null;

  const save = (v: string) => { setText(v); try { sessionStorage.setItem(DRAFT_KEY, v); } catch {} };
  const submit = () => {
    const t = text.trim();
    if (!t && !imgs.length) { toast("내용을 쓰거나 이미지를 넣어 주세요."); return; }
    addPost(t, imgs); save(""); setImgs([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("타임라인에 올렸어요.");
  };

  return (
    <div className="card mt-3 grid grid-cols-[42px_minmax(0,1fr)] gap-3.5 px-5 py-4 focus-within:border-gold/50">
      <Avatar c={me} stage={stage} className="mt-1 self-start" />
      <div className="min-w-0">
        <textarea
          rows={2}
          value={text}
          onChange={(e) => save(e.target.value)}
          placeholder={`${me.name}(으)로 타임라인에 쓰기`}
          aria-label="타임라인 글쓰기"
          className="min-h-[52px] w-full resize-none border-0 bg-transparent py-2.5 text-[15.5px] leading-relaxed placeholder:text-muted/70 focus:outline-none"
          onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
        />
        <PreviewImages srcs={imgs} onRemove={(i) => setImgs((a) => a.filter((_, k) => k !== i))} />
        <div className="mt-1.5 flex items-center gap-1.5 border-t border-line pt-2.5">
          <IconButton label="이미지 첨부 (최대 4장)" className="-ml-2.5 size-10 text-gold" onClick={() => (imgs.length >= 4 ? toast("이미지는 4장까지 넣을 수 있어요.") : fileRef.current?.click())}>
            <ImagePlus size={20} strokeWidth={1.5} />
          </IconButton>
          <span className="text-xs text-muted tnum">{imgs.length ? `${imgs.length}/4` : ""}</span>
          <span className="flex-1" />
          <button onClick={submit} aria-label="게시" disabled={!text.trim() && !imgs.length} className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-[#fff8ea] transition hover:brightness-105 disabled:opacity-35">
            <Send size={17} strokeWidth={1.9} className="-translate-x-px translate-y-px" />
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={async (e) => {
          const fs = [...(e.target.files ?? [])].slice(0, 4 - imgs.length);
          e.target.value = "";
          const out: string[] = [];
          for (const f of fs) { try { out.push(await shrinkImage(f)); } catch { toast("이미지를 읽지 못했어요."); } }
          setImgs((a) => [...a, ...out].slice(0, 4));
        }}
      />
    </div>
  );
}
