"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DORMS, GRADES, KW_MAX_ALLOC, SUBJECTS, TOTAL_ALLOC } from "@/lib/constants";
import { cx, gIdx } from "@/lib/format";
import { toast } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { DormId } from "@/lib/types";
import { Crest } from "../ui/identity";
import { Button, Field, Input, SectionHead } from "../ui/primitives";

const gradeText = ["text-crit", "text-warn", "text-muted", "text-good", "text-gold"];

/** 캐릭터 등록: 이름·학부(직접 선택)·성적 2,000점 분배. 광휘 실습만 최대 199점. */
export function CreateCharacter() {
  const createCharacter = useStore((s) => s.createCharacter);
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [birthday, setBirthday] = useState("");
  const [dorm, setDorm] = useState<DormId>("aurora");
  const [vals, setVals] = useState<number[]>(SUBJECTS.map((s) => (s.id === "kw" ? KW_MAX_ALLOC : 225)));
  const sum = vals.reduce((a, b) => a + b, 0);
  const rem = TOTAL_ALLOC - sum;
  const setV = (i: number, v: number) => {
    const max = SUBJECTS[i].id === "kw" ? KW_MAX_ALLOC : TOTAL_ALLOC;
    setVals((a) => a.map((x, k) => (k === i ? Math.max(0, Math.min(max, Math.floor(v) || 0)) : x)));
  };

  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!name.trim()) { toast("이름을 써 주세요."); return; }
    if (rem !== 0) { toast("남은 점수가 0이어야 해요."); return; }
    setBusy(true);
    try {
      const id = await createCharacter({ name: name.trim(), dorm, gender: gender.trim(), height: height.trim(), birthday: birthday.trim(), scores: vals });
      toast(`${name.trim()}(으)로 루체른에 입학했어요.`);
      router.push(`/profile/${id}`);
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="card mt-2 p-5">
        <span className="eyebrow">제국력 828년 · 입학 명부</span>
        <h1 className="mt-1 text-[26px]">캐릭터 등록</h1>
        <p className="mt-2 text-sm text-muted">계정당 캐릭터는 1명이에요. 학부는 직접 고르고, 1학년 필수 9과목에 2,000점을 나눠요.</p>
      </div>

      <SectionHead title="기본" className="mt-6" />
      <div className="card p-5 pb-1">
        <Field label="이름" htmlFor="cc-n"><Input id="cc-n" placeholder="캐릭터 이름" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-x-3">
          <Field label="성별" htmlFor="cc-g"><Input id="cc-g" placeholder="여 / 남 / 기타" value={gender} onChange={(e) => setGender(e.target.value)} /></Field>
          <Field label="키" htmlFor="cc-h"><Input id="cc-h" placeholder="140cm" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
        </div>
        <Field label="생일" htmlFor="cc-b" hint="제국력 817년생. 예: 817.09.21"><Input id="cc-b" placeholder="817.09.21" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></Field>
      </div>

      <SectionHead title="학부" aside="화로가 피운 색" />
      <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="학부">
        {DORMS.map((d) => (
          <button
            key={d.id}
            role="radio"
            aria-checked={dorm === d.id}
            onClick={() => setDorm(d.id)}
            className={cx("flex min-w-0 flex-col items-center gap-1.5 rounded-2xl border bg-surface px-1 py-3 text-center text-[11.5px] transition-colors", dorm === d.id ? "border-gold bg-gold-soft/60" : "border-line hover:border-line-strong")}
          >
            <Crest id={d.id} size={30} />
            <span className={cx(dorm === d.id && "font-semibold")}>{d.name}</span>
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-[12.5px] text-muted">“{DORMS.find((d) => d.id === dorm)!.motto}” · {DORMS.find((d) => d.id === dorm)!.custom}</p>

      <SectionHead title="성적 분배" aside={`9과목 · ${TOTAL_ALLOC.toLocaleString()}점`} />
      <div className="sticky top-[62px] z-10 flex items-center justify-between rounded-xl bg-surface px-4 py-2.5 font-semibold shadow-card">
        <span>남은 점수</span>
        <span className={cx("tnum", rem === 0 ? "text-good" : rem < 0 ? "text-crit" : "")}>{rem.toLocaleString()}</span>
      </div>
      <div className="card mt-3 divide-y divide-line px-4">
        {SUBJECTS.map((s, i) => {
          const v = vals[i]; const g = gIdx(v); const max = s.id === "kw" ? KW_MAX_ALLOC : 600;
          return (
            <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_80px] items-center gap-x-2.5 gap-y-1 py-3">
              <label htmlFor={`al-${s.id}`} className="text-sm">
                {s.name}{s.id === "kw" && <span className="ml-1 text-xs text-muted">최대 {KW_MAX_ALLOC}</span>}
                <span className={cx("lat ml-2 text-[15px]", gradeText[g])}>{GRADES[g].l}</span>
              </label>
              <input id={`al-${s.id}`} type="number" inputMode="numeric" min={0} max={max} value={v} onChange={(e) => setV(i, +e.target.value)} className="field-input min-h-9 w-20 px-2 py-1 text-right" aria-label={`${s.name} 점수`} />
              <input type="range" min={0} max={max} value={v} onChange={(e) => setV(i, +e.target.value)} className="col-span-2 w-full accent-gold" aria-label={`${s.name} 점수 슬라이더`} />
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12.5px] text-muted">광휘 실습은 녹스본 세대의 실기 부진 설정으로 최대 199점(빅스)까지만 넣을 수 있어요. 제출 후 수정은 운영자만 할 수 있어요.</p>
      <Button block className="mt-6" disabled={rem !== 0 || !name.trim() || busy} onClick={submit}>{busy ? "등록 중…" : "루체른에 입학하기"}</Button>
    </>
  );
}
