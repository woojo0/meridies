"use client";

import { Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Avatar, BrandMark, DormDot } from "../ui/identity";
import { Button, Note, RowSub, RowTitle, rowCls } from "../ui/primitives";

/**
 * 로그인. 실제 서비스에서는 Firebase Authentication(구글·이메일)이 들어가요.
 * 초기 버전은 데모 계정을 골라 캐릭터로 들어갑니다.
 */
export function LoginView() {
  const hydrated = useHydrated();
  const chars = useStore((s) => s.data.chars);
  const stage = useStore((s) => s.data.stage);
  const charId = useStore((s) => s.session.charId);
  const login = useStore((s) => s.login);
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/timeline";

  useEffect(() => { if (hydrated && charId) router.replace(next); }, [hydrated, charId, next, router]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-[460px] flex-col px-5 pt-[calc(24px+env(safe-area-inset-top,0px))] pb-10">
      <Link href="/" className="flex items-center gap-2.5 self-start">
        <BrandMark size={26} />
        <span className="font-display text-[19px] font-semibold tracking-tight">메리디에스</span>
        <span className="lat text-[15px] text-muted">Meridies</span>
      </Link>

      <div className="mt-12">
        <span className="eyebrow">루체른 황립 아카데미</span>
        <h1 className="mt-1.5 text-[30px]">등불 마차에 오르기</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">로그인은 계정으로 하되, 모든 활동의 주체는 캐릭터예요. 계정당 캐릭터는 1명입니다.</p>
      </div>

      <div className="mt-7 flex flex-col gap-2.5">
        <Button variant="ghost" block className="gap-2.5" disabled><GoogleMark /> 구글로 계속하기</Button>
        <Button variant="ghost" block className="gap-2.5" disabled><Mail size={18} strokeWidth={1.6} /> 이메일로 계속하기</Button>
        <Note className="mt-1">실제 로그인(Firebase Authentication)은 다음 단계에서 연결돼요. 지금은 아래 데모 캐릭터로 들어갈 수 있어요.</Note>
      </div>

      <div className="mb-3 mt-6 flex items-center gap-3">
        <h2 className="text-base">데모 캐릭터로 입장</h2>
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">이 브라우저에만 저장돼요</span>
      </div>
      <div className="card-flat">
        {hydrated && chars.map((c) => (
          <button key={c.id} onClick={() => { login(c.id, false); router.replace(next); }} className={rowCls}>
            <Avatar c={c} stage={stage} />
            <span className="min-w-0 flex-1">
              <RowTitle>{c.name}</RowTitle>
              <span className="flex items-center gap-1.5 text-xs text-muted"><DormDot id={c.dorm} />{c.profiles[0]?.gender} · {c.profiles[0]?.height}</span>
            </span>
          </button>
        ))}
        {hydrated && chars[0] && (
          <button onClick={() => { login(chars[0].id, true); router.replace("/more/admin"); }} className={rowCls}>
            <span className="grid size-[42px] place-items-center rounded-full bg-gold-soft text-gold"><BrandMark size={22} /></span>
            <span className="min-w-0 flex-1">
              <RowTitle>운영자로 입장</RowTitle>
              <RowSub>{chars[0].name} 캐릭터 + 운영자 권한</RowSub>
            </span>
          </button>
        )}
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-muted">
        가입 신청 시 <Link href="/rules" className="underline underline-offset-2">규칙</Link> 동의가 필요해요. 비회원은 <Link href="/world" className="underline underline-offset-2">세계관</Link>과 규칙만 볼 수 있어요.
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2.1-1.9 3.2-4.8 3.2-8.2z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.6H2.1v2.9A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.8 14a6.6 6.6 0 0 1 0-4.2V6.9H2.1a11 11 0 0 0 0 9.9L5.8 14z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 6.9L5.8 9.8c.9-2.7 3.3-4.4 6.2-4.4z" />
    </svg>
  );
}
