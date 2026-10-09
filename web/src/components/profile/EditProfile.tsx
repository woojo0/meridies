"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { STAGES, STAGE_GRADE } from "@/lib/constants";
import { useMe } from "@/lib/hooks";
import { toast } from "@/lib/overlay";
import { prof, useStore, type PrivateProfile } from "@/lib/store";
import type { Character, Profile, Stage } from "@/lib/types";
import { Markdown } from "../ui/Markdown";
import { Button, Chip, ChipRow, Empty, Field, Input, Note, SectionHead, Textarea } from "../ui/primitives";
import { ImagePick, KeywordsInput } from "./formBits";
import { Dropdown } from "../ui/Dropdown";

/** 프로필 수정 페이지: /profile/[id]/edit?stage=N. 본인(또는 운영자)만. */
export function EditProfile() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const me = useMe();
  const admin = useStore((s) => s.session.admin);
  const communityStage = useStore((s) => s.data.stage);
  const c = useStore((s) => s.data.chars.find((x) => x.id === id));
  const loadPrivate = useStore((s) => s.loadPrivate);
  const loadPrivateProfiles = useStore((s) => s.loadPrivateProfiles);

  const mine = me?.id === id;
  const maxStage = 2;
  const initStage = Math.max(0, Math.min(maxStage, Number(sp.get("stage") ?? communityStage))) as Stage;
  const [stage, setStage] = useState<Stage>(initStage);
  const [priv, setPriv] = useState<PrivateProfile | null>(null);
  const [privProfiles, setPrivProfiles] = useState<Partial<Record<Stage, Profile>> | null>(null);
  useEffect(() => {
    if (!c || !(mine || admin)) return;
    loadPrivate(c.id).then(setPriv).catch(() => setPriv({ secret: "", trigger: "", growthIf: "" }));
    loadPrivateProfiles(c.id).then(setPrivProfiles).catch(() => setPrivProfiles({}));
  }, [c, mine, admin, loadPrivate, loadPrivateProfiles]);

  if (!c) return <Empty className="py-16">캐릭터를 찾을 수 없어요.</Empty>;
  if (!(mine || admin)) return <Empty className="py-16">본인 캐릭터만 수정할 수 있어요.</Empty>;
  if (priv === null || privProfiles === null) return null;
  const merged: Character = { ...c, profiles: { ...c.profiles, ...privProfiles } };
  return <EditForm key={stage} c={merged} stage={stage} setStage={setStage} maxStage={maxStage} communityStage={communityStage} priv={priv} setPriv={setPriv} />;
}

