"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DORMS, GRADES, KW_MAX_ALLOC, STAGES, STAGE_GRADE, SUBJECTS, TOTAL_ALLOC } from "@/lib/constants";
import { LIVE } from "@/lib/firebase";
import { cx, gIdx } from "@/lib/format";
import { toast } from "@/lib/overlay";
import { useStore, type PrivateProfile, type StageProfileIn } from "@/lib/store";
import { ImagePick, KeywordsInput } from "../profile/formBits";
import type { DormId } from "@/lib/types";
import { Crest } from "../ui/identity";
import { Markdown } from "../ui/Markdown";
import { Button, Field, Input, SectionHead, Textarea } from "../ui/primitives";

const gradeText = ["text-crit", "text-warn", "text-muted", "text-good", "text-gold"];
type StageKey = "0" | "1" | "2";

/** 캐릭터 등록: 이름·학부(직접 선택)·성적 2,000점 분배 + 단계별(입학·1차·2차) 두상·전신·소개. */
export function CreateCharacter() {
  const createCharacter = useStore((s) => s.createCharacter);
  const logout = useStore((s) => s.logout);
  const email = useStore((s) => s.session.email);
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [birthday, setBirthday] = useState("");
  const [dorm, setDorm] = useState<DormId>("aurora");
  const [vals, setVals] = useState<number[]>(SUBJECTS.map((s) => (s.id === "kw" ? KW_MAX_ALLOC : 225)));
  const [profiles, setProfiles] = useState<Record<StageKey, StageProfileIn>>({ "0": {}, "1": {}, "2": {} });
  const [priv, setPriv] = useState<PrivateProfile>({ secret: "", trigger: "", growthIf: "" });
  const [nameLatin, setNameLatin] = useState("");
  const [nameNative, setNameNative] = useState("");
  const [openStage, setOpenStage] = useState<StageKey | "">("0");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const sum = vals.reduce((a, b) => a + b, 0);
  const rem = TOTAL_ALLOC - sum;
  const setV = (i: number, v: number) => {
    const max = SUBJECTS[i].id === "kw" ? KW_MAX_ALLOC : TOTAL_ALLOC;
    setVals((a) => a.map((x, k) => (k === i ? Math.max(0, Math.min(max, Math.floor(v) || 0)) : x)));
  };
  const setP = (st: StageKey, k: Exclude<keyof StageProfileIn, "keywords">, v: string | null) => setProfiles((p) => ({ ...p, [st]: { ...p[st], [k]: v } }));
  const submit = async () => {
    if (!name.trim()) { toast("이름을 써 주세요."); return; }
    if (rem !== 0) { toast("남은 점수가 0이어야 해요."); return; }
    setBusy(true);
    try {
      const id = await createCharacter({ name: name.trim(), dorm, gender: gender.trim(), height: height.trim(), birthday: birthday.trim(), scores: vals, profiles: Object.fromEntries(Object.entries(profiles).map(([k, v]) => [k, { ...v, nameLatin: nameLatin.trim(), nameNative: nameNative.trim() }])), private: priv });
      toast(`${name.trim()}(으)로 루체른에 입학했어요.`);
      router.push(`/profile/${id}`);
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  const stageCard = (st: StageKey) => {
    const p = profiles[st]; const i = +st; const open = openStage === st;
    const filled = !!(p.avatar || p.body || p.pers || p.text || p.detail);
    return (
      <div key={st} className="card overflow-hidden">
        <button type="button" onClick={() => setOpenStage(open ? "" : st)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{STAGES[i]} <span className="ml-1 text-xs font-normal text-muted">{STAGE_GRADE[i]}{i === 0 ? " · 11세" : i === 1 ? " · 15세" : ""}</span></span>
            <span className="block text-[12.5px] text-muted">{i === 0 ? "지금 쓰이는 프로필이에요." : "운영자가 이 단계로 전환할 때 공개돼요. 지금 비워 두고 나중에 채워도 돼요."}{filled && " · 작성 중"}</span>
          </span>
          <span className="text-xs text-muted">{open ? "접기" : "열기"}</span>
        </button>
        {open && (
          <div className="border-t border-line px-5 pb-5 pt-4">
            <div className="mb-4 grid grid-cols-2 gap-x-3">
              <Field label="“ 한마디 ”" htmlFor={`pf-q-${st}`} hint={`${(p.quote ?? "").length}/10`}><Input id={`pf-q-${st}`} maxLength={10} value={p.quote ?? ""} onChange={(e) => setP(st, "quote", e.target.value)} /></Field>
              <Field label="[ 캐치프레이즈 ]" htmlFor={`pf-c-${st}`} hint={`${(p.catchphrase ?? "").length}/10`}><Input id={`pf-c-${st}`} maxLength={10} value={p.catchphrase ?? ""} onChange={(e) => setP(st, "catchphrase", e.target.value)} /></Field>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <ImagePick label="두상" compact round value={p.avatar ?? null} onChange={(src) => setP(st, "avatar", src)} />
              <ImagePick label="전신" compact value={p.body ?? null} onChange={(src) => setP(st, "body", src)} />
            </div>
            <Field label="성격 키워드" htmlFor={`pf-kw-${st}`} hint="3개 이상. 쉼표나 Enter로 구분">
              <KeywordsInput id={`pf-kw-${st}`} value={p.keywords ?? []} onChange={(kw) => setProfiles((pp) => ({ ...pp, [st]: { ...pp[st], keywords: kw } }))} />
            </Field>
            <Field label="성격 서술" htmlFor={`pf-pers-${st}`} hint={`공백 미포함 300자 이상 · 현재 ${(p.pers ?? "").replace(/\s/g, "").length}자`}><Textarea id={`pf-pers-${st}`} className="min-h-[160px]" value={p.pers ?? ""} onChange={(e) => setP(st, "pers", e.target.value)} /></Field>
            <Field
              label={<span className="flex items-center justify-between">소개 <button type="button" className="text-xs font-normal text-gold underline-offset-2 hover:underline" onClick={() => setPreview((v) => !v)}>{preview ? "편집" : "미리보기"}</button></span>}
              htmlFor={`pf-text-${st}`}
              hint="마크다운을 쓸 수 있어요: **굵게**, *기울임*, # 제목, > 인용, - 목록, --- 구분선"
            >
              {preview ? <div className="field-input min-h-[140px] text-[15px]"><Markdown text={p.text ?? ""} /></div> : <Textarea id={`pf-text-${st}`} className="min-h-[140px]" value={p.text ?? ""} onChange={(e) => setP(st, "text", e.target.value)} />}
            </Field>
            <Field label="기타" htmlFor={`pf-detail-${st}`} hint="생일, 습관, 마법적 재능, 입학 전 생활 환경 등 자유롭게">
              {preview ? <div className="field-input min-h-[120px] text-[15px]"><Markdown text={p.detail ?? ""} /></div> : <Textarea id={`pf-detail-${st}`} className="min-h-[120px]" value={p.detail ?? ""} onChange={(e) => setP(st, "detail", e.target.value)} />}
            </Field>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-7">
      <div className="min-w-0">
        <div className="card mt-2 p-5">
          <span className="eyebrow">제국력 828년 · 입학 명부</span>
          <h1 className="mt-1 text-[26px]">캐릭터 등록</h1>
          <p className="mt-2 text-sm text-muted">계정당 캐릭터는 1명이에요. 학부는 직접 고르고, 1학년 필수 9과목에 2,000점을 나눠요.</p>
          {LIVE && <button type="button" className="mt-3 text-xs text-muted underline-offset-2 hover:underline" onClick={async () => { await logout(); router.replace("/login"); }}>{email ? `${email} · ` : ""}다른 계정으로 로그인</button>}
        </div>

        <SectionHead title="기본" className="mt-6" />
        <div className="card p-5 pb-1">
          <Field label="이름 (국문)" htmlFor="cc-n" hint="장난식이거나 논란을 빚을 수 있는 이름은 금지"><Input id="cc-n" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="영문 이름" htmlFor="cc-nl"><Input id="cc-nl" value={nameLatin} onChange={(e) => setNameLatin(e.target.value)} /></Field>
            <Field label="모국어 이름 (선택)" htmlFor="cc-nn"><Input id="cc-nn" value={nameNative} onChange={(e) => setNameNative(e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-x-3">
            <Field label="성별" htmlFor="cc-g"><Input id="cc-g" placeholder="여 / 남 / 기타" value={gender} onChange={(e) => setGender(e.target.value)} /></Field>
            <Field label="키" htmlFor="cc-h"><Input id="cc-h" placeholder="140cm" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
            <Field label="생일" htmlFor="cc-b" hint="예: 817.09.21"><Input id="cc-b" placeholder="817.09.21" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></Field>
          </div>
        </div>

        <SectionHead title="학부" aside="화로가 피운 색" />
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="학부">
          {DORMS.map((d) => (
            <button
              key={d.id}
              type="button"
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

        <SectionHead title="성장 단계별 프로필" aside="두상 · 전신 · 소개" />
        <div className="flex flex-col gap-3">{(["0", "1", "2"] as StageKey[]).map(stageCard)}</div>

        <SectionHead title="비공개 프로필" aside="본인과 운영자만 볼 수 있어요" />
        <div className="card border-dashed p-5 pb-1">
          <Field label="트리거 요소" htmlFor="cc-tr" hint="역극에서 피해야 할 요소. 운영진 참고용"><Textarea id="cc-tr" className="min-h-[90px]" value={priv.trigger} onChange={(e) => setPriv({ ...priv, trigger: e.target.value })} /></Field>
          <Field label="비밀 설정" htmlFor="cc-secret" hint="커뮤니티 수위표를 준수해 공개되지 않는 설정. 비워 둘 수 있어요"><Textarea id="cc-secret" className="min-h-[140px]" value={priv.secret} onChange={(e) => setPriv({ ...priv, secret: e.target.value })} /></Field>
          <Field label="성장 IF" htmlFor="cc-gi" hint="차후 성장 방향성. 러닝 중 변경은 운영진과 논의"><Textarea id="cc-gi" className="min-h-[140px]" value={priv.growthIf} onChange={(e) => setPriv({ ...priv, growthIf: e.target.value })} /></Field>
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-[80px] lg:self-start">
        <SectionHead title="성적 분배" aside={`9과목 · ${TOTAL_ALLOC.toLocaleString()}점`} className="lg:mt-2" />
        <div className="sticky top-[62px] z-10 flex items-center justify-between rounded-xl bg-surface px-4 py-2.5 font-semibold shadow-card lg:static">
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
        <Button block className="mt-5" disabled={rem !== 0 || !name.trim() || busy} onClick={submit}>{busy ? "등록 중…" : "루체른에 입학하기"}</Button>
      </div>
    </div>
  );
}
