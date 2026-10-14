"use client";

import { ArrowLeftRight, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { addAltAccount, removeAltAccount, switchAccount } from "@/lib/accounts";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Field, Input, RowSub, RowTitle } from "../ui/primitives";

/** 계정 이름: 운영자면 "운영자", 아니면 캐릭터 이름 */
export function useAccountLabels() {
  const chars = useStore((s) => s.data.chars);
  const session = useStore((s) => s.session);
  const alt = useStore((s) => s.alt);
  const name = (admin: boolean, charId: string | null) => (admin ? "운영자" : chars.find((c) => c.id === charId)?.name ?? "캐릭터 미등록");
  return { cur: name(session.admin, session.charId), other: alt ? name(alt.admin, alt.charId) : null };
}

/** 두 계정 동시 로그인 · 전환 (운영자만) */
export function AccountsSheet() {
  const closeSheet = useOverlay((s) => s.closeSheet);
  const session = useStore((s) => s.session);
  const alt = useStore((s) => s.alt);
  const altUnread = useStore((s) => s.altNotifs.filter((n) => !n.read).length);
  const labels = useAccountLabels();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const row = (icon: React.ReactNode, title: string, sub: string, aside?: React.ReactNode) => (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunk text-gold">{icon}</span>
      <span className="min-w-0 flex-1"><RowTitle>{title}</RowTitle><RowSub>{sub}</RowSub></span>
      {aside}
    </div>
  );

  return (
    <>
      <SheetTitle sub="운영자 계정과 캐릭터 계정에 함께 로그인해 두고 버튼 하나로 바꿔요. 두 계정의 알림을 모두 받아요.">계정 전환</SheetTitle>
      <div className="flex flex-col gap-2">
        {row(session.admin ? <ShieldCheck size={18} strokeWidth={1.6} /> : <UserRound size={18} strokeWidth={1.6} />, labels.cur, `${session.email ?? ""} · 지금 사용 중`)}
        {alt ? row(
          alt.admin ? <ShieldCheck size={18} strokeWidth={1.6} /> : <UserRound size={18} strokeWidth={1.6} />,
          labels.other ?? "",
          `${alt.email ?? ""}${altUnread ? ` · 안 읽은 알림 ${altUnread}` : ""}`,
          <button type="button" disabled={busy} onClick={async () => { setBusy(true); try { await removeAltAccount(); toast("두 번째 계정을 뺐어요."); } catch (e) { toast((e as Error).message); } finally { setBusy(false); } }} className="text-[12.5px] text-muted underline-offset-2 hover:text-crit hover:underline">빼기</button>,
        ) : null}
      </div>

      {alt ? (
        <SheetActions>
          <Button variant="ghost" onClick={closeSheet}>닫기</Button>
          <Button disabled={busy} onClick={async () => { setBusy(true); try { await switchAccount(); } catch (e) { toast((e as Error).message); setBusy(false); } }}><ArrowLeftRight size={16} strokeWidth={1.8} />{busy ? "전환 중…" : `${labels.other}(으)로 전환`}</Button>
        </SheetActions>
      ) : (
        <form className="mt-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!email.trim() || !pw) { toast("이메일과 비밀번호를 넣어 주세요."); return; }
          setBusy(true);
          try {
            await addAltAccount(email.trim(), pw);
            // 이 기기가 푸시를 받고 있으면 두 번째 계정 알림도 같은 기기로 오게 등록
            { const { linkThisDeviceToAlt } = await import("@/lib/push"); await linkThisDeviceToAlt().catch(() => {}); }
            setEmail(""); setPw(""); toast("두 번째 계정을 추가했어요.");
          } catch (e2) {
            const code = (e2 as { code?: string }).code ?? "";
            toast(/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code) ? "이메일이나 비밀번호가 맞지 않아요." : (e2 as Error).message);
          } finally { setBusy(false); }
        }}>
          <span className="mb-2 block text-[13px] font-semibold text-muted">다른 계정 추가</span>
          <Field label="이메일" htmlFor="alt-email"><Input id="alt-email" type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="비밀번호" htmlFor="alt-pw"><Input id="alt-pw" type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <SheetActions>
            <Button type="button" variant="ghost" onClick={closeSheet}>닫기</Button>
            <Button type="submit" disabled={busy}>{busy ? "추가하는 중…" : "계정 추가"}</Button>
          </SheetActions>
        </form>
      )}
    </>
  );
}