function EditForm({ c, stage, setStage, maxStage, communityStage, priv, setPriv }: { c: Character; stage: Stage; setStage: (s: Stage) => void; maxStage: number; communityStage: number; priv: PrivateProfile; setPriv: (p: PrivateProfile) => void }) {
  const router = useRouter();
  const saveProfile = useStore((s) => s.saveProfile);
  const savePrivate = useStore((s) => s.savePrivate);
  const renameCharacter = useStore((s) => s.renameCharacter);
  const [name, setName] = useState(c.name);
  const [p, setP] = useState<Profile>(() => {
    const base = c.profiles[stage] ?? { ...prof(c, stage).p, avatar: null, body: null, age: ["11세", "15세", "성인"][stage] };
    return { ...base, extra: base.extra ?? [], keywords: base.keywords ?? [] };
  });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP((x) => ({ ...x, [k]: e.target.value }));
  const extras = p.extra ?? [];
  const setExtra = (i: number, k: "k" | "v", val: string) => setP((x) => ({ ...x, extra: (x.extra ?? []).map((e, j) => (j === i ? { ...e, [k]: val } : e)) }));

  const save = async () => {
    if ((p.quote ?? "").length > 10 || (p.catchphrase ?? "").length > 10) { toast("한마디와 캐치프레이즈는 10자 이내예요."); return; }
    const nm = name.trim();
    if (!nm || nm.length > 20) { toast("이름은 1~20자예요."); return; }
    setBusy(true);
    try {
      if (nm !== c.name) await renameCharacter(c.id, nm);
      await saveProfile(stage, { ...p, extra: extras.filter((e) => e.k.trim() || e.v.trim()) }, c.id);
      try { await savePrivate(c.id, priv); } catch { toast("프로필은 저장했지만 비공개 항목은 저장하지 못했어요(권한 규칙 배포 필요)."); router.push(`/profile/${c.id}`); return; }
      toast("프로필을 저장했어요.");
      router.push(`/profile/${c.id}`);
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

  const md = (v: string, id: string, min: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void) =>
    preview ? <div className={`field-input ${min} text-[15px]`}><Markdown text={v} /></div> : <Textarea id={id} className={min} value={v} onChange={onChange} />;

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-7">
      <div className="min-w-0">
        <div className="card mt-2 p-5">
          <span className="eyebrow">{c.name}</span>
          <h1 className="mt-1 text-[24px]">프로필 수정</h1>
          <ChipRow className="mt-3" role="group" aria-label="성장 단계">
            {STAGES.slice(0, maxStage + 1).map((s, i) => (
              <Chip key={s} on={stage === i} onClick={() => setStage(i as Stage)}>{s} · {STAGE_GRADE[i]}{i === communityStage ? " · 현재" : i > communityStage ? " · 준비 중" : ""}</Chip>
            ))}
          </ChipRow>
          {stage > communityStage && <Note>운영자가 {STAGES[stage]}로 전환하기 전까지 나와 운영자만 볼 수 있어요(비공개 저장). 미리 써 두면 전환 때 자동으로 공개돼요.</Note>}
        </div>

        <SectionHead title="한 줄" aside="각 10자 이내" />
        <div className="card p-5 pb-1">
          <Field label="[ 캐치프레이즈 ]" htmlFor="pf-c" hint={`${(p.catchphrase ?? "").length}/10`}><Input id="pf-c" maxLength={10} value={p.catchphrase ?? ""} onChange={set("catchphrase")} /></Field>
          <Field label="“ 한마디 ”" htmlFor="pf-q" hint={`${(p.quote ?? "").length}/10`}><Input id="pf-q" maxLength={10} value={p.quote ?? ""} onChange={set("quote")} /></Field>
        </div>

        <SectionHead title="외관" aside="두상 · 전신" />
        <div className="grid grid-cols-2 gap-3">
          <ImagePick label="두상" value={p.avatar ?? null} round onChange={(src) => setP((x) => ({ ...x, avatar: src }))} />
          <ImagePick label="전신" value={p.body ?? null} onChange={(src) => setP((x) => ({ ...x, body: src }))} />
        </div>

        <SectionHead title="기본 정보" />
        <div className="card p-5 pb-1">
          <div className="grid grid-cols-[minmax(0,1fr)_200px] gap-x-3">
            <Field label="이름 (국문)" htmlFor="pf-name" hint="모든 단계에 같이 적용돼요. 1~20자"><Input id="pf-name" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="이름 글자 크기 (PC)" htmlFor="pf-ns" hint="긴 이름은 작게">
              <Dropdown id="pf-ns" value={String(p.nameSize ?? 32)} onChange={(v) => setP((x) => ({ ...x, nameSize: Number(v) }))} options={[{ v: "22", l: "아주 작게 · 22px" }, { v: "26", l: "작게 · 26px" }, { v: "32", l: "보통 · 32px" }, { v: "40", l: "크게 · 40px" }, { v: "48", l: "아주 크게 · 48px" }]} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="영문 이름" htmlFor="pf-nl"><Input id="pf-nl" value={p.nameLatin ?? ""} onChange={set("nameLatin")} /></Field>
            <Field label="모국어 이름 (선택)" htmlFor="pf-nn"><Input id="pf-nn" value={p.nameNative ?? ""} onChange={set("nameNative")} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-x-3">
            <Field label="성별" htmlFor="pf-g"><Input id="pf-g" value={p.gender} onChange={set("gender")} /></Field>
            <Field label="키" htmlFor="pf-h"><Input id="pf-h" value={p.height} onChange={set("height")} /></Field>
            <Field label="생일" htmlFor="pf-b"><Input id="pf-b" value={p.birthday ?? ""} onChange={set("birthday")} /></Field>
          </div>
          <Field label="나이" htmlFor="pf-a" hint="입학 단계는 11세로 통일"><Input id="pf-a" value={p.age} onChange={set("age")} /></Field>
          <div className="mb-4">
            <span className="mb-1.5 block text-[13px] font-semibold text-muted">추가 항목 <span className="font-normal">· 포지션, 직업, 좋아하는 것 등</span></span>
            <div className="flex flex-col gap-2">
              {extras.map((e, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.6fr_auto] gap-2">
                  <Input value={e.k} onChange={(ev) => setExtra(i, "k", ev.target.value)} aria-label={`추가 항목 ${i + 1} 이름`} />
                  <Input value={e.v} onChange={(ev) => setExtra(i, "v", ev.target.value)} aria-label={`추가 항목 ${i + 1} 내용`} />
                  <button type="button" aria-label="항목 빼기" onClick={() => setP((x) => ({ ...x, extra: (x.extra ?? []).filter((_, j) => j !== i) }))} className="grid size-11 place-items-center rounded-full text-muted hover:bg-sunk hover:text-crit">×</button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" className="self-start" disabled={extras.length >= 12} onClick={() => setP((x) => ({ ...x, extra: [...(x.extra ?? []), { k: "", v: "" }] }))}>+ 항목 추가</Button>
            </div>
          </div>
        </div>

        <SectionHead title="성격" aside={<button type="button" className="text-gold underline-offset-2 hover:underline" onClick={() => setPreview((v) => !v)}>{preview ? "편집" : "미리보기"}</button>} />
        <div className="card p-5 pb-1">
          <Field label="키워드" htmlFor="pf-kw" hint="3개 이상. 쉼표나 Enter로 구분">
            <KeywordsInput id="pf-kw" value={p.keywords ?? []} onChange={(kw) => setP((x) => ({ ...x, keywords: kw }))} />
          </Field>
          <Field label="서술" htmlFor="pf-p" hint={`공백 미포함 300자 이상 · 현재 ${(p.pers ?? "").replace(/\s/g, "").length}자`}>
            {md(p.pers, "pf-p", "min-h-[200px]", set("pers"))}
          </Field>
        </div>

        <SectionHead title="소개 · 기타" />
        <div className="card p-5 pb-1">
          <Field label="소개" htmlFor="pf-t" hint="마크다운: **굵게**, *기울임*, # 제목, > 인용, - 목록, --- 구분선">
            {md(p.text, "pf-t", "min-h-[200px]", set("text"))}
          </Field>
          <Field label="기타" htmlFor="pf-d" hint="생일, 습관, 마법적 재능, 입학 전 생활 환경 등 자유롭게">
            {md(p.detail ?? "", "pf-d", "min-h-[220px]", set("detail"))}
          </Field>
        </div>

        <SectionHead title="비공개 프로필" aside="본인과 운영자만 볼 수 있어요" />
        <div className="card border-dashed p-5 pb-1">
          <Field label="트리거 요소" htmlFor="pf-tr" hint="역극에서 피해야 할 요소. 운영진 참고용">
            {md(priv.trigger, "pf-tr", "min-h-[100px]", (e) => setPriv({ ...priv, trigger: e.target.value }))}
          </Field>
          <Field label="비밀 설정" htmlFor="pf-secret" hint="커뮤니티 수위표를 준수해 공개되지 않는 설정. 비워 둘 수 있어요">
            {md(priv.secret, "pf-secret", "min-h-[160px]", (e) => setPriv({ ...priv, secret: e.target.value }))}
          </Field>
          <Field label="성장 IF" htmlFor="pf-gi" hint="차후 성장 방향성. 러닝 중 변경은 운영진과 논의">
            {md(priv.growthIf, "pf-gi", "min-h-[160px]", (e) => setPriv({ ...priv, growthIf: e.target.value }))}
          </Field>
        </div>
      </div>

      <div className="min-w-0 lg:sticky lg:top-[80px] lg:self-start">
        <div className="card mt-2 p-5 lg:mt-[52px]">
          <h2 className="text-[16px]">{STAGES[stage]} 프로필</h2>
          <p className="mt-1.5 text-[13px] text-muted">이미지는 1080px로 줄여 저장돼요. 두상이 없으면 실루엣이 보여요.</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button block disabled={busy} onClick={save}>{busy ? "저장 중…" : "저장"}</Button>
            <Button block variant="ghost" onClick={() => router.push(`/profile/${c.id}`)}>취소</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
