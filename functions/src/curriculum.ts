/** 5학년 교과·아르바이트 (web/src/lib/curriculum.ts와 동일 유지) */
import { type Job, type SubjectId } from "./data";

export interface Subject1 { id: string; name: string; max?: number; required: boolean; from?: SubjectId }
export const SUBJECTS1: Subject1[] = [
  { id: "kw2", name: "광휘 실습 (상급)", max: 4, required: true, from: "kw" },
  { id: "hist", name: "마법사학", max: 8, required: true, from: "th" },
  { id: "emp", name: "제국사", required: true },
  { id: "law", name: "법과 규정", required: true },
  { id: "econ", name: "빛의 경제", max: 7, required: true, from: "lt" },
  { id: "pe2", name: "기초 단련", required: true, from: "pe" },
  { id: "anc", name: "고어 강독", required: false },
  { id: "astro", name: "천문 관측", required: false },
  { id: "art2", name: "회화 심화", required: false },
  { id: "heal", name: "치유 실무", required: false },
  { id: "lit", name: "옛 문학", required: false },
];
export const ELECTIVE_MIN = 2;
const ALL1: SubjectId[] = ["kw", "th", "lt", "wr", "ma", "na", "et", "pe", "ar"];
export const DROPPED_AT_1: SubjectId[] = ALL1.filter((id) => !SUBJECTS1.some((s) => s.from === id));

const E = [45, 60, 75, 88, 95], N = [35, 50, 65, 80, 93], D = [10, 25, 45, 68, 88], VD = [5, 15, 30, 50, 75];
const job = (id: string, name: string, subject: string, desc: string, rates: number[], win: [number, number], lose: [number, number], flavorW: string, flavorL: string): Job & { stage: number } => ({ id, name, subject: subject as SubjectId, desc, rates, win, lose, flavorW, flavorL, stage: 1 });
/** 5학년 아르바이트: 과목마다 하나. 보상은 1학년보다 조금 높아요. */
export const JOBS1 = [
  job("j1-kw2", "솔리스 등탑 점검", "kw2", "거울 호수 등탑의 솔리스 잔량을 재고 보충 시기를 적는다. 상급 실기가 필요한 일.", VD, [45, 60], [0, 3], "등탑지기가 처음으로 열쇠를 맡겼다.", "눈금을 하나 잘못 읽어 다시 올라갔다."),
  job("j1-hist", "고문서 복원 보조", "hist", "서고 안쪽의 낡은 마법서를 펴서 바스러진 면을 옮겨 적는다.", [25, 40, 55, 72, 90], [18, 26], [1, 3], "사서가 복원본을 정본 서가에 꽂았다.", "한 장을 거꾸로 옮겼다."),
  job("j1-emp", "기록관 연표 정리", "emp", "제국 기록관에 보낼 올해 연표를 교차 확인한다.", N, [14, 20], [1, 3], "기록관이 날짜 하나를 바로잡아 준 데 고마워했다.", "연호를 하나 헷갈렸다."),
  job("j1-law", "규정집 개정 교열", "law", "교칙 개정안의 조항 번호와 참조를 맞춘다.", N, [14, 20], [1, 3], "사감이 교열본을 그대로 인쇄에 넘겼다.", "참조 조항 하나가 빠졌다."),
  job("j1-econ", "배급 장부 감사", "econ", "학부별 솔리스 배급 장부를 대조한다. 한 병이 비면 처음부터.", [25, 40, 55, 72, 90], [20, 28], [1, 3], "장부가 한 병도 틀리지 않았다.", "두 병의 행방을 끝내 찾지 못했다."),
  job("j1-pe2", "야간 순찰 보조", "pe2", "사감과 함께 밤의 회랑을 돈다. 추위와 어둠이 일이다.", D, [20, 30], [0, 2], "아무 일도 없었고, 그것이 일을 잘한 것이다.", "졸다가 사감에게 들켰다."),
  job("j1-anc", "비문 탁본", "anc", "첨탑 기단의 옛말 비문을 탁본해 서고에 넘긴다.", N, [16, 24], [1, 3], "읽히지 않던 글자 하나가 탁본에서 드러났다.", "먹이 번져 다시 떠야 했다."),
  job("j1-astro", "야간 관측 기록", "astro", "아스트라 천문대의 밤 관측 일지를 적는다.", N, [16, 24], [1, 3], "천문원이 기록을 그대로 받아 갔다.", "구름이 걷히는 순간을 놓쳤다."),
  job("j1-art2", "초상화 의뢰", "art2", "교원 사택에서 들어오는 초상화·삽화 의뢰를 받는다.", N, [16, 24], [1, 3], "의뢰인이 액자값까지 얹어 주었다.", "닮지 않았다는 말을 들었다."),
  job("j1-heal", "양호실 당직", "heal", "양호실 밤 당직. 약초를 달이고 붕대를 갈아 준다.", E, [12, 18], [1, 3], "밤새 아무도 더 아프지 않았다.", "약탕을 태웠다."),
  job("j1-lit", "낭독회 준비", "lit", "옛 문학 낭독회의 대본을 고르고 읽기 쉽게 다듬는다.", E, [12, 18], [1, 3], "낭독회 뒤 책을 빌려 가는 아이들이 늘었다.", "대본 한 쪽이 빠졌다."),
];

export interface Stage1Plan { electives: string[]; alloc: Record<string, number> }
/** 분배 계획을 지금 1학년 점수로 실제 5학년 점수표로 만들어요. 풀이 달라졌으면 비율대로 맞춰요. */
export function materializeStage1(scores: Record<string, number>, plan: Stage1Plan): Record<string, number> {
  const pool = DROPPED_AT_1.reduce((a, id) => a + (scores[id] ?? 0), 0);
  const targets = SUBJECTS1.filter((s) => (s.required && !s.from) || plan.electives.includes(s.id)).map((s) => s.id);
  const planned = targets.reduce((a, id) => a + (plan.alloc[id] ?? 0), 0);
  const out: Record<string, number> = {};
  for (const s of SUBJECTS1) if (s.from) out[s.id] = scores[s.from] ?? 0;
  let used = 0;
  for (const id of targets) { const v = planned > 0 ? Math.floor(((plan.alloc[id] ?? 0) * pool) / planned) : Math.floor(pool / targets.length); out[id] = v; used += v; }
  if (targets.length) out[targets[0]] += pool - used;
  return out;
}
