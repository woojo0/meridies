"use client";

import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DORMS } from "@/lib/constants";
import { money } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import { toast, useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import type { DormId } from "@/lib/types";
import { openStudySheet } from "../profile/growthSheets";
import { Crest } from "../ui/identity";
import { ItemArt } from "../ui/ItemIcon";
import { ResultSheet, SheetActions, SheetTitle } from "../ui/overlays";
import { Button, Eyebrow, Field, Input, KV, Select } from "../ui/primitives";

/* ── 상점 아이템 상세 + 구매 ── */
export function ItemSheet({ id }: { id: string }) {
  const me = useMe();
  const item = useStore((s) => s.data.items.find((i) => i.id === id));
  const buy = useStore((s) => s.buy);
  const { openSheet, closeSheet } = useOverlay();
  if (!me || !item) return null;
  const own = me.bought?.[item.id] || 0;
  const can = me.money >= item.price && item.stock !== 0 && !(item.limit && own >= item.limit);
  const label = me.money < item.price ? "재화가 부족해요" : item.stock === 0 ? "품절" : item.limit && own >= item.limit ? "구매 제한" : "구매하기";

  const doBuy = () => {
    const got = buy(item.id);
    if (!got) { toast("구매할 수 없어요."); return; }
    if (item.instant) {
      openSheet(
        <ResultSheet
          eyebrow="인형 뽑기"
          big={<span className="text-[22px]">{got.name}</span>}
          actions={<><Button variant="ghost" onClick={closeSheet}>확인</Button><Button onClick={doBuy} disabled={useStore.getState().me()!.money < item.price}>한 번 더 ({money(item.price)})</Button></>}
        >
          <ItemArt icon="doll" className="mx-auto my-3 w-[84px] rounded-2xl" size={44} />
          <p className="text-muted">{got.desc}</p>
        </ResultSheet>,
      );
      return;
    }
    closeSheet();
    toast(`${item.name}${item.qty ? " 한 쌍" : ""}을(를) 인벤토리에 넣었어요.`);
  };

  return (
    <>
      <div className="mb-3 flex items-center gap-3.5">
        <ItemArt icon={item.icon} className="w-[72px]" />
        <div><Eyebrow>{item.cat}</Eyebrow><h2 className="mt-0.5 text-[19px]">{item.name}</h2></div>
      </div>
      <p className="mb-3">{item.desc}</p>
      <KV items={[
        ["효과", item.use],
        ["가격", <span key="p" className="tnum">{money(item.price)}</span>],
        ["내 지갑", <span key="m" className="tnum">{money(me.money)}</span>],
        ...(item.stock >= 0 ? [["남은 수량", item.stock] as [React.ReactNode, React.ReactNode]] : []),
        ...(item.limit ? [["구매 제한", `인당 ${item.limit}회 (구매 ${own}회)`] as [React.ReactNode, React.ReactNode]] : []),
      ]} />
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>닫기</Button>
        <Button onClick={doBuy} disabled={!can}>{label}</Button>
      </SheetActions>
    </>
  );
}

/* ── 아이템이 필요할 때 상점으로 안내 ── */
export function NeedItemSheet({ id }: { id: string }) {
  const item = useStore((s) => s.data.items.find((i) => i.id === id));
  const { openSheet, closeSheet } = useOverlay();
  if (!item) return null;
  return (
    <>
      <SheetTitle>{item.name}이(가) 필요해요</SheetTitle>
      <p>{item.use}. 상점에서 {money(item.price)}에 살 수 있어요.</p>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>닫기</Button>
        <Button onClick={() => openSheet(<ItemSheet id={id} />)}>상점에서 보기</Button>
      </SheetActions>
    </>
  );
}

/* ── 인벤토리 아이템: 사용하기 / 선물하기 ── */
const USE_LABEL: Record<string, string> = {
  ration: "광휘 실습 연습", stamp: "펜팔 쓰기", pigeon: "펜팔함 열기", jokbo: "공부하러 가기", excuse: "제출하기",
  cookie: "쪼개기", egg: "귀 기울이기", drink: "마시기", key: "기숙사 고르기",
};

export function InvItemSheet({ id }: { id: string }) {
  const me = useMe();
  const item = useStore((s) => s.data.items.find((i) => i.id === id));
  const st = useStore();
  const { openSheet, closeSheet, openDrawer } = useOverlay();
  if (!me || !item) return null;
  const n = me.inv[id] || 0;
  const useLabel = USE_LABEL[id];

  const use = () => {
    switch (id) {
      case "ration": openStudySheet(); return;
      case "jokbo": openStudySheet(true); return;
      case "stamp": closeSheet(); openDrawer("pen"); return;
      case "pigeon": closeSheet(); openDrawer("pen"); return;
      case "excuse": st.submitExcuse(); closeSheet(); toast("지각사유서를 냈어요. 운영자에게 전달됐어요."); return;
      case "cookie": {
        const f = st.openCookie();
        openSheet(<ResultSheet eyebrow="오늘의 운세"><p className="my-4 font-display text-[19px] leading-relaxed">“{f}”</p><p className="text-[13px] text-muted">쿠키에서는 밀가루 맛이 났다.</p></ResultSheet>);
        return;
      }
      case "egg": openSheet(<ResultSheet eyebrow="정체불명의 알"><p className="my-4 font-display text-[19px] leading-relaxed">{st.listenEgg()}</p></ResultSheet>); return;
      case "drink": { const left = st.drinkSolis(); closeSheet(); toast(`힘이 솟아요! 오늘 아르바이트 ${left}회 남았어요.`); return; }
      case "key": openSheet(<KeySheet />); return;
    }
  };

  return (
    <>
      <div className="mb-3 flex items-center gap-3.5">
        <ItemArt icon={item.icon} className="w-16 rounded-xl" size={28} />
        <div><Eyebrow>{item.cat} · {n}개</Eyebrow><h2 className="mt-0.5 text-[19px]">{item.name}</h2></div>
      </div>
      <p>{item.desc}</p>
      <p className="mt-1 text-[13px] text-muted">{item.use}</p>
      <SheetActions>
        <Button variant="ghost" onClick={() => openSheet(<GiftSheet id={id} />)}><Gift size={18} strokeWidth={1.6} /> 선물하기</Button>
        {useLabel && <Button onClick={use}>{useLabel}</Button>}
      </SheetActions>
    </>
  );
}

function KeySheet() {
  const me = useMe();
  const enterDorm = useStore((s) => s.enterDorm);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const router = useRouter();
  if (!me) return null;
  return (
    <>
      <SheetTitle sub="24시간 동안 그 학부의 기숙사 역극을 읽고 쓸 수 있어요.">어느 기숙사에 들어갈까요?</SheetTitle>
      <div className="flex flex-col gap-2">
        {DORMS.filter((d) => d.id !== me.dorm).map((d) => (
          <button key={d.id} onClick={() => { enterDorm(d.id as DormId); closeSheet(); toast(`${d.name} 기숙사에 몰래 들어왔어요.`); router.push("/dorm"); }} className="group flex items-center gap-3 rounded-2xl border border-line bg-bg px-4 py-3 text-left hover:border-gold/60">
            <Crest id={d.id} size={28} /><span className="font-semibold underline-offset-[3px] group-hover:underline">{d.name}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export function GiftSheet({ id }: { id: string }) {
  const me = useMe();
  const chars = useStore((s) => s.data.chars);
  const item = useStore((s) => s.data.items.find((i) => i.id === id));
  const gift = useStore((s) => s.gift);
  const closeSheet = useOverlay((s) => s.closeSheet);
  const [to, setTo] = useState("");
  const [memo, setMemo] = useState("");
  if (!me || !item) return null;
  return (
    <>
      <SheetTitle>{item.name} 선물하기</SheetTitle>
      <Field label="받을 캐릭터" htmlFor="gf-to">
        <Select id="gf-to" value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">고르기</option>
          {chars.filter((c) => c.id !== me.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="쪽지 (선택)" htmlFor="gf-memo"><Input id="gf-memo" value={memo} onChange={(e) => setMemo(e.target.value)} /></Field>
      <SheetActions>
        <Button variant="ghost" onClick={closeSheet}>취소</Button>
        <Button onClick={() => {
          if (!to) { toast("받을 캐릭터를 골라 주세요."); return; }
          gift(id, to, memo.trim()); closeSheet();
          toast(`${chars.find((c) => c.id === to)?.name}에게 ${item.name}을(를) 보냈어요.`);
        }}><Gift size={18} strokeWidth={1.6} /> 보내기</Button>
      </SheetActions>
    </>
  );
}
