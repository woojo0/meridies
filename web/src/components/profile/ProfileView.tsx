"use client";
/* eslint-disable @next/next/no-img-element -- 사용자가 올린 이미지는 next/image 최적화 대상이 아니에요. */

import { ArrowRightLeft, BookOpen, Briefcase, Pencil } from "lucide-react";
import { useState } from "react";
import { GRADES, JOB_MS, RATION, SOLIS_LABEL, STAGES, STAGE_GRADE, STUDY_MS, SUBJECTS, dorm as dormOf } from "@/lib/constants";
import { ago, cx, fmtDur, gIdx, money, shrinkImage } from "@/lib/format";
import { useDesktop, useMe, useTick } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { prof, useStore } from "@/lib/store";
import type { Character, Profile, Stage } from "@/lib/types";
import { RoomList } from "../rp/RoomList";
import { InvItemSheet } from "../shop/ItemSheet";
import { Avatar, Crest, DormTag, FullBody } from "../ui/identity";
import { ItemIcon } from "../ui/ItemIcon";
import { Markdown } from "../ui/Markdown";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Chip, ChipRow, Empty, Field, Input, Note, Pill, SectionHead, Tabs, Textarea } from "../ui/primitives";
import { openJobSheet, openStudySheet, openTransferSheet } from "./growthSheets";

type Tab = "profile" | "body" | "grades" | "inv" | "rp";
const gradeText = ["text-crit", "text-warn", "text-muted", "text-good", "text-gold"];
const gradeBar = ["bg-crit", "bg-warn", "bg-muted", "bg-good", "bg-gold"];

