"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LIVE } from "@/lib/firebase";
import { auth } from "@/lib/live";
import { useHydrated } from "@/lib/hooks";
import { toast } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { Avatar, BrandMark, DormDot, Logo } from "../ui/identity";
import { ToastRoot } from "../ui/overlays";
import { Button, Field, Input, Note, RowSub, RowTitle, rowCls } from "../ui/primitives";

const AUTH_MSG: Record<string, string> = {
  "auth/invalid-credential": "이메일 또는 비밀번호가 맞지 않아요.",
  "auth/user-not-found": "가입되지 않은 이메일이에요.",
  "auth/wrong-password": "비밀번호가 맞지 않아요.",
  "auth/email-already-in-use": "이미 가입된 이메일이에요.",
  "auth/weak-password": "비밀번호는 6자 이상이어야 해요.",
  "auth/invalid-email": "이메일 형식이 올바르지 않아요.",
  "auth/too-many-requests": "시도가 너무 많았어요. 잠시 뒤에 다시 해 주세요.",
};

/** 로그인·가입. 실제 서버 모드는 이메일/비밀번호, 데모 모드는 캐릭터 선택. */
export function LoginView() {
  const hydrated = useHydrated();
  const session = useStore((s) => s.session);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/timeline";
  const signedIn = LIVE ? !!session.uid : !!session.charId;

  useEffect(() => { if (hydrated && signedIn) router.replace(next); }, [hydrated, signedIn, next, router]);

  return (
    <div className="app-scale mx-auto flex min-h-dvh max-w-[460px] flex-col px-5 pt-[calc(24px+env(safe-area-inset-top,0px))] pb-10">
      <Link href="/" className="flex items-center self-start text-ink">
        <Logo height={32} />
      </Link>

      <div className="mt-12">
        <span className="eyebrow">루체른 황립 아카데미</span>
        <h1 className="mt-1.5 text-[30px]">등불 마차에 오르기</h1>
      </div>

      {LIVE ? <EmailAuth /> : <DemoAuth next={next} />}

      <ToastRoot />
      <p className="mt-auto pt-10 text-center text-xs text-muted">
        가입 신청 시 <Link href="/rules" className="underline underline-offset-2">규칙</Link> 동의가 필요해요. 비회원은 <Link href="/world" className="underline underline-offset-2">세계관</Link>과 규칙만 볼 수 있어요.
      </p>
    </div>
  );
}

function EmailAuth() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree, setAgree] = useState(false);
  const [nick, setNick] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !pw) { toast("이메일과 비밀번호를 넣어 주세요."); return; }
    if (mode === "up") {
      if (pw !== pw2) { toast("비밀번호가 서로 달라요."); return; }
      if (!nick.trim() || nick.trim().length > 20) { toast("오너 닉네임을 1~20자로 넣어 주세요."); return; }
      if (!agree) { toast("규칙에 동의해 주세요."); return; }
    }
    setBusy(true);
    try {
      if (mode === "in") await auth.signIn(email.trim(), pw);
      else { await auth.signUp(email.trim(), pw, nick.trim()); toast("가입 신청을 보냈어요. 운영자 승인을 기다려 주세요."); }
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      toast(AUTH_MSG[code] ?? "로그인에 실패했어요.");
    } finally { setBusy(false); }
  };

  return (
    <div className="card mt-7 p-5">
      <div className="mb-4 flex gap-1 rounded-full bg-sunk p-1" role="tablist">
        {(["in", "up"] as const).map((m) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`flex-1 rounded-full py-2 text-center text-sm transition-all ${mode === m ? "bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(0,0,0,.08)]" : "text-muted"}`}>
            {m === "in" ? "로그인" : "가입 신청"}
          </button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="이메일" htmlFor="lg-email"><Input id="lg-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="비밀번호" htmlFor="lg-pw"><Input id="lg-pw" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        {mode === "up" && (
          <>
            <Field label="비밀번호 확인" htmlFor="lg-pw2"><Input id="lg-pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
            <Field label="오너 닉네임" htmlFor="lg-nick" hint="캐릭터 프로필에 표시돼요. 다른 오너가 이 이름을 눌러 DM을 보낼 수 있고, 오너 간 DM은 운영진이 열람할 수 있어요. 나중에 바꿀 수 있어요."><Input id="lg-nick" maxLength={20} autoComplete="nickname" value={nick} onChange={(e) => setNick(e.target.value)} /></Field>
            <label className="mb-4 flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-snug">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 size-4 accent-gold" />
              <span><Link href="/rules" target="_blank" className="underline underline-offset-2">규칙</Link>을 읽었고 동의해요. 가입은 운영자 승인 뒤에 완료돼요.</span>
            </label>
          </>
        )}
        <Button type="submit" block disabled={busy}>{busy ? "잠시만요…" : mode === "in" ? "로그인" : "가입 신청하기"}</Button>
      </form>
      {mode === "in" && (
        <button
          type="button"
          className="mt-3 block w-full text-center text-xs text-muted underline-offset-2 hover:underline"
          onClick={async () => {
            if (!email.trim()) { toast("이메일을 먼저 적어 주세요."); return; }
            try { await auth.resetPassword(email.trim()); toast("비밀번호 재설정 메일을 보냈어요. 받은 편지함을 확인해 주세요."); }
            catch { toast("메일을 보내지 못했어요. 이메일을 확인해 주세요."); }
          }}
        >
          비밀번호를 잊었어요
        </button>
      )}
    </div>
  );
}

function DemoAuth({ next }: { next: string }) {
  const chars = useStore((s) => s.data.chars);
  const stage = useStore((s) => s.data.stage);
  const login = useStore((s) => s.login);
  const router = useRouter();
  return (
    <>
      <Note className="mt-7">Firebase 설정이 없어 데모 모드예요. 아래 캐릭터로 들어가면 이 브라우저에만 저장돼요.</Note>
      <div className="mb-3 mt-4 flex items-center gap-3">
        <h2 className="text-base">데모 캐릭터로 입장</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="card-flat">
        {chars.map((c) => (
          <button key={c.id} onClick={() => { login(c.id, false); router.replace(next); }} className={rowCls}>
            <Avatar c={c} stage={stage} />
            <span className="min-w-0 flex-1">
              <RowTitle>{c.name}</RowTitle>
              <span className="flex items-center gap-1.5 text-xs text-muted"><DormDot id={c.dorm} />{c.profiles[0]?.gender} · {c.profiles[0]?.height}</span>
            </span>
          </button>
        ))}
        {chars[0] && (
          <button onClick={() => { login(chars[0].id, true); router.replace("/more/admin"); }} className={rowCls}>
            <span className="grid size-[42px] place-items-center rounded-full bg-gold-soft text-gold"><BrandMark size={22} /></span>
            <span className="min-w-0 flex-1"><RowTitle>운영자로 입장</RowTitle><RowSub>{chars[0].name} 캐릭터 + 운영자 권한</RowSub></span>
          </button>
        )}
      </div>
    </>
  );
}
