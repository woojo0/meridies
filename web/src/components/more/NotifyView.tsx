"use client";

import { LIVE } from "@/lib/firebase";
import { NOTIF_KINDS } from "@/lib/notify";
import { useStore } from "@/lib/store";
import { Note, SectionHead } from "../ui/primitives";
import { PushCard } from "./PushCard";

const EMPTY = {};

/** 더보기 → 알림 설정: 받을 알림 고르기 + 푸시 기기 */
export function NotifyView() {
  const admin = useStore((s) => s.session.admin);
  const prefs = useStore((s) => s.ui.notify) ?? EMPTY;
  const setPref = useStore((s) => s.setNotifyPref);
  const kinds = admin ? [{ k: "adminDm" as const, label: "운영자 DM", desc: "멤버가 운영자 문의함에 메시지를 보냈을 때" }] : NOTIF_KINDS;
  return (
    <>
      <SectionHead title="받을 알림" aside="끈 항목은 소리·팝업·푸시가 안 와요" />
      {admin && <Note className="mt-0 mb-3">운영자 계정은 멤버가 보낸 문의(운영자 DM)만 알림으로 받아요.</Note>}
      <div className="card-flat divide-y divide-line">
        {kinds.map(({ k, label, desc }) => {
          const on = admin ? true : prefs[k] !== false;
          return (
            <label key={k} className="flex cursor-pointer items-center gap-3 px-4 py-3.5">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{label}</span>
                <span className="block text-[12.5px] text-muted">{desc}</span>
              </span>
              <input type="checkbox" role="switch" aria-checked={on} checked={on} disabled={admin} onChange={(e) => setPref(k, e.target.checked)} className="peer sr-only" />
              <span aria-hidden="true" className="relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-gold peer-disabled:opacity-50 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-surface after:shadow-[0_1px_2px_rgba(0,0,0,.2)] after:transition-transform peer-checked:after:translate-x-5" />
            </label>
          );
        })}
      </div>
      <p className="mt-2 px-1 text-[12.5px] text-muted">꺼도 알림 목록에는 남아요. 바로 보고 싶은 것만 켜 두세요.</p>

      {LIVE && (
        <>
          <SectionHead title="푸시 알림" aside="기기마다 추가" />
          <PushCard />
        </>
      )}
    </>
  );
}
