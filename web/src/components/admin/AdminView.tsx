"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { DORMS, STAGES, SUBJECTS, dorm as dormOf, subject } from "@/lib/constants";
import { ago } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { LIVE } from "@/lib/firebase";
import { L as liveApi } from "@/lib/live";
import { useStore } from "@/lib/store";
import type { Stage, SubjectId } from "@/lib/types";
import { Crest } from "../ui/identity";
import { SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Empty, Field, Input, Segmented, Textarea } from "../ui/primitives";
import { Dropdown } from "../ui/Dropdown";
import { CharactersGrid } from "./CharactersGrid";
import { ItemIcon } from "../ui/ItemIcon";
import { money } from "@/lib/format";
import type { Item } from "@/lib/types";
import { HANDBOOK, RULES, WORLD } from "@/lib/docs";
import { watchDoc } from "@/lib/live";

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
    <div className="lg:grid lg:grid-cols-2 lg:gap-x-5 xl:grid-cols-3">
      {LIVE && <MembersCard />}
      <Card title="성장 단계" desc="바꾸면 커뮤 전체의 프로필·두상이 그 단계로 바뀌어요. 이미 쓴 글은 작성 당시 모습을 유지하고, 기숙사 역극방은 새로 열려요.">
        <Segmented
          options={STAGES.map((s, i) => ({ v: i, l: s }))}
          value={data.stage}
          onChange={(s) => { if (s === data.stage) return; openSheet(<StageSheet s={s as Stage} />); }}
        />
        {nxt <= 2 && <p className="mt-3 text-sm">{STAGES[nxt]} 프로필 미등록: <b>{missing.length}명</b>{missing.length ? ` (${missing.map((c) => c.name).join(", ")})` : ""}</p>}
      </Card>

      <Card title="학기 마감" desc="캐릭터별 옵티메 수를 세어 수석을 정하고, 학부별로 집계해요. 제5학부는 관례에 따라 순위표에 오르지 않아요.">
        <Button size="sm" onClick={async () => { try { await st.semester(); toast("집계했어요."); } catch (e) { toast((e as Error).message); } }}>지금 집계하기</Button>
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
            <Button size="sm" variant="ghost" className="mt-2.5" onClick={async () => { try { await st.postResults(); toast("타임라인 공지로 올렸어요."); } catch (e) { toast((e as Error).message); } }}>공지로 올리기</Button>
          </div>
        )}
      </Card>

      <Card title="성적·재화 조정" desc="이벤트 보상이나 정정에 써요. 조정하면 해당 캐릭터에게 알림이 가고 운영 기록에 남아요.">
        <Field label="캐릭터" htmlFor="ad-c"><Dropdown id="ad-c" value={adj.c} onChange={(v) => setAdj({ ...adj, c: v })} options={data.chars.map((c) => ({ v: c.id, l: c.name }))} /></Field>
        <div className="grid grid-cols-[1fr_110px] gap-2.5">
          <Field label="항목" htmlFor="ad-t"><Dropdown<SubjectId | "money"> id="ad-t" value={adj.t} onChange={(v) => setAdj({ ...adj, t: v })} options={[...SUBJECTS.map((s) => ({ v: s.id as SubjectId | "money", l: s.name })), { v: "money" as const, l: "재화 (그로셴)" }]} /></Field>
          <Field label="증감" htmlFor="ad-n"><Input id="ad-n" type="number" inputMode="numeric" value={adj.n} onChange={(e) => setAdj({ ...adj, n: e.target.value })} /></Field>
        </div>
        <Field label="사유" htmlFor="ad-r"><Input id="ad-r" placeholder="예: 등불 축제 보상" value={adj.why} onChange={(e) => setAdj({ ...adj, why: e.target.value })} /></Field>
        <Button size="sm" onClick={async () => { const n = parseInt(adj.n, 10); if (!n) { toast("증감 값을 넣어 주세요."); return; } try { const l = await st.adjust(adj.c, adj.t, n, adj.why.trim()); toast(`${nameOf(adj.c)}: ${l}`); } catch (e) { toast((e as Error).message); } }}>적용하기</Button>
      </Card>

      <Card title="운영·아이템 기록">
        {data.adminLog.length ? (
          <div className="divide-y divide-line text-[13px]">{data.adminLog.map((x, i) => <div key={i} className="py-2"><span className="block">{x.text}</span><span className="text-xs text-muted">{ago(x.at, now)}</span></div>)}</div>
        ) : <Empty className="py-2 text-left">지각사유서처럼 운영자 확인이 필요한 아이템을 쓰면 여기에 쌓여요.</Empty>}
      </Card>

      <Card title="공지 수정">
        <Field label="공지 내용" htmlFor="notice-in"><Textarea id="notice-in" value={notice} onChange={(e) => setNotice(e.target.value)} /></Field>
        <Button size="sm" onClick={async () => { try { await st.saveNotice(notice.trim()); toast("공지를 저장했어요."); } catch (e) { toast((e as Error).message); } }}>공지 저장</Button>
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

      <ShopCard />
      <DocsCard />
      <CharactersGrid />
      <Card title="학부" desc="학부 배정은 플레이어가 프로필을 쓸 때 직접 고르고, 기숙사 배정도 그 선택을 따라요.">
        <div className="grid grid-cols-5 gap-1.5">
          {DORMS.map((d) => (
            <div key={d.id} className="flex flex-col items-center gap-1 rounded-xl bg-sunk/60 py-3 text-center text-[11.5px]">
              <Crest id={d.id} size={28} />{d.name}<span className="text-muted tnum">{data.chars.filter((c) => c.dorm === d.id).length}명</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** 가입 승인·정지, 초기 데이터 심기 (실제 서버 모드) */
function MembersCard() {
  const users = useStore((s) => s.users);
  const chars = useStore((s) => s.data.chars);
  const items = useStore((s) => s.data.items);
  const [busy, setBusy] = useState<string | null>(null);
  const live = () => liveApi;
  const act = async (uid: string, status: "member" | "pending" | "suspended") => {
    setBusy(uid);
    try { await live().approveUser(uid, status); toast(status === "member" ? "승인했어요." : status === "suspended" ? "정지했어요." : "대기로 돌렸어요."); }
    catch (e) { toast((e as Error).message); } finally { setBusy(null); }
  };
  const pending = users.filter((u) => u.status === "pending");
  const members = users.filter((u) => u.status !== "pending");
  const row = (u: (typeof users)[number]) => {
    const c = chars.find((x) => x.id === u.charId);
    return (
      <div key={u.uid} className="flex items-center gap-3 py-2.5 text-sm">
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{u.email}</span>
          <span className="block text-xs text-muted">{u.status === "pending" ? "승인 대기" : u.status === "member" ? (c ? `캐릭터: ${c.name}` : "캐릭터 미등록") : "정지됨"}</span>
        </span>
        {u.status !== "member" && <Button size="sm" disabled={busy === u.uid} onClick={() => act(u.uid, "member")}>승인</Button>}
        {u.status === "member" && <Button size="sm" variant="ghost" disabled={busy === u.uid} onClick={() => act(u.uid, "suspended")}>정지</Button>}
        {u.status === "suspended" && <Button size="sm" variant="ghost" disabled={busy === u.uid} onClick={() => act(u.uid, "pending")}>대기로</Button>}
      </div>
    );
  };
  return (
    <>
      {!items.length && (
        <Card title="처음 설정" desc="상점 아이템 9+종, 아르바이트 9종, 기본 설정을 한 번에 심어요. 이미 있는 항목은 건너뛰어요.">
          <Button size="sm" onClick={async () => { try { const r = await live().seedDefaults(); toast(`아이템 ${r.items}개, 아르바이트 ${r.jobs}개를 심었어요.`); } catch (e) { toast((e as Error).message); } }}>초기 데이터 심기</Button>
        </Card>
      )}
      <Card title={`가입 승인${pending.length ? ` · ${pending.length}명 대기` : ""}`} desc="승인하면 바로 캐릭터를 등록하고 활동할 수 있어요.">
        <div className="divide-y divide-line">
          {pending.map(row)}
          {!pending.length && <Empty className="py-2 text-left">대기 중인 가입 신청이 없어요.</Empty>}
        </div>
        {members.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[13px] text-muted">멤버 {members.length}명 보기</summary>
            <div className="divide-y divide-line">{members.map(row)}</div>
          </details>
        )}
      </Card>
    </>
  );
}

/** 상점 관리: 가격·재고·제한·숨김을 바로 고쳐요. */
function ShopCard() {
  const items = useStore((s) => s.data.items);
  const openSheet = useOverlay((s) => s.openSheet);
  const list = [...items].filter((i) => i.cat !== "인형" && i.id !== "ration").sort((a, b) => a.cat.localeCompare(b.cat, "ko"));
  return (
    <Card title="상점 관리" desc="아이템을 누르면 가격·재고·인당 제한·설명을 고칠 수 있어요. 숨기면 상점에서 사라져요.">
      <div className="divide-y divide-line">
        {list.map((i) => (
          <button key={i.id} onClick={() => openSheet(<EditItemSheet id={i.id} />)} className="group flex w-full items-center gap-3 py-2.5 text-left">
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg bg-sunk ${i.hidden ? "text-muted" : "text-gold"}`}><ItemIcon icon={i.icon} size={18} strokeWidth={1.5} /></span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm font-semibold underline-offset-[3px] group-hover:underline ${i.hidden ? "text-muted line-through" : ""}`}>{i.name}</span>
              <span className="block truncate text-xs text-muted">{i.cat}{i.stock >= 0 ? ` · 재고 ${i.stock}` : ""}{i.limit ? ` · 인당 ${i.limit}회` : ""}</span>
            </span>
            <span className="tnum text-sm font-semibold">{money(i.price)}</span>
          </button>
        ))}
      </div>
      <Button size="sm" variant="ghost" className="mt-3" onClick={() => openSheet(<AddItemSheet />)}><Plus size={16} /> 아이템 추가</Button>
    </Card>
  );
}

function EditItemSheet({ id }: { id: string }) {
  const item = useStore((s) => s.data.items.find((i) => i.id === id));
  const updateItem = useStore((s) => s.updateItem);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [f, setF] = useState(() => ({ name: item?.name ?? "", price: String(item?.price ?? 0), stock: item && item.stock >= 0 ? String(item.stock) : "", limit: String(item?.limit ?? 0), cat: item?.cat ?? "", desc: item?.desc ?? "", use: item?.use ?? "", hidden: !!item?.hidden }));
  const [busy, setBusy] = useState(false);
  if (!item) return null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <SheetTitle sub={`${item.cat} · 가격은 그로셴 단위 (1탈러 = 20그로셴)`}>{item.name}</SheetTitle>
      <Field label="이름" htmlFor="ei-n"><Input id="ei-n" value={f.name} onChange={set("name")} /></Field>
      <div className="grid grid-cols-3 gap-x-3">
        <Field label="가격 (그로셴)" htmlFor="ei-p" hint={money(parseInt(f.price, 10) || 0)}><Input id="ei-p" type="number" inputMode="numeric" min={0} value={f.price} onChange={set("price")} /></Field>
        <Field label="재고 (비우면 무제한)" htmlFor="ei-s"><Input id="ei-s" type="number" inputMode="numeric" min={0} value={f.stock} onChange={set("stock")} /></Field>
        <Field label="인당 제한 (0=없음)" htmlFor="ei-l"><Input id="ei-l" type="number" inputMode="numeric" min={0} value={f.limit} onChange={set("limit")} /></Field>
      </div>
      <Field label="분류" htmlFor="ei-c"><Input id="ei-c" value={f.cat} onChange={set("cat")} /></Field>
      <Field label="설명" htmlFor="ei-d"><Textarea id="ei-d" className="min-h-[80px]" value={f.desc} onChange={set("desc")} /></Field>
      <Field label="효과 설명" htmlFor="ei-u"><Input id="ei-u" value={f.use} onChange={set("use")} /></Field>
      <label className="mb-4 flex cursor-pointer items-center gap-2.5 text-sm"><input type="checkbox" className="size-4 accent-gold" checked={f.hidden} onChange={(e) => setF({ ...f, hidden: e.target.checked })} /> 상점에서 숨기기</label>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button disabled={busy} onClick={async () => {
          const price = parseInt(f.price, 10); if (!f.name.trim() || !(price >= 0)) { toast("이름과 가격을 확인해 주세요."); return; }
          const patch: Partial<Item> = { name: f.name.trim(), price, stock: f.stock === "" ? -1 : Math.max(0, parseInt(f.stock, 10) || 0), limit: Math.max(0, parseInt(f.limit, 10) || 0), cat: f.cat.trim() || "잡화", desc: f.desc.trim(), use: f.use.trim(), hidden: f.hidden };
          setBusy(true);
          try { await updateItem(id, patch); closeSheet(); toast("아이템을 고쳤어요."); } catch (e) { toast((e as Error).message); } finally { setBusy(false); }
        }}>{busy ? "저장 중…" : "저장"}</Button>
      </SheetActions>
    </>
  );
}

