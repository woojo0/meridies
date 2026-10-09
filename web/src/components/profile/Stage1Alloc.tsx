"use client";

import { useState } from "react";
import { GRADES, STAGES } from "@/lib/constants";
import { DROPPED_AT_1, ELECTIVE_MIN, SUBJECTS1, stage1Pool, subjectName } from "@/lib/curriculum";
import { gIdx } from "@/lib/format";
import { toast } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { Character } from "@/lib/types";
import { Button, Chip, ChipRow, Note, Pill } from "../ui/primitives";

/**
 * 5학년(1차 성장) 과목 분배.
 * 이어지는 과목은 1학년 점수를 그대로 가져가고, 나머지 1학년 과목 점수의 합을 새 필수·선택과목에 나눠요.
 * 전환 전에는 계획으로 저장(언제든 수정), 전환 뒤에는 한 번 확정하면 운영자만 바꿀 수 있어요.
 */
export function Stage1Alloc({ c, admin }: { c: Character; admin: boolean }) {
  const communityStage = useStore((s) => s.data.stage);
  const allocate = useStore((s) => s.allocateStage1);
  const locked = !!c.scores1 && !admin;
  const pool = stage1Pool(c);
  const carried = SUBJECTS1.filter((s) => s.from);
  const newRequired = SUBJECTS1.filter((s) => s.required && !s.from);
  const electiveList = SUBJECTS1.filter((s) => !s.required);

  const init = c.alloc1 ?? (c.scores1 ? { electives: c.electives1 ?? [], alloc: Object.fromEntries(Object.entries(c.scores1).filter(([k]) => !carried.some((s) => s.id === k))) } : null);
  const [electives, setElectives] = useState<string[]>(init?.electives ?? []);
  const [text, setText] = useState<Record<string, string>>(() => Object.fromEntries([...newRequired, ...electiveList].map((s) => [s.id, String(init?.alloc[s.id] ?? "")])));
  const [busy, setBusy] = useState(false);

  const targets = [...newRequired, ...electiveList.filter((s) => electives.includes(s.id))];
  const parsed = Object.fromEntries(targets.map((s) => { const t = (text[s.id] ?? "").trim(); const n = t === "" ? 0 : Number(t); return [s.id, n]; }));
  const invalid = targets.filter((s) => { const n = parsed[s.id]; return !Number.isInteger(n) || n < 0; });
  const sum = targets.reduce((a, s) => a + (Number.isFinite(parsed[s.id]) ? parsed[s.id] : 0), 0);
  const remain = pool - sum;
  const ok = electives.length >= ELECTIVE_MIN && invalid.length === 0 && remain === 0;

  const toggle = (id: string) => setElectives((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));
  const spread = () => {
    if (!targets.length) return;
    const each = Math.floor(pool / targets.length); const rest = pool - each * targets.length;
    setText((t) => ({ ...t, ...Object.fromEntries(targets.map((s, i) => [s.id, String(each + (i === 0 ? rest : 0))])) }));
  };
  const submit = async () => {
    if (!ok) return;
    setBusy(true);
    try {
      await allocate(electives, Object.fromEntries(targets.map((s) => [s.id, parsed[s.id]])), admin ? c.id : undefined);
      toast(communityStage >= 1 ? "5학년 과목을 확정했어요." : "분배 계획을 저장했어요. 1차 성장으로 전환되면 그때 점수로 확정돼요.");
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <div className="card p-5">
      {c.scores1 ? (
        <Note className="mt-0">5학년 과목이 확정됐어요.{locked ? " 변경이 필요하면 운영자에게 문의해 주세요." : " 운영자는 다시 조정할 수 있어요."}</Note>
      ) : c.alloc1 ? (
        <Note className="mt-0">분배 계획이 저장돼 있어요. {STAGES[1]}로 전환될 때 그 시점의 1학년 점수로 확정돼요. 그 전까지 언제든 고칠 수 있어요.</Note>
      ) : (
        <Note className="mt-0">1학년 때 쌓은 점수 중 5학년으로 이어지는 과목은 그대로 유지되고, 나머지 과목의 점수 합을 새 과목에 자유롭게 나눠요. 비워 두면 1차 성장 때 공부·아르바이트를 할 수 없어요.</Note>
      )}

      <span className="mt-4 block text-[13px] font-semibold text-muted">그대로 이어지는 과목</span>
      <div className="mt-1.5 divide-y divide-line rounded-2xl border border-line px-4">
        {carried.map((s) => { const v = c.scores1?.[s.id] ?? c.scores[s.from!] ?? 0; const g = gIdx(v); return (
          <div key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
            <span>{s.name}<span className="ml-2 text-[12px] text-muted">← {subjectName(s.from!)}</span></span>
            <span className="tnum text-muted">{v}점 · <span className="text-ink">{GRADES[g].k}</span></span>
          </div>
        ); })}
      </div>

      <div className="mt-5 flex items-baseline justify-between gap-3">
        <span className="shrink-0 text-[13px] font-semibold text-muted">분배할 점수</span>
        <span className="text-right text-[12.5px] text-muted">{DROPPED_AT_1.map((id) => `${subjectName(id)} ${c.scores[id] ?? 0}`).join(" + ")}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between rounded-2xl bg-sunk/70 px-4 py-3">
        <b className="font-display text-[20px] tnum">{pool}점</b>
        <span className={`tnum text-[13px] ${remain === 0 ? "text-good" : "text-crit"}`}>{remain === 0 ? "모두 나눴어요" : remain > 0 ? `${remain}점 남음` : `${-remain}점 초과`}</span>
      </div>

      <span className="mt-5 block text-[13px] font-semibold text-muted">선택과목 <span className="font-normal">· {ELECTIVE_MIN}개 이상</span></span>
      <ChipRow className="mt-1.5" role="group" aria-label="선택과목">
        {electiveList.map((s) => <Chip key={s.id} on={electives.includes(s.id)} disabled={locked} onClick={() => toggle(s.id)}>{s.name}</Chip>)}
      </ChipRow>
      {electives.length < ELECTIVE_MIN && <p className="mt-1.5 text-[12.5px] text-crit">선택과목을 {ELECTIVE_MIN - electives.length}개 더 골라 주세요.</p>}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-muted">새 과목에 나누기</span>
        {!locked && <button type="button" onClick={spread} className="text-[12.5px] text-gold underline-offset-2 hover:underline">똑같이 나누기</button>}
      </div>
      <div className="mt-1.5 flex flex-col gap-2">
        {targets.map((s) => { const bad = invalid.includes(s); const g = gIdx(Number.isFinite(parsed[s.id]) ? parsed[s.id] : 0); return (
          <label key={s.id} className="grid grid-cols-[minmax(0,1fr)_110px_64px] items-center gap-3 rounded-2xl border border-line px-4 py-2 text-[14px]">
            <span>{s.name}{s.required ? <Pill tone="gold" className="ml-2">필수</Pill> : <Pill className="ml-2">선택</Pill>}</span>
            <input inputMode="numeric" disabled={locked} value={text[s.id] ?? ""} onChange={(e) => setText((t) => ({ ...t, [s.id]: e.target.value }))} aria-label={`${s.name} 점수`} aria-invalid={bad} className={`field-input min-h-10 text-right tnum ${bad ? "border-crit" : ""}`} />
            <span className="text-right text-[12.5px] text-muted">{GRADES[g].k}</span>
          </label>
        ); })}
      </div>
      {invalid.length > 0 && <p className="mt-1.5 text-[12.5px] text-crit">0 이상의 정수만 넣을 수 있어요.</p>}

      {!locked && (
        <div className="mt-4 flex justify-end">
          <Button size="sm" disabled={!ok || busy} onClick={submit}>{busy ? "저장 중…" : communityStage >= 1 ? "5학년 과목 확정" : "분배 계획 저장"}</Button>
        </div>
      )}
    </div>
  );
}
