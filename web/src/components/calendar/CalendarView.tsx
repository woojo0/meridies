"use client";

import { ChevronLeft, ChevronRight, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import { CATS } from "@/lib/constants";
import { addDays, cx, fmtDate, ymd } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { CalEvent, CatId } from "@/lib/types";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Empty, Field, IconButton, Input, SectionHead, Textarea } from "../ui/primitives";
import { Dropdown } from "../ui/Dropdown";

const catDot: Record<CatId, string> = { event: "bg-aurora", story: "bg-gold", notice: "bg-muted", academic: "bg-astra" };

function EventRow({ e, admin }: { e: CalEvent; admin?: boolean }) {
  const openSheet = useOverlay((s) => s.openSheet);
  const [, m, d] = e.date.split("-");
  return (
    <div className={cx("grid gap-3 px-4 py-3.5", admin ? "grid-cols-[52px_minmax(0,1fr)_auto]" : "grid-cols-[52px_minmax(0,1fr)]")}>
      <div className="rounded-xl bg-sunk/70 py-1.5 text-center leading-tight"><b className="block font-display text-xl">{+d}</b><span className="text-[11px] text-muted">{+m}월</span></div>
      <div className="min-w-0">
        <div className="font-semibold"><i className={cx("mr-1.5 inline-block size-2 rounded-full align-middle", catDot[e.cat])} />{e.title}</div>
        <div className="text-[13px] text-muted">{CATS[e.cat]}{e.end ? ` · ~${fmtDate(e.end)}` : ""}</div>
        {e.desc && <div className="mt-1 text-sm leading-relaxed">{e.desc}</div>}
      </div>
      {admin && <IconButton label="일정 수정" className="-mr-2 -mt-1.5 size-9 text-muted" onClick={() => openSheet(<EventSheet date={e.date} event={e} />)}><Pencil size={15} strokeWidth={1.7} /></IconButton>}
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
        <div className="grid grid-cols-7 gap-y-1 text-center">
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
                  "relative mx-auto flex size-11 flex-col items-center justify-center rounded-full text-[13.5px] tnum transition-colors",
                  out && "text-muted/35",
                  on ? "bg-ink text-bg" : "hover:bg-sunk",
                  k === today && !on && "font-semibold text-gold",
                  k === today && "ring-1 ring-inset ring-gold/70",
                )}
              >
                <span className="leading-none">{d.getDate()}</span>
                <span className="absolute bottom-[5px] flex h-1 gap-[3px]">{es.slice(0, 3).map((e) => <i key={e.id} className={cx("size-1 rounded-full", on ? "bg-bg/70" : catDot[e.cat])} />)}</span>
                {k === today && !on && <span className="sr-only">오늘</span>}
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
        aside={admin ? <Button variant="ghost" size="sm" onClick={() => openSheet(<EventSheet date={calSel} />)}><Plus size={16} /> 일정 추가</Button> : undefined}
      />
      <div className="card-flat divide-y divide-line">{sel.map((e) => <EventRow key={e.id} e={e} admin={admin} />)}{!sel.length && <Empty>이 날은 일정이 없어요.</Empty>}</div>

      <SectionHead title="다가오는 일정" />
      <div className="card-flat divide-y divide-line">{upcoming.map((e) => <EventRow key={e.id} e={e} admin={admin} />)}{!upcoming.length && <Empty>예정된 일정이 없어요.</Empty>}</div>
    </>
  );
}

/** 일정 추가·수정 시트. event가 있으면 수정 모드(삭제 가능). 운영자만. */
export function EventSheet({ date, event }: { date: string; event?: CalEvent }) {
  const addEvent = useStore((s) => s.addEvent);
  const updateEvent = useStore((s) => s.updateEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [f, setF] = useState({ title: event?.title ?? "", date: event?.date ?? date, end: event?.end ?? "", cat: event?.cat ?? ("event" as CatId), desc: event?.desc ?? "" });
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const set = <K extends keyof typeof f>(k: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async () => {
    if (!f.title.trim() || !f.date) { toast("제목과 날짜를 넣어 주세요."); return; }
    const data = { ...f, title: f.title.trim(), end: f.end > f.date ? f.end : "", desc: f.desc.trim() };
    setBusy(true);
    try {
      if (event) { await updateEvent(event.id, data); toast("일정을 고쳤어요."); } else { await addEvent(data); toast("일정을 추가했어요."); }
      closeSheet();
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!event) return;
    if (!confirmDel) { setConfirmDel(true); return; }
    setBusy(true);
    try { await deleteEvent(event.id); toast("일정을 지웠어요."); closeSheet(); } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <>
      <SheetTitle sub="운영자만 추가·수정할 수 있어요.">{event ? "일정 수정" : "일정 추가"}</SheetTitle>
      <Field label="제목" htmlFor="ev-t"><Input id="ev-t" value={f.title} onChange={set("title")} /></Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="날짜" htmlFor="ev-d"><Input id="ev-d" type="date" value={f.date} onChange={set("date")} /></Field>
        <Field label="끝나는 날 (기간 일정만)" htmlFor="ev-e"><Input id="ev-e" type="date" value={f.end} onChange={set("end")} /></Field>
      </div>
      <Field label="분류" htmlFor="ev-c"><Dropdown<CatId> id="ev-c" value={f.cat} onChange={(v) => setF((x) => ({ ...x, cat: v }))} options={(Object.entries(CATS) as [CatId, string][]).map(([k, l]) => ({ v: k, l }))} /></Field>
      <Field label="설명" htmlFor="ev-x"><Textarea id="ev-x" className="min-h-[70px]" value={f.desc} onChange={set("desc")} /></Field>
      {event && (
        <div className="mb-3 flex justify-end">
          <button type="button" disabled={busy} onClick={remove} className={cx("text-[13px] underline-offset-2 hover:underline", confirmDel ? "font-semibold text-crit" : "text-muted")}>{confirmDel ? "정말 지울까요? 한 번 더 누르면 삭제돼요" : "이 일정 삭제"}</button>
        </div>
      )}
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button disabled={busy} onClick={submit}>{busy ? "저장 중…" : event ? "저장" : "추가"}</Button>
      </SheetActions>
    </>
  );
}
