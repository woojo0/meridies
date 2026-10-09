import type { CatId, DormId, SubjectId } from "./types";

export const H = 3600e3;
export const STUDY_MS = H;
export const JOB_MS = 2 * H;
export const LETTER_MS = H;
export const JOKBO = 10;
export const KW_COST = 1;
export const RATION = [1, 1, 2, 2, 3];
export const TOTAL_ALLOC = 2000;
export const KW_MAX_ALLOC = 199;
export const STUDY_PER_DAY = 3;
export const JOB_PER_DAY = 2;
export const TRANSFER_FEE = 0.1;
export const TRANSFER_MIN = 2;
export const START_MONEY = 40;

export interface Subject {
  id: SubjectId;
  name: string;
  short: string;
  max?: number;
  hard?: string;
}

export const SUBJECTS: Subject[] = [
  { id: "kw", name: "광휘 실습 (기초)", short: "광휘 실습", max: 4, hard: "매우 어려움" },
  { id: "th", name: "마법 이론 입문", short: "마법 이론", max: 8, hard: "어려움" },
  { id: "lt", name: "빛 개론", short: "빛 개론", max: 7, hard: "어려움" },
  { id: "wr", name: "제국어와 글쓰기", short: "제국어" },
  { id: "ma", name: "셈법", short: "셈법" },
  { id: "na", name: "자연 견문", short: "자연 견문" },
  { id: "et", name: "예법과 생활", short: "예법" },
  { id: "pe", name: "기초 단련", short: "단련" },
  { id: "ar", name: "노래와 그림", short: "노래와 그림" },
];

export const subject = (id: SubjectId) => SUBJECTS.find((s) => s.id === id)!;

export const GRADES = [
  { k: "니힐", l: "Nihil" },
  { k: "빅스", l: "Vix" },
  { k: "사티스", l: "Satis" },
  { k: "베네", l: "Bene" },
  { k: "옵티메", l: "Optime" },
];

export const SOLIS_LABEL = ["바닥에 깔린 만큼", "바닥에 깔린 만큼", "빠듯이", "보통", "넉넉히"];

export interface Dorm {
  id: DormId;
  name: string;
  lat: string;
  motto: string;
  sub: string;
  colorName: string;
  custom: string;
}

export const DORMS: Dorm[] = [
  {
    id: "aurora",
    name: "아우로라",
    lat: "Aurora",
    motto: "마법에는 상상력이 뛰어난 자들이 필요하다.",
    sub: "새벽의 학부",
    colorName: "버건디",
    custom: "공용 벽에는 누구나 그림과 시를 남길 수 있고, 매주 지워진다.",
  },
  {
    id: "vesper",
    name: "베스퍼",
    lat: "Vesper",
    motto: "마법에는 호기심이 많은 자들이 필요하다.",
    sub: "저녁별의 학부",
    colorName: "연두",
    custom: "문은 매일 밤 관찰 문제를 낸다. 못 풀면 기숙사생이라도 못 들어간다.",
  },
  {
    id: "candida",
    name: "칸디다",
    lat: "Candida",
    motto: "마법에는 도덕적인 자들이 필요하다.",
    sub: "한낮의 학부",
    colorName: "노랑",
    custom: "자물쇠가 하나도 없다. 방문에도, 서랍에도.",
  },
  {
    id: "astra",
    name: "아스트라",
    lat: "Astra",
    motto: "역경을 넘어 별에게로.",
    sub: "한밤의 학부",
    colorName: "남보라",
    custom: "방과 좌석에는 서열이 있고, 서열은 성적과 공인된 내기로 뺏고 뺏긴다.",
  },
  {
    id: "fifth",
    name: "제5학부",
    lat: "",
    motto: "규정집에 항목이 없습니다.",
    sub: "이름 없는 학부",
    colorName: "빈 원",
    custom: "규칙이 없다. 규정집에 항목 자체가 없으므로.",
  },
];

export const dorm = (id: DormId) => DORMS.find((d) => d.id === id)!;

export const STAGES = ["입학", "1차 성장", "2차 성장"] as const;
export const STAGE_GRADE = ["1학년", "5학년", "성인"] as const;

export const CATS: Record<CatId, string> = {
  event: "커뮤 이벤트",
  story: "스토리 진행",
  academic: "학사 일정",
  notice: "공지·점검",
};

export const FORTUNES = [
  "오늘은 질문 하나가 답 세 개보다 값지다.",
  "잃어버린 물건은 생각보다 가까이 있다. 주머니를 다시 볼 것.",
  "정오의 그림자가 짧은 날, 좋은 소식이 온다.",
  "온실 사과를 나누면 친구가 하나 는다.",
  "오늘 실습에서는 서두르지 말 것. 빛은 기다리는 손에 모인다.",
  "도서관 3층 창가에 행운이 앉아 있다.",
  "누군가 당신의 편지를 기다리고 있다.",
];

export const HEARTS = [
  "콩, 콩. 아주 느리게, 하지만 분명하게.",
  "두근두근두근. 오늘따라 유난히 빠르다.",
  "…아무 소리도 안 들린다. 아니, 방금 들렸나?",
  "따뜻하다. 귀를 대고 있으면 졸음이 온다.",
  "두 개의 심장 소리가 겹쳐 들리는 것 같다.",
];
