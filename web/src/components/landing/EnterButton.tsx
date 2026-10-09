"use client";

import Link from "next/link";
import { useHydrated } from "@/lib/hooks";
import { useStore } from "@/lib/store";

/** 로그인 상태면 타임라인으로, 아니면 로그인으로. */
export function EnterButton({ size = "md" }: { size?: "md" | "sm" }) {
  const hydrated = useHydrated();
  const charId = useStore((s) => s.session.charId);
  const inApp = hydrated && !!charId;
  const cls = size === "md"
    ? "inline-flex min-h-12 items-center rounded-r bg-[#EDE6D6] px-6 font-semibold text-[#15120c] transition hover:bg-white"
    : "ml-1 inline-flex min-h-9 items-center rounded-r bg-[#EDE6D6] px-3.5 text-[13px] font-semibold text-[#15120c] transition hover:bg-white";
  return <Link href={inApp ? "/timeline" : "/login"} className={cls}>{inApp ? "타임라인으로" : "입장하기"}</Link>;
}
