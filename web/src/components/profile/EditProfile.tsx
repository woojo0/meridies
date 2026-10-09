"use client";
/* eslint-disable @next/next/no-img-element -- 사용자가 올린 미리보기 이미지 */

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { STAGES, STAGE_GRADE } from "@/lib/constants";
import { shrinkImage } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import { toast } from "@/lib/overlay";
import { prof, useStore } from "@/lib/store";
import type { Character, Profile, Stage } from "@/lib/types";
import { Markdown } from "../ui/Markdown";
import { Button, Chip, ChipRow, Empty, Field, Input, Note, SectionHead, Textarea } from "../ui/primitives";

/** 프로필 수정 페이지: /profile/[id]/edit?stage=N. 본인(또는 운영자)만. */
export function EditProfile() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const me = useMe();
  const admin = useStore((s) => s.session.admin);
  const communityStage = useStore((s) => s.data.stage);
  const c = useStore((s) => s.data.chars.find((x) => x.id === id));
  const saveProfile = useStore((s) => s.saveProfile);
  const loadSecret = useStore((s) => s.loadSecret);
  const saveSecret = useStore((s) => s.saveSecret);

  const mine = me?.id === id;
  const maxStage = Math.min(2, communityStage + 1);
  const initStage = Math.max(0, Math.min(maxStage, Number(sp.get("stage") ?? communityStage))) as Stage;
  const [stage, setStage] = useState<Stage>(initStage);
  const [secret, setSecret] = useState<string | null>(null);
  useEffect(() => {
    if (!c || !(mine || admin)) return;
    loadSecret(c.id).then((s) => setSecret(s ?? "")).catch(() => setSecret(""));
  }, [c, mine, admin, loadSecret]);

  if (!c) return <Empty className="py-16">캐릭터를 찾을 수 없어요.</Empty>;
  if (!(mine || admin)) return <Empty className="py-16">본인 캐릭터만 수정할 수 있어요.</Empty>;
  return <EditForm key={stage} c={c} stage={stage} setStage={setStage} maxStage={maxStage} communityStage={communityStage} secret={secret} setSecret={setSecret} />;
}

