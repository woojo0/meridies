"use client";

import { Scroll } from "lucide-react";
import { useState } from "react";
import { GRADES, JOB_MS, JOKBO, KW_COST, STUDY_MS, STUDY_PER_DAY, SUBJECTS, TRANSFER_FEE, TRANSFER_MIN, subject } from "@/lib/constants";
import { fmtDur, gIdx, money } from "@/lib/format";
import { useMe, useTick } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { jobLeft, studyLeft, useStore } from "@/lib/store";
import { ResultSheet, SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Field, Input, Pill, Progress, Select } from "../ui/primitives";

export const openStudySheet = (useJokbo = false) => useOverlay.getState().openSheet(<StudySheet initialJokbo={useJokbo} />);
export const openJobSheet = () => useOverlay.getState().openSheet(<JobSheet />);
export const openTransferSheet = (to?: string) => useOverlay.getState().openSheet(<TransferSheet to={to} />);

const gradeTone = ["text-crit", "text-warn", "text-muted", "text-good", "text-gold"];

function Countdown({ until }: { until: number }) {
  const now = useTick();
  return <span className="tnum">{fmtDur(until - now)}</span>;
}

/* ── 공부하기 ── */
export function StudySheet({ initialJokbo = false }: { initialJokbo?: boolean }) {
  const me = useMe();
  const now = useTick();
  const studyStart = useStore((s) => s.studyStart);
  const studyFinish = useStore((s) => s.studyFinish);
  const shiftTime = useStore((s) => s.shiftTime);
  const { openSheet, closeSheet } = useOverlay();
  const [jokbo, setJokbo] = useState(initialJokbo);
  const [busy, setBusy] = useState<string | null>(null);
  if (!me) return null;
  const left = studyLeft(me, now);

  if (me.studyJob) {
    const sj = me.studyJob; const sub = subject(sj.subject);
    const el = now - sj.start; const done = el >= STUDY_MS;
    return (
      <>
        <SheetTitle sub={`${sj.jokbo ? "선배의 족보를 펼쳐 놓고 공부하고 있어요. " : ""}1시간 뒤에 끝나요. 다른 화면으로 가도 시간은 흘러요.`}>{sub.name} 공부 중</SheetTitle>
        <Progress value={(el / STUDY_MS) * 100} />
        <p className="my-2 mb-3.5 text-center font-display text-[22px]">{done ? "끝났어요" : <><Countdown until={sj.start + STUDY_MS} /> 남음</>}</p>
        <SheetActions>
          {done ? (
            <Button onClick={async () => {
              let r: Awaited<ReturnType<typeof studyFinish>>; try { r = await studyFinish(); } catch (e) { toast((e as Error).message); return; } if (!r) return;
              const g0 = gIdx(r.before), g1 = gIdx(r.after);
              openSheet(
                <ResultSheet
                  eyebrow={subject(r.subject).name}
                  big={`+${r.gain}점`}
                  bigClass={r.gain ? "" : "text-muted"}
                  actions={<><Button variant="ghost" onClick={closeSheet}>닫기</Button><Button onClick={() => openStudySheet()} disabled={r.left <= 0}>다시 공부하기</Button></>}
                >
                  <p>{r.flavor}</p>
                  {r.jokbo && <p><Pill tone="gold">족보 +{JOKBO}점 포함</Pill></p>}
                  <p className="tnum text-muted">{r.before} → {r.after}점</p>
                  {g1 > g0 && <p className="mt-2.5"><Pill tone="gold">등급 상승 · {GRADES[g0].k} → {GRADES[g1].k}</Pill></p>}
                  <p className="mt-3 text-[13px] text-muted">오늘 남은 공부 {r.left}회</p>
                </ResultSheet>,
              );
            }}>결과 보기</Button>
          ) : (
            <Button variant="ghost" onClick={() => { shiftTime(1); toast("시간을 1시간 앞으로 감았어요."); }}>시간 +1시간 (데모)</Button>
          )}
        </SheetActions>
      </>
    );
  }

  const jk = me.inv.jokbo || 0;
  return (
    <>
      <SheetTitle sub={<>공부는 1시간이 걸려요. 광휘 실습은 배급 솔리스로만 연습할 수 있어요. 과목마다 오르는 폭이 달라요. 보통 0~10점, 베네 이상은 그 60%까지만 올라요. 오늘 남은 횟수 <b className="text-ink">{left}</b>/{STUDY_PER_DAY}</>}>공부하기</SheetTitle>
      {jk > 0 && (
        <label className="mb-3 flex cursor-pointer items-center gap-3 rounded-2xl border border-gold/40 bg-gold-soft/60 px-4 py-3">
          <input type="checkbox" checked={jokbo} onChange={(e) => setJokbo(e.target.checked)} className="size-5 accent-gold" />
          <span className="flex-1"><b>선배가 남기고 간 족보 쓰기</b><br /><span className="text-[13px] text-muted">이번 공부에 +{JOKBO}점 · 보유 {jk}권</span></span>
          <Scroll size={20} strokeWidth={1.5} className="text-gold" />
        </label>
      )}
      <div className="flex flex-col gap-2">
        {SUBJECTS.map((s) => {
          const v = me.scores[s.id]; const g = gIdx(v); const mx = g >= 3 ? Math.round((s.max || 10) * 0.6) : s.max || 10;
          const disabled = left <= 0 || (s.id === "kw" && (me.inv.ration || 0) < KW_COST);
          return (
            <button
              key={s.id}
              disabled={disabled || busy !== null}
              onClick={async () => { setBusy(s.id); let err: string | null; try { err = await studyStart(s.id, jokbo); } catch (e) { err = (e as Error).message; } finally { setBusy(null); } if (err) { toast(err); return; } closeSheet(); toast(`${s.name} 공부를 시작했어요. 1시간 뒤에 끝나요.`); }}
              className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-0.5 rounded-2xl border border-line bg-bg px-4 py-3.5 text-left transition-colors enabled:hover:border-gold/60 disabled:opacity-40"
            >
              <span className="font-semibold underline-offset-[3px] group-enabled:group-hover:underline">{s.name}{busy === s.id && <span className="ml-2 text-xs font-normal text-gold">시작하는 중…</span>}</span>
              <span className={`lat text-lg ${gradeTone[g]}`}>{GRADES[g].l}</span>
              <span className="col-span-2 text-[12.5px] text-muted tnum">
                {GRADES[g].k} · {v}점{g < 4 ? ` · 다음 등급까지 ${100 - (v % 100)}` : ""} · 1회 0~{mx}점{s.hard ? <> · <b className="text-crit">{s.hard}</b></> : ""}
                {s.id === "kw" && <><br />배급 솔리스 {KW_COST}병 사용 · 보유 {me.inv.ration || 0}병</>}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── 아르바이트 ── */
export function JobSheet() {
  const me = useMe();
  const now = useTick();
  const jobs = useStore((s) => s.data.jobs);
  const jobStart = useStore((s) => s.jobStart);
  const jobFinish = useStore((s) => s.jobFinish);
  const shiftTime = useStore((s) => s.shiftTime);
  const { openSheet, closeSheet } = useOverlay();
  const [busy, setBusy] = useState<string | null>(null);
  if (!me) return null;

  if (me.job) {
    const j = jobs.find((x) => x.id === me.job!.id)!;
    const el = now - me.job.start; const done = el >= JOB_MS;
    return (
      <>
        <SheetTitle sub={j.desc}>{j.name}</SheetTitle>
        <Progress value={(el / JOB_MS) * 100} />
        <p className="my-2 mb-3.5 text-center font-display text-[22px]">{done ? "완료할 수 있어요" : <><Countdown until={me.job.start + JOB_MS} /> 남음</>}</p>
        <SheetActions>
          {done ? (
            <Button onClick={async () => {
              let r: Awaited<ReturnType<typeof jobFinish>>; try { r = await jobFinish(); } catch (e) { toast((e as Error).message); return; } if (!r) return;
              openSheet(
                <ResultSheet eyebrow={j.name} big={r.ok ? "성공" : "실패"} bigClass={r.ok ? "text-good" : "text-crit"}>
                  <p>{r.ok ? j.flavorW : j.flavorL}</p>
                  <p className="mt-2.5"><Pill tone="gold" className="tnum">+{money(r.amt)}</Pill></p>
                  <p className="mt-2.5 text-[12.5px] text-muted">이번 성공 확률 {r.rate}% ({subject(j.subject).name} {GRADES[r.grade].k})</p>
                </ResultSheet>,
              );
            }}>완료하고 보상 받기</Button>
          ) : (
            <Button variant="ghost" onClick={() => { shiftTime(2); toast("시간을 2시간 앞으로 감았어요."); }}>시간 +2시간 (데모)</Button>
          )}
        </SheetActions>
      </>
    );
  }

  const left = jobLeft(me, now);
  return (
    <>
      <SheetTitle sub={<>시작하면 2시간 뒤에 완료할 수 있어요. 성공 확률은 관련 과목 성적으로 정해져요. 오늘 남은 횟수 <b className="text-ink">{left}</b>회{(me.inv.drink || 0) > 0 ? " · 솔리스 드링크로 +1 가능" : ""}</>}>아르바이트</SheetTitle>
      <div className="flex flex-col gap-2">
        {jobs.map((j) => {
          const s = subject(j.subject); const g = gIdx(me.scores[j.subject]);
          return (
            <button
              key={j.id}
              disabled={left <= 0 || busy !== null}
              onClick={async () => { setBusy(j.id); let err: string | null; try { err = await jobStart(j.id); } catch (e) { err = (e as Error).message; } finally { setBusy(null); } if (err) { toast(err); return; } closeSheet(); toast("아르바이트를 시작했어요. 2시간 뒤에 완료할 수 있어요."); }}
              className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-0.5 rounded-2xl border border-line bg-bg px-4 py-3.5 text-left transition-colors enabled:hover:border-gold/60 disabled:opacity-40"
            >
              <span className="font-semibold underline-offset-[3px] group-enabled:group-hover:underline">{j.name}{busy === j.id && <span className="ml-2 text-xs font-normal text-gold">시작하는 중…</span>}</span>
              <span className="font-display text-lg tnum">{j.rates[g]}%</span>
              <span className="col-span-2 text-[12.5px] text-muted">{s.name} <span className={gradeTone[g]}>{GRADES[g].k}</span> · 성공 {j.win[0]}~{j.win[1]}그로셴 · 실패 {j.lose[0]}~{j.lose[1]}그로셴</span>
              <span className="col-span-2 text-[12.5px] text-muted">{j.desc}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ── 송금 ── */
export function TransferSheet({ to: initialTo }: { to?: string }) {
  const me = useMe();
  const chars = useStore((s) => s.data.chars);
  const transfer = useStore((s) => s.transfer);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [to, setTo] = useState(initialTo ?? "");
  const [amt, setAmt] = useState("");
  const [memo, setMemo] = useState("");
  if (!me) return null;
  const a = parseInt(amt, 10);
  const recv = a > 0 ? Math.floor(a * (1 - TRANSFER_FEE)) : 0;
  return (
    <>
      <SheetTitle sub={<>보낼 때 {TRANSFER_FEE * 100}%가 수수료로 사라져요. 내 지갑: <b className="tnum text-ink">{money(me.money)}</b></>}>송금</SheetTitle>
      <Field label="받는 캐릭터" htmlFor="tf-to">
        <Select id="tf-to" value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">고르기</option>
          {chars.filter((c) => c.id !== me.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="보낼 금액 (그로셴)" htmlFor="tf-amt">
        <Input id="tf-amt" type="number" inputMode="numeric" min={TRANSFER_MIN} max={me.money} placeholder="예: 20" value={amt} onChange={(e) => setAmt(e.target.value)} />
      </Field>
      <Field label="메모 (선택)" htmlFor="tf-memo"><Input id="tf-memo" placeholder="사과값" value={memo} onChange={(e) => setMemo(e.target.value)} /></Field>
      <div className="mb-3.5 flex items-baseline justify-between gap-2.5 rounded-2xl bg-sunk/70 px-4 py-3.5">
        {a > 0 ? (
          <><span>{money(a)} 보내면</span><b className="font-display text-xl tnum">{money(recv)} 도착</b><span className="text-xs text-muted tnum">수수료 {a - recv}</span></>
        ) : (
          <span className="text-muted">금액을 넣으면 도착 금액이 보여요</span>
        )}
      </div>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button onClick={async () => {
          let err: string | null; try { err = await transfer(to, a, memo.trim()); } catch (e) { err = (e as Error).message; }
          if (err) { toast(err); return; }
          closeSheet(); toast(`${chars.find((c) => c.id === to)?.name}에게 ${money(recv)}이 도착했어요.`);
        }}>보내기</Button>
      </SheetActions>
    </>
  );
}
