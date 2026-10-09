"use client";

import { BookOpen, ChevronRight, Lock, LogOut, Moon, Monitor, Plus, ShieldCheck, Sun, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { H } from "@/lib/constants";
import { LIVE } from "@/lib/firebase";
import { money } from "@/lib/format";
import { useMe, useTheme } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { Avatar } from "../ui/identity";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Chip, ChipRow, Note, RowSub, RowTitle, SectionHead, rowCls } from "../ui/primitives";

function MenuRow({ href, icon, title, sub, onClick }: { href?: string; icon: React.ReactNode; title: string; sub: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunk text-gold">{icon}</span>
      <span className="min-w-0 flex-1"><RowTitle>{title}</RowTitle><RowSub>{sub}</RowSub></span>
      <ChevronRight size={18} className="text-muted" />
    </>
  );
  return href ? <Link href={href} className={rowCls}>{inner}</Link> : <button onClick={onClick} className={rowCls}>{inner}</button>;
}

/** 더보기: 세계관, 편람, 규칙, 캐릭터 목록, 설정, 운영자 메뉴. */
export function MoreView() {
  const me = useMe();
  const router = useRouter();
  const st = useStore();
  const { chars, stage } = st.data;
  const admin = st.session.admin;
  const openSheet = useOverlay((s) => s.openSheet);
  const [theme, setTheme] = useTheme();
  if (!me) return null;
  const ic = 19;

  return (
    <>
      <Link href={`/profile/${me.id}`} className="card mt-2 flex items-center gap-3.5 p-4 transition-colors hover:bg-sunk/60">
        <span className="rounded-full p-[3px] ring-1 ring-line"><Avatar c={me} stage={stage} size="lg" className="size-14" /></span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[18px] font-semibold">{me.name}</span>
          <RowSub>{money(me.money)} · 내 프로필 보기</RowSub>
        </span>
        <ChevronRight size={18} className="text-muted" />
      </Link>

      <SectionHead title="커뮤니티" />
      <div className="card-flat">
        <MenuRow href="/more/world" icon={<BookOpen size={ic} strokeWidth={1.6} />} title="공개 세계관" sub="아우렐 제국, 검은 정오, 루체른" />
        <MenuRow href="/more/handbook" icon={<BookOpen size={ic} strokeWidth={1.6} />} title="루체른 생활 편람" sub="물가, 캠퍼스, 시간표, 성적, 소문, 연표" />
        <MenuRow href="/more/rules" icon={<Lock size={ic} strokeWidth={1.6} />} title="규칙" sub="커뮤 운영 규칙" />
        <MenuRow href="/more/characters" icon={<Users size={ic} strokeWidth={1.6} />} title="캐릭터 목록" sub={`${chars.length}명`} />
        {!LIVE && <MenuRow href="/join" icon={<Plus size={ic} strokeWidth={1.6} />} title="캐릭터 등록" sub="성적 2,000점 분배 · 데모에서는 여러 명 가능" />}
      </div>

      <SectionHead title="설정" />
      <div className="card-flat">
        <div className="px-4 py-4">
          <span className="mb-2 block text-[13px] font-semibold text-muted">화면</span>
          <ChipRow>
            {([["system", "시스템", <Monitor key="s" size={14} />], ["light", "밝게", <Sun key="l" size={14} />], ["dark", "어둡게", <Moon key="m" size={14} />]] as const).map(([v, l, i]) => (
              <Chip key={v} on={theme === v} onClick={() => setTheme(v)}>{i}{l}</Chip>
            ))}
          </ChipRow>
          <p className="mt-1 text-xs text-muted">밤에 역극하는 사용자를 위해 어두운 화면을 기본 지원해요.</p>
        </div>
        <MenuRow icon={<LogOut size={ic} strokeWidth={1.6} />} title="로그아웃" sub="계정에서 나가기" onClick={async () => { await st.logout(); router.replace("/"); }} />
      </div>

      <SectionHead title="운영" />
      <div className="card-flat">
        {admin ? (
          <MenuRow href="/more/admin" icon={<ShieldCheck size={ic} strokeWidth={1.6} />} title="운영자 도구" sub="성장 단계 전환, 학기 마감, 상점 관리" />
        ) : LIVE ? (
          <MenuRow icon={<ShieldCheck size={ic} strokeWidth={1.6} />} title="운영자 도구" sub="운영자 계정에만 열려요" onClick={() => toast("운영자 권한이 없어요.")} />
        ) : (
          <MenuRow icon={<ShieldCheck size={ic} strokeWidth={1.6} />} title="운영자 권한 켜기 (데모)" sub="실제 서비스에서는 운영자 계정에만 보여요" onClick={() => { st.setAdmin(true); toast("운영자 권한을 켰어요."); }} />
        )}
      </div>

      {!LIVE && (<>
      <SectionHead title="데모 설정" aside="기획 확인용" />
      <div className="card-flat divide-y divide-line">
        <div className="px-4 py-4">
          <h3 className="mb-1 text-[15px]">지금 플레이 중인 캐릭터</h3>
          <p className="mb-2.5 text-[13px] text-muted">다른 캐릭터로 바꿔서 역극에 답하거나 편지를 받아 볼 수 있어요.</p>
          <ChipRow>{chars.map((c) => <Chip key={c.id} on={c.id === me.id} onClick={() => { st.switchChar(c.id); toast(`${c.name}(으)로 바꿨어요.`); }}>{c.name}</Chip>)}</ChipRow>
        </div>
        <div className="px-4 py-4">
          <h3 className="mb-1 text-[15px]">시간 빨리 감기</h3>
          <p className="mb-2.5 text-[13px] text-muted">아르바이트(2시간)와 편지 배달(1시간)을 바로 확인할 수 있어요. 현재 +{Math.round(st.shift / H)}시간.</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => { st.shiftTime(1); toast("1시간 앞으로 감았어요."); }}>+1시간</Button>
            <Button size="sm" variant="ghost" onClick={() => { st.shiftTime(2); toast("2시간 앞으로 감았어요."); }}>+2시간</Button>
            <Button size="sm" variant="text" onClick={() => openSheet(<ResetSheet />)}>처음 상태로 되돌리기</Button>
          </div>
        </div>
      </div>
      <Note>이 데모의 데이터는 예시이고, 이 브라우저에만 저장돼요.</Note>
      </>)}
    </>
  );
}

function ResetSheet() {
  const reset = useStore((s) => s.reset);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const router = useRouter();
  return (
    <>
      <SheetTitle>처음 상태로 되돌릴까요?</SheetTitle>
      <p>이 브라우저에서 만든 글, 역극, 편지가 모두 지워지고 예시 데이터로 돌아가요.</p>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button variant="ink" onClick={() => { reset(); closeSheet(); router.replace("/login"); toast("처음 상태로 되돌렸어요."); }}>되돌리기</Button>
      </SheetActions>
    </>
  );
}
