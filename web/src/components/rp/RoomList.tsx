"use client";

import Link from "next/link";
import { ago } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { Avatar } from "../ui/identity";
import { Empty, Pill, RowSub, RowTitle, rowCls } from "../ui/primitives";

/** 캐릭터의 1:1 역극 목록. 완료된 방은 아래로. 카드 안에 넣어 쓰세요. */
export function RoomList({ charId, showUnread, onNavigate }: { charId: string; showUnread?: boolean; onNavigate?: () => void }) {
  const now = useNow();
  const rooms = useStore((s) => s.data.rooms);
  const chars = useStore((s) => s.data.chars);
  const stage = useStore((s) => s.data.stage);
  const list = rooms
    .filter((r) => r.members.includes(charId))
    .sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || b.lastAt - a.lastAt);

  if (!list.length) return <Empty>아직 역극이 없어요. 타임라인 글에 말을 걸어 보세요.</Empty>;

  return (
    <div className="flex flex-col">
      {list.map((r) => {
        const o = chars.find((c) => c.id === r.members.find((x) => x !== charId));
        const last = r.messages.at(-1);
        const unread = showUnread && r.lastAt > (r.read?.[charId] || 0);
        if (!o) return null;
        return (
          <Link key={r.id} href={`/room/${r.id}`} onClick={onNavigate} className={rowCls}>
            <Avatar c={o} stage={stage} />
            <span className="min-w-0 flex-1">
              <RowTitle>
                {o.name} {r.status === "done" && <Pill className="ml-1 align-middle">완료</Pill>}
              </RowTitle>
              <RowSub>{last ? last.text : r.source.text}</RowSub>
            </span>
            {unread && <span className="size-2 shrink-0 rounded-full bg-crit" aria-label="새 답장" />}
            <span className="shrink-0 text-xs text-muted">{ago(r.lastAt, now)}</span>
          </Link>
        );
      })}
    </div>
  );
}
