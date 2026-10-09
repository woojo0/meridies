import Link from "next/link";
import { DORMS } from "@/lib/constants";
import { EnterButton } from "./EnterButton";

/** 비회원 첫 화면. 세계관과 규칙만 열람할 수 있고, 입장은 로그인 뒤에. */
export function Landing() {
  return (
    <div className="min-h-dvh bg-night text-[#EDE6D6]">
      {/* ── 상단 ── */}
      <header className="mx-auto flex max-w-[1080px] items-center justify-between px-5 pt-[calc(18px+env(safe-area-inset-top,0px))] lg:px-10">
        <div className="flex items-center gap-2.5">
          <Eclipse size={26} />
          <span className="font-display text-[19px] font-semibold tracking-tight">메리디에스</span>
          <span className="lat hidden text-[15px] text-[#EDE6D6]/60 sm:inline">Meridies</span>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/world" className="rounded-full px-3 py-2 text-[#EDE6D6]/80 hover:text-[#EDE6D6]">세계관</Link>
          <Link href="/rules" className="rounded-full px-3 py-2 text-[#EDE6D6]/80 hover:text-[#EDE6D6]">규칙</Link>
          <EnterButton size="sm" />
        </nav>
      </header>

      {/* ── 히어로: 검은 정오 ── */}
      <section className="landing-grain relative mx-auto flex max-w-[1080px] flex-col items-center px-5 pt-16 pb-20 text-center lg:pt-24 lg:pb-28">
        <div className="relative mb-10 size-[180px] lg:size-[220px]" aria-hidden="true">
          <div className="absolute inset-0 rounded-full bg-[#C9AB7A] shadow-[0_0_80px_20px_rgba(201,171,122,.25)]" />
          <div className="absolute left-1/2 top-1/2 size-[94%] rounded-full bg-night" style={{ transform: "translate(-50%,-50%) translateX(7%)", animation: "eclipse 14s ease-in-out infinite" }} />
        </div>
        <span className="eyebrow text-[#EDE6D6]/55">제국력 828년 · 오늘의 빛 약 여섯 시간</span>
        <h1 className="mt-4 font-display text-[40px] font-semibold leading-[1.15] tracking-tight lg:text-[60px]">
          메리디에스
        </h1>
        <p className="lat mt-1 text-[22px] text-[#C9AB7A] lg:text-[26px]">Meridies — Imperial Academy of Lucerne</p>
        <p className="mt-7 max-w-[34rem] text-[15.5px] leading-[1.8] text-[#EDE6D6]/80 lg:text-[17px]">
          당신들이 태어난 해, 정오에 해가 졌습니다. 그날 이후 여름은 사라졌고, 빛은 병에 담겨 배급됩니다.
          아우렐 제국 유일의 마법 학교 루체른에 입학하는 열한 살 아이들의 이야기. 타임라인에서 시작되는 역극과
          성적·재화·성장을 한곳에서 굴리는 자캐 커뮤니티입니다.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <EnterButton />
          <Link href="/world" className="inline-flex min-h-12 items-center rounded-r border border-[#EDE6D6]/30 px-5 font-semibold text-[#EDE6D6] hover:border-[#EDE6D6]/70">세계관 읽기</Link>
        </div>
        <div className="mt-12 flex items-center gap-5" aria-label="다섯 학부">
          {DORMS.map((d) => (
            <span key={d.id} className="flex flex-col items-center gap-2 text-[11px] text-[#EDE6D6]/60">
              <i className="size-3 rounded-full" style={d.id === "fifth" ? { boxShadow: "inset 0 0 0 1.5px #6e7078" } : { background: `var(--${d.id})` }} />
              {d.name}
            </span>
          ))}
        </div>
      </section>

      {/* ── 다섯 학부: 가로 한 줄 ── */}
      <section className="mx-auto max-w-[1080px] border-t border-[#EDE6D6]/12 px-5 py-16 lg:px-10 lg:py-24">
        <span className="eyebrow text-[#C9AB7A]">루미나리아 · 입학 의식</span>
        <h2 className="mt-2 font-display text-[28px] font-semibold lg:text-[34px]">다섯 학부</h2>
        <p className="mt-3 max-w-[40rem] text-[15px] leading-[1.8] text-[#EDE6D6]/70">
          입학식 날, 신입생은 아무 색도 없는 불꽃이 타는 화로에 맨손을 넣습니다. 불꽃이 피우는 빛깔이 학부를 정합니다. 어느 색도 피지 않으면, 제5학부입니다.
        </p>
        <div className="no-scrollbar -mx-5 mt-10 flex snap-x gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:px-0">
          {DORMS.map((d) => (
            <div key={d.id} className="flex w-[200px] shrink-0 snap-start flex-col gap-3 rounded-2xl border border-[#EDE6D6]/12 bg-[#1b1710] p-5 lg:w-auto">
              <span className="size-9 rounded-full" style={d.id === "fifth" ? { boxShadow: "inset 0 0 0 2px #6e7078" } : { background: `var(--${d.id})`, boxShadow: `0 0 24px -6px var(--${d.id})` }} />
              <div>
                <h3 className="font-display text-[18px] font-semibold">{d.name}</h3>
                <span className="lat block text-[14px] text-[#C9AB7A]/80">{d.lat || "the Unlit"}</span>
                <span className="text-xs text-[#EDE6D6]/50">{d.sub} · {d.colorName}</span>
              </div>
              <p className="text-[13.5px] leading-[1.75] text-[#EDE6D6]/85">“{d.motto}”</p>
              <p className="text-[12.5px] leading-[1.7] text-[#EDE6D6]/50">{d.custom}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 하단 ── */}
      <footer className="mx-auto flex max-w-[1080px] flex-col items-start gap-4 border-t border-[#EDE6D6]/12 px-5 py-10 text-[13px] text-[#EDE6D6]/55 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <span className="flex items-center gap-2"><Eclipse size={18} /> 메리디에스 · 활동 인원 20명 안팎의 비공개 커뮤니티</span>
        <span className="flex gap-4">
          <Link href="/world" className="hover:text-[#EDE6D6]">공개 세계관</Link>
          <Link href="/rules" className="hover:text-[#EDE6D6]">규칙</Link>
          <Link href="/login" className="hover:text-[#EDE6D6]">로그인</Link>
        </span>
      </footer>
    </div>
  );
}

function Eclipse({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12" fill="#C9AB7A" />
      <circle cx="17.5" cy="12" r="10.5" fill="#15120c" />
    </svg>
  );
}
