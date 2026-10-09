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
    <div className="app-scale mx-auto flex min-h-dvh max-w-[460px] flex-col px-5 pt-[calc(24px+env(safe-area-inset-top,0px))] pb-10">
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
        <Button variant="ghost" block className="gap-2.5" disabled><Mail size={18} strokeWidth={1.6} /> 이메일로 계속하기</Button>
        <Note className="mt-1">이메일·비밀번호 로그인(Firebase Authentication)은 다음 단계에서 연결돼요. 지금은 아래 데모 캐릭터로 들어갈 수 있어요.</Note>
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