export function ProfileView({ c }: { c: Character }) {
  const me = useMe();
  const now = useTick();
  const desktop = useDesktop();
  const stage = useStore((s) => s.data.stage);
  const items = useStore((s) => s.data.items);
  const roomsN = useStore((s) => s.data.rooms.filter((r) => r.members.includes(c.id)).length);
  const openSheet = useOverlay((s) => s.openSheet);
  const [tab, setTab] = useState<Tab>("profile");
  const [pStage, setPStage] = useState<number | null>(null);

  const mine = me?.id === c.id;
  const maxStage = mine ? Math.min(2, stage + 1) : stage;
  const st = pStage ?? stage;
  const { p, stage: shown } = prof(c, st);
  const kwG = gIdx(c.scores.kw);
  const d = dormOf(c.dorm);
  const opt = SUBJECTS.filter((s) => gIdx(c.scores[s.id]) === 4).length;
  const tint = c.dorm === "fifth" ? "var(--glow)" : `color-mix(in srgb, var(--${c.dorm}) 22%, transparent)`;

  const studyLbl = c.studyJob ? (now - c.studyJob.start >= STUDY_MS ? "공부 끝!" : fmtDur(c.studyJob.start + STUDY_MS - now)) : "공부하기";
  const jobLbl = c.job ? (now - c.job.start >= JOB_MS ? "완료!" : fmtDur(c.job.start + JOB_MS - now)) : "아르바이트";

  const actions = mine ? (
    <>
      <Button size="sm" className="tnum px-2" onClick={() => openStudySheet()}><BookOpen size={15} strokeWidth={1.8} />{studyLbl}</Button>
      <Button size="sm" className="tnum px-2" onClick={openJobSheet}><Briefcase size={15} strokeWidth={1.8} />{jobLbl}</Button>
      <Button size="sm" variant="ghost" className="px-2" onClick={() => openTransferSheet()}><ArrowRightLeft size={15} strokeWidth={1.8} />송금</Button>
    </>
  ) : (
    <Button variant="ghost" className="col-span-3" onClick={() => openTransferSheet(c.id)}><ArrowRightLeft size={16} strokeWidth={1.8} />{c.name}에게 송금</Button>
  );

  const stageChips = (
    <ChipRow role="group" aria-label="성장 단계">
      {STAGES.slice(0, maxStage + 1).map((s, i) => (
        <Chip key={s} on={st === i} onClick={() => setPStage(i)}>{s}{i === stage ? " · 현재" : i > stage ? " · 준비 중" : " · 아카이브"}</Chip>
      ))}
    </ChipRow>
  );
  const stageNotes = (
    <>
      {shown !== st && <Note>{STAGES[st]} 프로필이 아직 없어서 {STAGES[shown]} 프로필을 보여주고 있어요.</Note>}
      {st > stage && <Note>운영자가 {STAGES[st]}로 전환하기 전까지 나와 운영자만 볼 수 있어요.</Note>}
    </>
  );
  const kvRows: [string, React.ReactNode][] = [
    ["성별", p.gender || "-"], ["생일", p.birthday || "-"], ["나이", p.age || "-"], ["키", p.height || "-"],
    ["학년", STAGE_GRADE[st]], ["학부", <span key="d" className="inline-flex items-center gap-1.5"><Crest id={c.dorm} size={14} />{d.name}</span>], ["성격", p.pers || "-"],
  ];
  const editBtn = mine && <Button variant="ghost" size="sm" onClick={() => openSheet(<EditProfileSheet stage={st as Stage} />)}><Pencil size={14} strokeWidth={1.8} />{STAGES[st]} 프로필 {c.profiles[st as Stage] ? "수정" : "작성"}</Button>;

  /* ───────── 데스크톱: 왼쪽 전신, 오른쪽 두상+프로필 카드, 아래 기타 정보 ───────── */
  if (desktop) {
    return (
      <div className="mt-2 grid grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="sticky top-[80px] self-start">
          <div className="card relative overflow-hidden p-5">
            <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full blur-3xl" style={{ background: tint }} aria-hidden="true" />
            <div className="relative flex min-h-[420px] items-end justify-center"><FullBody c={c} stage={stage} /></div>
            <div className="relative mt-4 border-t border-line pt-4">
              <div className="flex items-center gap-2"><DormTag c={c} stage={stage} /><Pill tone="gold">{STAGES[prof(c, stage).stage]}</Pill>{mine && <Pill tone="ink">내 캐릭터</Pill>}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[["옵티메", `${opt}개`], ["지갑", money(c.money)], ["역극", `${roomsN}개`]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-sunk/70 px-1 py-2"><span className="block text-[10.5px] tracking-[.08em] text-muted">{k}</span><b className="tnum block font-display text-[14px]">{v}</b></div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">{actions}</div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {stageChips}
          {stageNotes}
          <section className="card relative mt-2 overflow-hidden p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full blur-3xl" style={{ background: tint }} aria-hidden="true" />
            <div className="relative flex items-start gap-6">
              <span className="shrink-0 rounded-full p-[3px] ring-1 ring-line"><Avatar c={c} stage={stage} size="xl" className="size-[104px]" /></span>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-[34px] leading-tight tracking-[.08em]">{c.name}</h1>
                <dl className="mt-4 grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 gap-y-2 text-[15px]">
                  {kvRows.map(([k, v]) => (<div key={k} className="contents"><dt className="text-[12.5px] tracking-[.06em] text-muted">{k}</dt><dd className="m-0">{v}</dd></div>))}
                </dl>
              </div>
            </div>
            <div className="relative mt-7 border-t border-line pt-6 text-[15px]">
              {p.text ? <Markdown text={p.text} /> : <span className="text-muted">아직 소개가 없어요.</span>}
            </div>
            {editBtn && <div className="relative mt-6 flex justify-end">{editBtn}</div>}
          </section>

          <Tabs<Tab> className="mt-6" value={tab === "profile" || tab === "body" ? "grades" : tab} onChange={setTab} tabs={[{ k: "grades", l: "성적" }, { k: "inv", l: "인벤토리" }, { k: "rp", l: "역극" }]} />
          {(tab === "grades" || tab === "profile" || tab === "body") && <GradesPanel c={c} opt={opt} kwG={kwG} />}
          {tab === "inv" && <InvPanel c={c} mine={mine} items={items} now={now} openSheet={openSheet} />}
          {tab === "rp" && <div className="card-flat"><RoomList charId={c.id} /></div>}
        </div>
      </div>
    );
  }

  /* ───────── 모바일 ───────── */
  return (
    <>
      <div className="card relative mt-2 overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full blur-3xl" style={{ background: tint }} aria-hidden="true" />
        <div className="relative flex items-center gap-4">
          <span className="rounded-full p-[3px] ring-1 ring-line"><Avatar c={c} stage={stage} size="lg" className="size-[76px]" /></span>
          <div className="min-w-0">
            <h1 className="text-[26px] leading-tight">{c.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px]">
              <DormTag c={c} stage={stage} />
              <Pill tone="gold">{STAGES[prof(c, stage).stage]} · {STAGE_GRADE[prof(c, stage).stage]}</Pill>
              {mine && <Pill tone="ink">내 캐릭터</Pill>}
            </div>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
          {[["옵티메", `${opt}개`], ["지갑", money(c.money)], ["역극", `${roomsN}개`]].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-sunk/70 px-2 py-2.5"><span className="block text-[11px] tracking-[.08em] text-muted">{k}</span><b className="tnum block font-display text-[15px]">{v}</b></div>
          ))}
        </div>
        <div className="relative mt-3 grid grid-cols-3 gap-2">{actions}</div>
      </div>

      <Tabs<Tab> className="mt-4" value={tab} onChange={setTab} tabs={[{ k: "profile", l: "프로필" }, { k: "body", l: "전신" }, { k: "grades", l: "성적" }, { k: "inv", l: "인벤토리" }, { k: "rp", l: "역극" }]} />

      {tab === "profile" && (
        <>
          {stageChips}
          {stageNotes}
          <div className="card mt-3 p-5">
            <dl className="mb-4 grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-2.5">
              {kvRows.map(([k, v]) => (<div key={k} className="contents"><dt className="pt-0.5 text-[12.5px] tracking-[.04em] text-muted">{k}</dt><dd className="m-0">{v}</dd></div>))}
            </dl>
            <div className="border-t border-line pt-4 text-[15px]">{p.text ? <Markdown text={p.text} /> : <span className="text-muted">아직 소개가 없어요.</span>}</div>
            {editBtn && <div className="mt-5">{editBtn}</div>}
          </div>
          <SectionHead size="sm" title="역극 리스트" aside={`${roomsN}개`} />
          <div className="card-flat"><RoomList charId={c.id} /></div>
        </>
      )}
      {tab === "body" && (
        <div className="card p-5">
          <div className="flex justify-center py-2"><FullBody c={c} stage={stage} /></div>
          <p className="mt-2 text-center text-[12.5px] text-muted">{STAGES[prof(c, stage).stage]} 기준 전신이에요.{mine && " 프로필 수정에서 올릴 수 있어요."}</p>
        </div>
      )}
      {tab === "grades" && <GradesPanel c={c} opt={opt} kwG={kwG} />}
      {tab === "inv" && <InvPanel c={c} mine={mine} items={items} now={now} openSheet={openSheet} />}
      {tab === "rp" && <div className="card-flat"><RoomList charId={c.id} /></div>}
    </>
  );
}

