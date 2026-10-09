export type DormId = "aurora" | "vesper" | "candida" | "astra" | "fifth";
export type SubjectId = "kw" | "th" | "lt" | "wr" | "ma" | "na" | "et" | "pe" | "ar";
export type Stage = 0 | 1 | 2;
export type CatId = "event" | "story" | "academic" | "notice";

export interface Profile {
  gender: string;
  age: string;
  height: string;
  pers: string;
  text: string;
  birthday?: string;
  /** 직접 추가하는 항목 (예: 포지션, 직업, 좋아하는 것) */
  extra?: { k: string; v: string }[];
  /** 세부 정보 (마크다운) */
  detail?: string;
  avatar?: string | null;
  body?: string | null;
}

export interface Tx {
  at: number;
  text: string;
  amt: number;
}

export interface Character {
  id: string;
  name: string;
  dorm: DormId;
  owner: string;
  money: number;
  inv: Record<string, number>;
  profiles: Partial<Record<Stage, Profile>>;
  scores: Record<SubjectId, number>;
  tx: Tx[];
  study?: { day: string; n: number };
  studyJob?: { subject: SubjectId; start: number; jokbo: boolean } | null;
  job?: { id: string; start: number } | null;
  jobDay?: { day: string; n: number; bonus: number };
  ration?: { day: string };
  bought?: Record<string, number>;
  visit?: { dorm: DormId; until: number } | null;
}

export interface Post {
  id: string;
  charId: string;
  stage: Stage;
  text: string;
  images: string[];
  at: number;
  likes: string[];
  edited?: boolean;
}

export interface Msg {
  id: string;
  charId: string;
  stage: Stage;
  text: string;
  image?: string | null;
  at: number;
  edited?: boolean;
}

export interface Room {
  id: string;
  members: [string, string];
  source: { postId: string; charId: string; stage: Stage; text: string; images: string[]; at: number };
  messages: Msg[];
  status: "open" | "done";
  lastAt: number;
  read: Record<string, number>;
}

export interface Letter {
  from: string;
  text: string;
  sentAt: number;
  deliverAt: number;
  read: boolean;
}

export interface Thread {
  id: string;
  a: string;
  b: string;
  alias: Record<string, string>;
  letters: Letter[];
}

export interface CalEvent {
  id: string;
  date: string;
  end: string;
  title: string;
  cat: CatId;
  desc: string;
}

export interface Item {
  id: string;
  name: string;
  cat: string;
  price: number;
  icon: string;
  desc: string;
  use: string;
  stock: number;
  limit: number;
  qty?: number;
  instant?: boolean;
  hidden?: boolean;
}

export interface Job {
  id: string;
  name: string;
  subject: SubjectId;
  desc: string;
  rates: number[];
  win: [number, number];
  lose: [number, number];
  flavorW: string;
  flavorL: string;
}

export interface Notif {
  id: string;
  to: string;
  text: string;
  link?: { v: string; id?: string };
  at: number;
  read: boolean;
}

export interface AdminLog {
  at: number;
  text: string;
}

export interface SemesterResult {
  topN: number;
  top: string[];
  dorms: { id: DormId; n: number }[];
}

export interface Session {
  charId: string | null;
  admin: boolean;
}

export interface Data {
  v: number;
  stage: Stage;
  chars: Character[];
  posts: Post[];
  rooms: Room[];
  dormMsgs: Record<string, Msg[]>;
  threads: Thread[];
  events: CalEvent[];
  items: Item[];
  jobs: Job[];
  notifs: Notif[];
  notice: { text: string; at: number } | null;
  adminLog: AdminLog[];
  results: SemesterResult | null;
}