function EditForm({ c, stage, setStage, maxStage, communityStage, secret, setSecret }: { c: Character; stage: Stage; setStage: (s: Stage) => void; maxStage: number; communityStage: number; secret: string | null; setSecret: (s: string) => void }) {
  const router = useRouter();
  const saveProfile = useStore((s) => s.saveProfile);
  const saveSecret = useStore((s) => s.saveSecret);
  // 단계별 저장값(없으면 이전 단계 복사)으로 시작해요. 단계가 바뀌면 key로 다시 마운트돼요.
  const [p, setP] = useState<Profile | null>(() => {
    const base = c.profiles[stage] ?? { ...prof(c, stage).p, avatar: null, body: null, age: ["11세", "15세", "성인"][stage] };
    return { ...base, extra: base.extra ?? [] };
  });
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!p) return null;

  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP((x) => (x ? { ...x, [k]: e.target.value } : x));
  const pick = (k: "avatar" | "body") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    try { const src = await shrinkImage(f); setP((x) => (x ? { ...x, [k]: src } : x)); } catch { toast("이미지를 읽지 못했어요."); }
  };
  const extras = p.extra ?? [];
  const setExtra = (i: number, k: "k" | "v", val: string) => setP((x) => (x ? { ...x, extra: (x.extra ?? []).map((e, j) => (j === i ? { ...e, [k]: val } : e)) } : x));

  const save = async () => {
    setBusy(true);
    try {
      await saveProfile(stage, { ...p, extra: extras.filter((e) => e.k.trim() || e.v.trim()) }, c.id);
      if (secret !== null) await saveSecret(c.id, secret);
      toast("프로필을 저장했어요.");
      router.push(`/profile/${c.id}`);
    } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
  };

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
          {stage > communityStage && <Note>운영자가 {STAGES[stage]}로 전환하기 전까지 나와 운영자만 볼 수 있어요. 미리 써 두면 전환 때 바로 바뀌어요.</Note>}
        </div>

        <SectionHead title="이미지" aside="두상 · 전신" />
        <div className="grid grid-cols-2 gap-3">
          <label className="card flex cursor-pointer flex-col items-center gap-2 p-5 text-center text-xs text-muted hover:border-gold">
            {p.avatar ? <img src={p.avatar} alt="두상" className="size-24 rounded-full object-cover" /> : <span className="grid size-24 place-items-center rounded-full bg-sunk">두상</span>}
            두상 {p.avatar ? "바꾸기" : "올리기"}
            <input type="file" accept="image/*" hidden onChange={pick("avatar")} />
          </label>
          <label className="card flex cursor-pointer flex-col items-center gap-2 p-5 text-center text-xs text-muted hover:border-gold">
            {p.body ? <img src={p.body} alt="전신" className="h-24 w-auto rounded-lg object-cover" /> : <span className="grid h-24 w-14 place-items-center rounded-lg bg-sunk">전신</span>}
            전신 {p.body ? "바꾸기" : "올리기"}
            <input type="file" accept="image/*" hidden onChange={pick("body")} />
          </label>
        </div>

        <SectionHead title="기본 정보" />
        <div className="card p-5 pb-1">
          <div className="grid grid-cols-3 gap-x-3">
            <Field label="성별" htmlFor="pf-g"><Input id="pf-g" value={p.gender} onChange={set("gender")} /></Field>
            <Field label="키" htmlFor="pf-h"><Input id="pf-h" value={p.height} onChange={set("height")} /></Field>
            <Field label="생일" htmlFor="pf-b"><Input id="pf-b" placeholder="817.09.21" value={p.birthday ?? ""} onChange={set("birthday")} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="나이" htmlFor="pf-a"><Input id="pf-a" value={p.age} onChange={set("age")} /></Field>
            <Field label="성격" htmlFor="pf-p"><Input id="pf-p" value={p.pers} onChange={set("pers")} /></Field>
          </div>
          <div className="mb-4">
            <span className="mb-1.5 block text-[13px] font-semibold text-muted">추가 항목 <span className="font-normal">· 포지션, 직업, 좋아하는 것 등</span></span>
            <div className="flex flex-col gap-2">
              {extras.map((e, i) => (
                <div key={i} className="grid grid-cols-[1fr_1.6fr_auto] gap-2">
                  <Input placeholder="항목" value={e.k} onChange={(ev) => setExtra(i, "k", ev.target.value)} aria-label={`추가 항목 ${i + 1} 이름`} />
                  <Input placeholder="내용" value={e.v} onChange={(ev) => setExtra(i, "v", ev.target.value)} aria-label={`추가 항목 ${i + 1} 내용`} />
                  <button type="button" aria-label="항목 빼기" onClick={() => setP((x) => (x ? { ...x, extra: (x.extra ?? []).filter((_, j) => j !== i) } : x))} className="grid size-11 place-items-center rounded-full text-muted hover:bg-sunk hover:text-crit">×</button>
                </div>
              ))}
              <Button type="button" variant="ghost" size="sm" className="self-start" disabled={extras.length >= 12} onClick={() => setP((x) => (x ? { ...x, extra: [...(x.extra ?? []), { k: "", v: "" }] } : x))}>+ 항목 추가</Button>
            </div>
          </div>
        </div>

        <SectionHead title="소개" aside={<button type="button" className="text-gold underline-offset-2 hover:underline" onClick={() => setPreview((v) => !v)}>{preview ? "편집" : "미리보기"}</button>} />
        <div className="card p-5 pb-1">
          <Field label="소개" htmlFor="pf-t" hint="마크다운을 쓸 수 있어요: **굵게**, *기울임*, # 제목, > 인용, - 목록, --- 구분선">
            {preview ? <div className="field-input min-h-[200px] text-[15px]"><Markdown text={p.text} /></div> : <Textarea id="pf-t" className="min-h-[200px]" value={p.text} onChange={set("text")} />}
          </Field>
          <Field label="세부 정보" htmlFor="pf-d" hint="관계, 설정 등 긴 내용. 비워 두면 표시되지 않아요.">
            {preview ? <div className="field-input min-h-[200px] text-[15px]"><Markdown text={p.detail ?? ""} /></div> : <Textarea id="pf-d" className="min-h-[240px]" value={p.detail ?? ""} onChange={set("detail")} />}
          </Field>
        </div>

        <SectionHead title="비밀 설정" aside="운영자만 볼 수 있어요" />
        <div className="card p-5 pb-1">
          <Field label="운영자에게만 보이는 설정" htmlFor="pf-secret" hint="다른 멤버에게는 보이지 않아요. 단계와 상관없이 하나예요. 마크다운 가능.">
            {secret === null ? <div className="field-input min-h-[120px] text-muted">불러오는 중…</div> : preview ? <div className="field-input min-h-[120px] text-[15px]"><Markdown text={secret} /></div> : <Textarea id="pf-secret" className="min-h-[140px]" value={secret} onChange={(e) => setSecret(e.target.value)} />}
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
