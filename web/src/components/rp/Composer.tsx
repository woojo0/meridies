"use client";

import { ImagePlus, Send } from "lucide-react";
import { useRef, useState } from "react";
import { shrinkImage } from "@/lib/format";
import { toast } from "@/lib/overlay";
import { IconButton } from "../ui/primitives";
import { PreviewImages } from "../ui/overlays";

/** 역극 입력창: 하단 고정, 키보드가 올라와도 가려지지 않고, 긴 글은 자동 확장. 이미지 1장. */
export function Composer({ placeholder, onSend, offsetForTabBar, onTyping, typingNames = [] }: { placeholder: string; onSend: (text: string, image: string | null) => void | Promise<void>; offsetForTabBar?: boolean; onTyping?: () => void; typingNames?: string[] }) {
  const [text, setText] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const send = async () => {
    const t = text.trim();
    if (!t && !img) return;
    try { await onSend(t, img); } catch (e) { toast((e as Error).message); return; }
    setText(""); setImg(null);
    if (taRef.current) taRef.current.style.height = "auto";
  };

  return (
    <div
      className={`fixed inset-x-0 z-30 bg-bg/85 px-3 pt-2 backdrop-blur-xl lg:left-[var(--rail)] ${offsetForTabBar ? "bottom-[calc(72px+env(safe-area-inset-bottom,0px))] pb-2 lg:bottom-0 lg:pb-5" : "bottom-0 pb-[calc(10px+env(safe-area-inset-bottom,0px))] lg:pb-5"}`}
    >
      <div className="mx-auto max-w-[var(--content)] lg:px-3">
        {typingNames.length > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5 px-3 text-[12px] text-muted">
            <span className="flex gap-0.5" aria-hidden="true"><i className="size-1 animate-bounce rounded-full bg-gold [animation-delay:0ms]" /><i className="size-1 animate-bounce rounded-full bg-gold [animation-delay:150ms]" /><i className="size-1 animate-bounce rounded-full bg-gold [animation-delay:300ms]" /></span>
            {typingNames.length === 1 ? `${typingNames[0]} 입력 중…` : `${typingNames[0]} 외 ${typingNames.length - 1}명 입력 중…`}
          </div>
        )}
        <PreviewImages srcs={img ? [img] : []} onRemove={() => setImg(null)} />
        <div className="card flex items-end gap-1.5 p-1.5 pl-1 shadow-float focus-within:border-gold/50">
          <IconButton label="이미지 첨부" onClick={() => (img ? toast("역극은 한 번에 이미지 1장까지예요.") : fileRef.current?.click())} className="text-gold">
            <ImagePlus size={22} strokeWidth={1.5} />
          </IconButton>
          <textarea
            ref={taRef}
            rows={1}
            value={text}
            placeholder={placeholder}
            aria-label="역극 입력"
            onChange={(e) => { setText(e.target.value); if (e.target.value) onTyping?.(); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, window.innerHeight * 0.4) + "px"; }}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            className="min-h-11 max-h-[40vh] min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-[16px] leading-normal placeholder:text-muted/70 focus:outline-none"
          />
          <button onClick={send} aria-label="보내기" className="grid size-11 shrink-0 place-items-center rounded-full bg-gold text-[#fff8ea] transition disabled:opacity-40" disabled={!text.trim() && !img}>
            <Send size={19} strokeWidth={1.9} className="-translate-x-px translate-y-px" />
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try { setImg(await shrinkImage(f)); } catch { toast("이미지를 읽지 못했어요."); }
        }}
      />
    </div>
  );
}

export function ReadOnlyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 px-4 pt-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))] text-center text-[13px] text-muted backdrop-blur-xl lg:left-[var(--rail)]">
      {children}
    </div>
  );
}