function GradesPanel({ c, opt, kwG }: { c: Character; opt: number; kwG: number }) {
  return (
    <>
      <div className="card mb-3 flex items-center justify-between gap-3 p-4">
        <div>
          <span className="eyebrow">Optime</span>
          <b className="block font-display text-2xl tnum">{opt}<span className="ml-1 text-sm font-normal text-muted">개 · 총점 {Object.values(c.scores).reduce((a, b) => a + b, 0).toLocaleString()}</span></b>
        </div>
        <div className="text-right text-[12.5px] leading-snug text-muted">솔리스 배급<br /><b className="text-ink">하루 {RATION[kwG]}병</b> · {SOLIS_LABEL[kwG]}</div>
      </div>
      <div className="card divide-y divide-line px-4 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:divide-y-0 lg:px-6">
        {SUBJECTS.map((s) => {
          const v = c.scores[s.id]; const g = gIdx(v); const pct = g === 4 ? 100 : v % 100;
          return (
            <div key={s.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 gap-y-1.5 py-3.5 lg:border-b lg:border-line">
              <span className="font-medium">{s.name}</span>
              <span className={cx("lat text-right text-lg font-semibold leading-tight", gradeText[g])}>{GRADES[g].l}</span>
              <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-sunk"><i className={cx("block h-full rounded-full", gradeBar[g])} style={{ width: `${pct}%` }} /></div>
              <span className="col-span-2 text-xs text-muted tnum">{GRADES[g].k} · {v}점{g < 4 ? ` · ${GRADES[g + 1].k}까지 ${100 - (v % 100)}점` : ""}</span>
            </div>
          );
        })}
      </div>
      <Note>광휘 실습 성적에 따라 하루 한 번 받는 솔리스 배급량이 달라져요. 광휘 실습은 이 솔리스로만 연습할 수 있어요.</Note>
    </>
  );
}

function InvPanel({ c, mine, items, now, openSheet }: { c: Character; mine: boolean; items: { id: string; name: string; icon: string }[]; now: number; openSheet: (n: React.ReactNode) => void }) {
  return (
    <>
      <div className="card mb-3 flex items-baseline justify-between p-4"><span className="text-sm text-muted">보유 재화</span><b className="font-display text-xl tnum">{money(c.money)}</b></div>
      {mine && <p className="mb-3 text-[12.5px] text-muted">물건을 누르면 사용하거나 선물할 수 있어요.</p>}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {Object.entries(c.inv).filter(([, n]) => n > 0).map(([id, n]) => {
          const it = items.find((i) => i.id === id); if (!it) return null;
          const inner = (
            <>
              <span className="grid aspect-square w-full place-items-center rounded-xl bg-sunk text-gold transition-colors group-hover:bg-gold-soft"><ItemIcon icon={it.icon} size={30} strokeWidth={1.3} /></span>
              <span className="text-[13px] leading-snug">{it.name}</span>
              <Pill>×{n}</Pill>
            </>
          );
          return mine ? (
            <button key={id} onClick={() => openSheet(<InvItemSheet id={id} />)} className="group flex flex-col items-center gap-1.5 text-center">{inner}</button>
          ) : (
            <div key={id} className="flex flex-col items-center gap-1.5 text-center">{inner}</div>
          );
        })}
        {!Object.values(c.inv).some((n) => n > 0) && <Empty className="col-span-full">아직 가진 물건이 없어요.</Empty>}
      </div>
      {mine && (
        <>
          <SectionHead size="sm" title="거래 내역" aside="나만 보여요" />
          <div className="card-flat divide-y divide-line px-4 text-[13px]">
            {c.tx.slice(0, 30).map((t, i) => (
              <div key={i} className="flex min-h-11 items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1"><span className="block">{t.text}</span><span className="block text-xs text-muted">{ago(t.at, now)}</span></span>
                <b className={cx("tnum", t.amt >= 0 ? "text-good" : "text-crit")}>{t.amt >= 0 ? "+" : "−"}{money(Math.abs(t.amt))}</b>
              </div>
            ))}
            {!c.tx.length && <Empty>거래 내역이 없어요.</Empty>}
          </div>
        </>
      )}
    </>
  );
}

/* ── 단계별 프로필 작성/수정 (두상·전신 업로드, 마크다운 소개) ── */
function EditProfileSheet({ stage }: { stage: Stage }) {
  const me = useMe();
  const saveProfile = useStore((s) => s.saveProfile);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const base: Profile = me ? (me.profiles[stage] ?? { ...prof(me, stage).p }) : { gender: "", age: "", height: "", pers: "", text: "" };
  const [p, setP] = useState<Profile>(base);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  if (!me) return null;
  const set = (k: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setP((x) => ({ ...x, [k]: e.target.value }));
  const pick = (k: "avatar" | "body") => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = ""; if (!f) return;
    try { const src = await shrinkImage(f); setP((x) => ({ ...x, [k]: src })); } catch { toast("이미지를 읽지 못했어요."); }
  };
  return (
    <>
      <SheetTitle>{STAGES[stage]} 프로필</SheetTitle>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong p-3 text-center text-xs text-muted hover:border-gold">
          {p.avatar ? <img src={p.avatar} alt="두상" className="size-16 rounded-full object-cover" /> : <span className="grid size-16 place-items-center rounded-full bg-sunk">두상</span>}
          두상 올리기<input type="file" accept="image/*" hidden onChange={pick("avatar")} />
        </label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong p-3 text-center text-xs text-muted hover:border-gold">
          {p.body ? <img src={p.body} alt="전신" className="h-16 w-auto rounded-lg object-cover" /> : <span className="grid h-16 w-10 place-items-center rounded-lg bg-sunk">전신</span>}
          전신 올리기<input type="file" accept="image/*" hidden onChange={pick("body")} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="성별" htmlFor="pf-g"><Input id="pf-g" value={p.gender} onChange={set("gender")} /></Field>
        <Field label="생일" htmlFor="pf-b"><Input id="pf-b" placeholder="817.09.21" value={p.birthday ?? ""} onChange={set("birthday")} /></Field>
        <Field label="나이" htmlFor="pf-a"><Input id="pf-a" value={p.age} onChange={set("age")} /></Field>
        <Field label="키" htmlFor="pf-h"><Input id="pf-h" value={p.height} onChange={set("height")} /></Field>
      </div>
      <Field label="성격" htmlFor="pf-p"><Input id="pf-p" value={p.pers} onChange={set("pers")} /></Field>
      <Field
        label={<span className="flex items-center justify-between">소개 <button type="button" className="text-xs font-normal text-gold underline-offset-2 hover:underline" onClick={() => setPreview((v) => !v)}>{preview ? "편집" : "미리보기"}</button></span>}
        htmlFor="pf-t"
        hint="마크다운을 쓸 수 있어요: **굵게**, *기울임*, # 제목, > 인용, - 목록, --- 구분선"
      >
        {preview ? <div className="field-input min-h-[160px] text-[15px]"><Markdown text={p.text} /></div> : <Textarea id="pf-t" className="min-h-[160px]" value={p.text} onChange={set("text")} />}
      </Field>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button disabled={busy} onClick={async () => { setBusy(true); try { await saveProfile(stage, p); closeSheet(); toast("프로필을 저장했어요."); } catch (e) { toast((e as Error).message); } finally { setBusy(false); } }}>{busy ? "저장 중…" : "저장"}</Button>
      </SheetActions>
    </>
  );
}
