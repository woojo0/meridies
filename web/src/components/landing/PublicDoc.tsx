import Link from "next/link";
import { DocView } from "../docs/DocView";
import { BrandMark } from "../ui/identity";

/** 비회원도 볼 수 있는 문서(세계관·규칙) 공용 레이아웃. */
export function PublicDoc({ title, eyebrow, src }: { title: string; eyebrow: string; src: string }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[62px] max-w-[780px] items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <BrandMark size={24} />
            <span className="font-display text-[17px] font-semibold tracking-tight">메리디에스</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/world" className="rounded-full px-3 py-2 text-muted hover:text-ink">세계관</Link>
            <Link href="/rules" className="rounded-full px-3 py-2 text-muted hover:text-ink">규칙</Link>
            <Link href="/login" className="ml-1 inline-flex min-h-9 items-center rounded-full bg-gold px-4 text-[13px] font-semibold text-gold-ink">입장하기</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[780px] px-4 pt-8 pb-24 lg:px-5">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-1.5 mb-4 text-[32px]">{title}</h1>
        <DocView src={src} />
        <div className="card mt-8 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">여기까지가 비회원에게 공개되는 전부예요. 타임라인과 역극, 프로필은 입장 뒤에 볼 수 있어요.</p>
          <Link href="/login" className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-gold px-5 font-semibold text-gold-ink">입장하기</Link>
        </div>
      </main>
    </div>
  );
}
