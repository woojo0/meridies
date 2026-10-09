"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { CATS } from "@/lib/constants";
import { addDays, cx, fmtDate, ymd } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { CalEvent, CatId } from "@/lib/types";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Empty, Field, IconButton, Input, SectionHead, Select, Textarea } from "../ui/primitives";

const catDot: Record<CatId, string> = { event: "bg-aurora", story: "bg-gold", notice: "bg-muted", academic: "bg-astra" };

function EventRow({ e }: { e: CalEvent }) {
  const [, m, d] = e.date.split("-");
  return (
    <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 px-4 py-3.5">
      <div className="rounded-xl bg-sunk/70 py-1.5 text-center leading-tight"><b className="block font-display text-xl">{+d}</b><span className="text-[11px] text-muted">{+m}월</span></div>
      <div className="min-w-0">
        <div className="font-semibold"><i className={cx("mr-1.5 inline-block size-2 rounded-full align-middle", catDot[e.cat])} />{e.title}</div>
        <div className="text-[13px] text-muted">{CATS[e.cat]}{e.end ? ` · ~${fmtDate(e.end)}` : ""}</div>
        {e.desc && <div className="mt-1 text-sm leading-relaxed">{e.desc}</div>}
      </div>
    </div>
  );
}

/** 모바일: 월간 미니 달력(점) + 일정 목록. 데스크톱도 같은 구성, 폭만 넓게. */
export function CalendarView() {
  const now = useNow();
  const events = useStore((s) => s.data.events);
  const { calSel, calMonth } = useStore((s) => s.ui);
  const setCalSel = useStore((s) => s.setCalSel);
  const moveCalMonth = useStore((s) => s.moveCalMonth);
  const admin = useStore((s) => s.session.admin);
  const openSheet = useOverlay((s) => s.openSheet);

  const [y, mo] = calMonth;
  const first = new Date(y, mo, 1);
  const start = addDays(first, -first.getDay());
  const today = ymd(new Date(now));
  const evOn = (d: string) => events.filter((e) => (e.end ? d >= e.date && d <= e.end : e.date === d));
  const sel = evOn(calSel);
  const upcoming = events.filter((e) => (e.end || e.date) >= today).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <div className="card mt-2 p-4">
        <div className="mb-2 flex items-center justify-between">
          <IconButton label="이전 달" onClick={() => moveCalMonth(-1)}><ChevronLeft size={22} strokeWidth={1.6} /></IconButton>
          <h2 className="text-lg">{y}년 {mo + 1}월</h2>
          <IconButton label="다음 달" onClick={() => moveCalMonth(1)}><ChevronRight size={22} strokeWidth={1.6} /></IconButton>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {"일월화수목금토".split("").map((x, i) => <span key={x} className={cx("py-1 text-[11.5px] text-muted", i === 0 && "text-crit/80")}>{x}</span>)}
          {Array.from({ length: 42 }, (_, i) => {
            const d = addDays(start, i); const k = ymd(d); const es = evOn(k);
            const out = d.getMonth() !== mo; const on = calSel === k;
            return (
              <button
                key={k}
                onClick={() => setCalSel(k)}
                aria-pressed={on}
                aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일 일정 ${es.length}개`}
                className={cx(
                  "mx-auto flex aspect-square w-full max-h-[52px] flex-col items-center justify-center gap-[3px] rounded-full text-sm tnum transition-colors",
                  out && "text-muted/40",
                  k === today && !on && "font-bold text-gold",
                  on ? "bg-gold text-gold-ink" : "hover:bg-sunk",
                )}
              >
                {d.getDate()}
                <span className="flex h-[5px] gap-0.5">{es.slice(0, 3).map((e) => <i key={e.id} className={cx("size-[5px] rounded-full", on ? "bg-gold-ink/60" : catDot[e.cat])} />)}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 border-t border-line pt-3 text-xs text-muted">
          {(Object.entries(CATS) as [CatId, string][]).map(([k, l]) => <span key={k} className="inline-flex items-center gap-1.5"><i className={cx("inline-block size-2 rounded-full", catDot[k])} />{l}</span>)}
        </div>
      </div>

      <SectionHead
        title={fmtDate(calSel)}
        aside={admin ? <Button variant="ghost" size="sm" onClick={() => openSheet(<AddEventSheet date={calSel} />)}><Plus size={16} /> 일정 추가</Button> : undefined}
      />
      <div className="card-flat divide-y divide-line">{sel.map((e) => <EventRow key={e.id} e={e} />)}{!sel.length && <Empty>이 날은 일정이 없어요.</Empty>}</div>

      <SectionHead title="다가오는 일정" />
      <div className="card-flat divide-y divide-line">{upcoming.map((e) => <EventRow key={e.id} e={e} />)}{!upcoming.length && <Empty>예정된 일정이 없어요.</Empty>}</div>
    </>
  );
}

export function AddEventSheet({ date }: { date: string }) {
  const addEvent = useStore((s) => s.addEvent);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [f, setF] = useState({ title: "", date, end: "", cat: "event" as CatId, desc: "" });
  const set = <K extends keyof typeof f>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <>
      <SheetTitle sub="운영자만 추가할 수 있어요.">일정 추가</SheetTitle>
      <Field label="제목" htmlFor="ev-t"><Input id="ev-t" value={f.title} onChange={set("title")} /></Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="날짜" htmlFor="ev-d"><Input id="ev-d" type="date" value={f.date} onChange={set("date")} /></Field>
        <Field label="끝나는 날 (기간 일정만)" htmlFor="ev-e"><Input id="ev-e" type="date" value={f.end} onChange={set("end")} /></Field>
      </div>
      <Field label="분류" htmlFor="ev-c"><Select id="ev-c" value={f.cat} onChange={set("cat")}>{(Object.entries(CATS) as [CatId, string][]).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
      <Field label="설명" htmlFor="ev-x"><Textarea id="ev-x" className="min-h-[70px]" value={f.desc} onChange={set("desc")} /></Field>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button onClick={() => { if (!f.title.trim() || !f.date) { toast("제목과 날짜를 넣어 주세요."); return; } addEvent({ ...f, title: f.title.trim(), end: f.end > f.date ? f.end : "", desc: f.desc.trim() }); closeSheet(); toast("일정을 추가했어요."); }}>추가</Button>
      </SheetActions>
    </>
  );
}
