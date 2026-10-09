"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { DORMS, STAGES, SUBJECTS, dorm as dormOf, subject } from "@/lib/constants";
import { ago } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { Stage, SubjectId } from "@/lib/types";
import { Crest } from "../ui/identity";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Empty, Field, Input, Segmented, Select, Textarea } from "../ui/primitives";

function Card({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <section className="card mt-3 p-5">
      <h3 className="mb-1 text-[17px]">{title}</h3>
      {desc && <p className="mb-3.5 text-[13.5px] leading-relaxed text-muted">{desc}</p>}
      {children}
    </section>
  );
}

/** 운영자 도구. 모바일에서도 모든 작업이 가능하게. */
export function AdminView() {
  const now = useNow();
  const st = useStore();
  const { data } = st;
  const openSheet = useOverlay((s) => s.openSheet);
  const nxt = data.stage + 1;
  const missing = nxt <= 2 ? data.chars.filter((c) => !c.profiles[nxt as Stage]) : [];
  const r = data.results;
  const nameOf = (id: string) => data.chars.find((c) => c.id === id)?.name ?? "";

  const [adj, setAdj] = useState({ c: data.chars[0]?.id ?? "", t: "kw" as SubjectId | "money", n: "10", why: "" });
  const [notice, setNotice] = useState(data.notice?.text ?? "");

  return (
    <>
      <Card title="성장 단계" desc="바꾸면 커뮤 전체의 프로필·두상이 그 단계로 바뀌어요. 이미 쓴 글은 작성 당시 모습을 유지하고, 기숙사 역극방은 새로 열려요.">
        <Segmented
          options={STAGES.map((s, i) => ({ v: i, l: s }))}
          value={data.stage}
          onChange={(s) => { if (s === data.stage) return; openSheet(<StageSheet s={s as Stage} />); }}
        />
        {nxt <= 2 && <p className="mt-3 text-sm">{STAGES[nxt]} 프로필 미등록: <b>{missing.length}명</b>{missing.length ? ` (${missing.map((c) => c.name).join(", ")})` : ""}</p>}
      </Card>

      <Card title="학기 마감" desc="캐릭터별 옵티메 수를 세어 수석을 정하고, 학부별로 집계해요. 제5학부는 관례에 따라 순위표에 오르지 않아요.">
        <Button size="sm" onClick={() => { st.semester(); toast("집계했어요."); }}>지금 집계하기</Button>
        {r && (
          <div className="mt-3.5">
            <p className="mb-1.5 text-sm"><b>수석:</b> {r.top.map(nameOf).join(", ") || "없음"} {r.topN ? `(옵티메 ${r.topN}개)` : ""}</p>
            <div className="divide-y divide-line rounded-xl bg-sunk/60 px-3">
              {r.dorms.map((x, i) => (
                <div key={x.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-5 tnum">{i + 1}</span><Crest id={x.id} size={22} /><span className="flex-1 font-semibold">{dormOf(x.id).name}</span><span className="tnum">옵티메 {x.n}</span>
                </div>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="mt-2.5" onClick={() => { st.postResults(); toast("타임라인 공지로 올렸어요."); }}>공지로 올리기</Button>
          </div>
        )}
      </Card>

      <Card title="성적·재화 조정" desc="이벤트 보상이나 정정에 써요. 조정하면 해당 캐릭터에게 알림이 가고 운영 기록에 남아요.">
        <Field label="캐릭터" htmlFor="ad-c"><Select id="ad-c" value={adj.c} onChange={(e) => setAdj({ ...adj, c: e.target.value })}>{data.chars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <div className="grid grid-cols-[1fr_110px] gap-2.5">
          <Field label="항목" htmlFor="ad-t"><Select id="ad-t" value={adj.t} onChange={(e) => setAdj({ ...adj, t: e.target.value as SubjectId | "money" })}>{SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}<option value="money">재화 (그로셴)</option></Select></Field>
          <Field label="증감" htmlFor="ad-n"><Input id="ad-n" type="number" inputMode="numeric" value={adj.n} onChange={(e) => setAdj({ ...adj, n: e.target.value })} /></Field>
        </div>
        <Field label="사유" htmlFor="ad-r"><Input id="ad-r" placeholder="예: 등불 축제 보상" value={adj.why} onChange={(e) => setAdj({ ...adj, why: e.target.value })} /></Field>
        <Button size="sm" onClick={() => { const n = parseInt(adj.n, 10); if (!n) { toast("증감 값을 넣어 주세요."); return; } const l = st.adjust(adj.c, adj.t, n, adj.why.trim()); toast(`${nameOf(adj.c)}: ${l}`); }}>적용하기</Button>
      </Card>

      <Card title="운영·아이템 기록">
        {data.adminLog.length ? (
          <div className="divide-y divide-line text-[13px]">{data.adminLog.map((x, i) => <div key={i} className="py-2"><span className="block">{x.text}</span><span className="text-xs text-muted">{ago(x.at, now)}</span></div>)}</div>
        ) : <Empty className="py-2 text-left">지각사유서처럼 운영자 확인이 필요한 아이템을 쓰면 여기에 쌓여요.</Empty>}
      </Card>

      <Card title="공지 수정">
        <Field label="공지 내용" htmlFor="notice-in"><Textarea id="notice-in" value={notice} onChange={(e) => setNotice(e.target.value)} /></Field>
        <Button size="sm" onClick={() => { st.saveNotice(notice.trim()); toast("공지를 저장했어요."); }}>공지 저장</Button>
      </Card>

      <Card title="상점 아이템 추가" desc="등록하면 바로 상점에 나와요.">
        <Button size="sm" onClick={() => openSheet(<AddItemSheet />)}><Plus size={16} /> 아이템 추가</Button>
      </Card>

      <Card title="아르바이트 목록" desc="9종. 성공률은 해당 과목 등급(니힐/빅스/사티스/베네/옵티메) 순서예요.">
        <div className="divide-y divide-line">
          {data.jobs.map((j) => (
            <div key={j.id} className="py-2.5">
              <span className="block font-semibold">{j.name}</span>
              <span className="block text-[13px] text-muted">{subject(j.subject).name} · 성공률 {j.rates.join("/")}% · 보상 {j.win[0]}~{j.win[1]}그로셴</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="학부" desc="학부 배정은 플레이어가 프로필을 쓸 때 직접 고르고, 기숙사 배정도 그 선택을 따라요.">
        <div className="grid grid-cols-5 gap-1.5">
          {DORMS.map((d) => (
            <div key={d.id} className="flex flex-col items-center gap-1 rounded-xl bg-sunk/60 py-3 text-center text-[11.5px]">
              <Crest id={d.id} size={28} />{d.name}<span className="text-muted tnum">{data.chars.filter((c) => c.dorm === d.id).length}명</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function StageSheet({ s }: { s: Stage }) {
  const setStage = useStore((x) => x.setStage);
  const closeSheet = useOverlay((x) => x.closeSheet);
  return (
    <>
      <SheetTitle>{STAGES[s]}로 전환할까요?</SheetTitle>
      <p>커뮤 전체의 프로필과 두상이 {STAGES[s]} 기준으로 바뀌어요. 프로필이 없는 캐릭터는 이전 단계 프로필을 그대로 써요.{s === 2 && " 2차 성장 전환 때 펜팔의 정체가 공개돼요."}</p>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button onClick={() => { setStage(s); closeSheet(); toast(`커뮤가 ${STAGES[s]} 단계가 되었어요.`); }}>전환하기</Button>
      </SheetActions>
    </>
  );
}

function AddItemSheet() {
  const addItem = useStore((x) => x.addItem);
  const closeSheet = useOverlay((x) => x.closeSheet);
  const [f, setF] = useState({ name: "", price: "10", cat: "잡화", stock: "", desc: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <SheetTitle>아이템 추가</SheetTitle>
      <Field label="이름" htmlFor="it-n"><Input id="it-n" value={f.name} onChange={set("name")} /></Field>
      <div className="grid grid-cols-2 gap-x-3">
        <Field label="가격 (그로셴)" htmlFor="it-p"><Input id="it-p" type="number" min={1} value={f.price} onChange={set("price")} /></Field>
        <Field label="수량 (비우면 무제한)" htmlFor="it-s"><Input id="it-s" type="number" min={0} value={f.stock} onChange={set("stock")} /></Field>
      </div>
      <Field label="분류" htmlFor="it-c"><Input id="it-c" value={f.cat} onChange={set("cat")} /></Field>
      <Field label="설명" htmlFor="it-d"><Textarea id="it-d" className="min-h-[70px]" value={f.desc} onChange={set("desc")} /></Field>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button onClick={() => { const p = parseInt(f.price, 10); if (!f.name.trim() || !(p > 0)) { toast("이름과 가격을 넣어 주세요."); return; } addItem({ name: f.name.trim(), price: p, cat: f.cat.trim(), stock: f.stock === "" ? -1 : +f.stock, desc: f.desc.trim() }); closeSheet(); toast("상점에 등록했어요."); }}>등록</Button>
      </SheetActions>
    </>
  );
}
