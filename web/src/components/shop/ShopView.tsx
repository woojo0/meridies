"use client";

import { money } from "@/lib/format";
import { useMe } from "@/lib/hooks";
import { useOverlay } from "@/lib/overlay";
import { useStore } from "@/lib/store";
import { ItemIcon } from "../ui/ItemIcon";
import { Chip, ChipRow, Note } from "../ui/primitives";
import { ItemSheet } from "./ItemSheet";

/** 상점: 2열 그리드(≥560px 3열), 상단에 내 잔액 고정. */
export function ShopView() {
  const me = useMe();
  const allItems = useStore((s) => s.data.items);
  const items = allItems.filter((i) => !i.hidden);
  const cat = useStore((s) => s.ui.shopCat);
  const setShopCat = useStore((s) => s.setShopCat);
  const openSheet = useOverlay((s) => s.openSheet);
  if (!me) return <Note className="mt-4">캐릭터를 등록하면 상점을 이용할 수 있어요. 더보기 → 캐릭터 등록.</Note>;
  const cats = ["전체", ...new Set(items.map((i) => i.cat))];
  const list = items.filter((i) => cat === "전체" || i.cat === cat);
  return (
    <>
      <div className="sticky top-[62px] z-10 -mx-4 mb-3 bg-bg/85 px-4 pb-2 pt-1 backdrop-blur-xl lg:-mx-8 lg:px-8">
        <div className="card flex items-center justify-between px-4 py-3">
          <span className="text-sm text-muted">{me.name}의 지갑</span>
          <b className="font-display text-lg tnum">{money(me.money)}</b>
        </div>
      </div>
      <ChipRow>{cats.map((c) => <Chip key={c} on={cat === c} onClick={() => setShopCat(c)}>{c}</Chip>)}</ChipRow>
      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {list.map((i) => (
          <button key={i.id} onClick={() => openSheet(<ItemSheet id={i.id} />)} className="card group flex min-w-0 flex-col p-3 pb-4 text-left transition-transform hover:-translate-y-0.5">
            <span className="grid aspect-[5/4] w-full place-items-center rounded-xl border border-line bg-[linear-gradient(135deg,var(--sunk),var(--gold-soft))] text-gold">
              <ItemIcon icon={i.icon} size={38} strokeWidth={1.25} className="transition-transform group-hover:scale-110" />
            </span>
            <span className="mt-3.5 px-3.5 text-[14px] font-semibold leading-snug">{i.name}</span>
            <span className="mt-1 px-3.5 text-[12px] text-muted tnum">{money(i.price)}{i.stock >= 0 ? ` · 남은 ${i.stock}` : ""}{i.limit ? ` · 인당 ${i.limit}회` : ""}</span>
          </button>
        ))}
      </div>
      <p className="mt-10 px-3 pb-2 text-[12.5px] leading-relaxed text-muted">1탈러 = 20그로셴. 인벤토리의 모든 아이템은 다른 캐릭터에게 선물할 수 있어요.</p>
    </>
  );
}
