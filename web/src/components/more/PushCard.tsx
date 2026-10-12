"use client";

import { BellRing, Smartphone, Monitor, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ago } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { toast } from "@/lib/overlay";
import { pushSupport, registerThisDevice, removeDevice, thisDeviceToken, watchDevices, type PushDevice } from "@/lib/push";
import { Button, Empty, RowSub, RowTitle } from "../ui/primitives";

/** 더보기 → 푸시 알림: 등록된 기기 목록 + "이 기기 추가하기" */
export function PushCard() {
  const now = useNow();
  const [devices, setDevices] = useState<PushDevice[] | null>(null);
  const [mine, setMine] = useState<string | null>(null);
  const [support, setSupport] = useState<{ ok: boolean; why?: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { pushSupport().then((s) => { setSupport(s); setMine(thisDeviceToken()); }); return watchDevices(setDevices); }, []);

  const registered = !!mine && !!devices?.some((d) => d.token === mine);
  const add = async () => {
    setBusy("add");
    try { const d = await registerThisDevice(); setMine(d.token); toast("이 기기를 추가했어요. 역극·편지·DM·운영자 메시지 알림을 받아요."); }
    catch (e) { toast((e as Error).message); } finally { setBusy(null); }
  };
  const remove = async (t: string) => {
    setBusy(t);
    try { await removeDevice(t); if (t === mine) setMine(null); toast("기기를 뺐어요."); } catch (e) { toast((e as Error).message); } finally { setBusy(null); }
  };

  return (
    <div className="card-flat">
      <div className="px-4 pt-4 pb-2">
        <span className="mb-1 block text-[13px] font-semibold text-muted">푸시 알림</span>
        <p className="text-[12.5px] leading-relaxed text-muted">앱을 닫아 둬도 역극 답장, 편지, 오너 DM, 운영자 메시지를 기기 알림으로 받아요. 받을 기기마다 그 기기에서 한 번씩 추가해요.</p>
      </div>
      <div className="divide-y divide-line">
        {devices === null ? null : devices.length ? devices.map((d) => (
          <div key={d.token} className="flex items-center gap-3 px-4 py-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunk text-gold">{d.kind === "mobile" ? <Smartphone size={18} strokeWidth={1.6} /> : <Monitor size={18} strokeWidth={1.6} />}</span>
            <span className="min-w-0 flex-1">
              <RowTitle>{d.label}{d.token === mine && <span className="ml-1.5 rounded-full bg-gold-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-gold">이 기기</span>}</RowTitle>
              <RowSub>{ago(d.at, now)} 추가</RowSub>
            </span>
            <button type="button" aria-label="기기 빼기" disabled={busy === d.token} onClick={() => remove(d.token)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-sunk hover:text-crit disabled:opacity-40"><X size={16} /></button>
          </div>
        )) : <Empty className="py-3">아직 추가한 기기가 없어요.</Empty>}
      </div>
      <div className="px-4 pb-4 pt-2">
        {registered ? (
          <p className="text-[12.5px] text-muted">이 기기는 알림을 받고 있어요. 끄려면 위 목록에서 빼세요.</p>
        ) : (
          <>
            <Button size="sm" disabled={busy === "add" || support?.ok === false} onClick={add}><BellRing size={15} strokeWidth={1.8} />{busy === "add" ? "추가하는 중…" : "이 기기 추가하기"}</Button>
            {support && !support.ok && <p className="mt-2 text-[12.5px] leading-relaxed text-crit">{support.why}</p>}
          </>
        )}
      </div>
    </div>
  );
}