/** 문서 편집: 세계관·편람·규칙. "## 제목"으로 절을 나누고, 빈 줄로 문단, "* "로 목록, "> "로 인용. */
const DOC_IDS = [{ v: "rules" as const, l: "규칙" }, { v: "world" as const, l: "공개 세계관" }, { v: "handbook" as const, l: "루체른 생활 편람" }];
const DOC_FALLBACK = { rules: RULES, world: WORLD, handbook: HANDBOOK };
function DocsCard() {
  const docTexts = useStore((s) => s.docTexts);
  const saveDoc = useStore((s) => s.saveDoc);
  const [id, setId] = useState<"rules" | "world" | "handbook">("rules");
  const [text, setText] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (LIVE) return watchDoc(id); }, [id]);
  const current = docTexts[id]?.text ?? DOC_FALLBACK[id];
  const value = text ?? current;
  return (
    <Card title="문서 편집" desc="세계관·편람·규칙을 고쳐요. '## 제목'으로 절을 나누고, 빈 줄로 문단을 나눠요. 규칙은 최종 수정일과 변경 요약이 같이 표시돼요.">
      <Field label="문서" htmlFor="doc-id"><Dropdown id="doc-id" value={id} onChange={(v) => { setId(v); setText(null); setSummary(""); }} options={DOC_IDS} /></Field>
      <Field label="내용" htmlFor="doc-text" hint={docTexts[id]?.updatedAt ? `최종 수정 ${new Date(docTexts[id].updatedAt).toLocaleString("ko-KR")}` : "아직 고친 적 없음 (기본 원문)"}>
        <Textarea id="doc-text" className="min-h-[320px] font-mono text-[13px] leading-relaxed" value={value} onChange={(e) => setText(e.target.value)} />
      </Field>
      <Field label="변경 요약 (선택)" htmlFor="doc-sum"><Input id="doc-sum" value={summary} onChange={(e) => setSummary(e.target.value)} /></Field>
      <div className="flex gap-2">
        <Button size="sm" disabled={busy || text === null} onClick={async () => { setBusy(true); try { await saveDoc(id, value, summary.trim()); setText(null); setSummary(""); toast("문서를 저장했어요."); } catch (e) { toast((e as Error).message); } finally { setBusy(false); } }}>{busy ? "저장 중…" : "저장"}</Button>
        <Button size="sm" variant="ghost" disabled={text === null} onClick={() => setText(null)}>되돌리기</Button>
      </div>
    </Card>
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
        <Button onClick={async () => { try { await setStage(s); closeSheet(); toast(`커뮤가 ${STAGES[s]} 단계가 되었어요.`); } catch (e) { toast((e as Error).message); } }}>전환하기</Button>
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
