import type { Thread } from "./types";

/** 편지인 별칭. 졸업(2차 성장) 뒤에는 별칭 옆에 캐릭터 이름이 보여요. */
export function aliasOf(t: Thread, id: string, stage: number, nameOf: (id: string) => string) {
  return stage >= 2 ? `${nameOf(id)} (${t.alias[id]})` : t.alias[id];
}
