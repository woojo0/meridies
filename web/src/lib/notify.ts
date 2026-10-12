import type { NotifKind } from "./types";

/** 알림 종류. 알림 설정 화면의 순서대로. */
export const NOTIF_KINDS: { k: NotifKind; label: string; desc: string }[] = [
  { k: "rpNew", label: "새 역극 시작", desc: "누가 내 타임라인 글에 말을 걸어 역극이 시작될 때" },
  { k: "rpReply", label: "역극 답장", desc: "진행 중인 역극에 상대가 답했을 때" },
  { k: "letterNew", label: "새 익명의 편지", desc: "익명의 편지가 내게 도착했을 때" },
  { k: "letterReply", label: "익명의 편지 답장", desc: "내가 보낸 편지에 답장이 도착했을 때" },
  { k: "gift", label: "선물·송금", desc: "누가 물건이나 그로셴을 보냈을 때" },
  { k: "adminDm", label: "운영자 DM", desc: "운영자가 문의함에 답하거나 메시지를 보냈을 때" },
  { k: "ownerDm", label: "오너 DM", desc: "다른 오너가 DM을 보냈을 때" },
  { k: "system", label: "운영 알림", desc: "성적·재화 조정, 편지 분실 같은 운영 안내" },
];

/** 끈 적 없으면 켜진 걸로 */
export const notifyOn = (prefs: Partial<Record<NotifKind, boolean>> | undefined, kind: NotifKind | undefined) => !kind || prefs?.[kind] !== false;
