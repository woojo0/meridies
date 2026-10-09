import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  FORTUNES, HEARTS, JOB_MS, JOB_PER_DAY, JOKBO, KW_COST, LETTER_MS, RATION, START_MONEY, STUDY_MS, STUDY_PER_DAY,
  SUBJECTS, TRANSFER_FEE, DORMS, GRADES, H, subject,
} from "./constants";
import { gIdx, pad, rnd, uid, ymd } from "./format";
import { DATA_VERSION, scoresFrom, seed } from "./seed";
import type { CatId, Character, Data, DormId, Item, Profile, Session, Stage, SubjectId } from "./types";

export interface UIPrefs {
  shopCat: string;
  calSel: string;
  calMonth: [number, number];
}

export interface StudyResult {
  subject: SubjectId;
  before: number;
  after: number;
  gain: number;
  base: number;
  jokbo: boolean;
  flavor: string;
  left: number;
}

export interface JobResult {
  jobId: string;
  ok: boolean;
  amt: number;
  rate: number;
  grade: number;
}

interface State {
  data: Data;
  session: Session;
  shift: number;
  ui: UIPrefs;
  hydrated: boolean;

  now: () => number;
  me: () => Character | null;
  ch: (id: string) => Character | undefined;

  // session
  login: (charId: string, admin?: boolean) => void;
  logout: () => void;
  setAdmin: (admin: boolean) => void;
  switchChar: (id: string) => void;

  // timeline
  addPost: (text: string, images: string[]) => void;
  editPost: (id: string, text: string) => void;
  deletePost: (id: string) => void;
  toggleLike: (id: string) => void;
  talk: (postId: string, text: string) => string;

  // roleplay
  rpSend: (roomId: string, text: string, image: string | null) => void;
  rpEdit: (roomId: string, msgId: string, text: string) => void;
  rpDone: (roomId: string) => void;
  rpReopen: (roomId: string) => void;
  markRoomRead: (roomId: string) => void;
  dormSend: (dormId: DormId, text: string, image: string | null) => void;

  // calendar
  setCalSel: (d: string) => void;
  moveCalMonth: (delta: number) => void;
  addEvent: (e: { title: string; date: string; end: string; cat: CatId; desc: string }) => void;

  // shop / inventory
  setShopCat: (c: string) => void;
  buy: (itemId: string) => Item | null;
  gift: (itemId: string, to: string, memo: string) => void;
  openCookie: () => string;
  listenEgg: () => string;
  drinkSolis: () => number;
  submitExcuse: () => void;
  enterDorm: (dormId: DormId) => void;

  // growth
  ration: () => number;
  studyStart: (subjectId: SubjectId, useJokbo: boolean) => string | null;
  studyFinish: () => StudyResult | null;
  jobStart: (jobId: string) => string | null;
  jobFinish: () => JobResult | null;
  transfer: (to: string, amt: number, memo: string) => string | null;

  // profile
  saveProfile: (stage: Stage, p: Profile) => void;
  createCharacter: (c: { name: string; dorm: DormId; gender: string; height: string; scores: number[] }) => string;

  // letters
  letterNew: (text: string) => "sent" | "lost" | "no-stamp";
  letterReply: (threadId: string, text: string) => "sent" | "no-pigeon";
  markLetterRead: (threadId: string, idx: number) => void;

  // notifications
  markNotif: (id: string) => void;

  // admin
  setStage: (s: Stage) => void;
  semester: () => void;
  postResults: () => void;
  saveNotice: (text: string) => void;
  addItem: (i: { name: string; price: number; cat: string; stock: number; desc: string }) => void;
  adjust: (charId: string, target: SubjectId | "money", n: number, why: string) => string;

  // demo
  shiftTime: (h: number) => void;
  reset: () => void;
}

const todayUI = (): UIPrefs => {
  const d = new Date();
  return { shopCat: "전체", calSel: ymd(d), calMonth: [d.getFullYear(), d.getMonth()] };
};

function addInv(c: Character, id: string, n: number) {
  c.inv[id] = (c.inv[id] || 0) + n;
  if (c.inv[id] <= 0) delete c.inv[id];
}

export function jobLeft(c: Character, now: number) {
  const day = ymd(new Date(now));
  const jd = c.jobDay?.day === day ? c.jobDay : { n: 0, bonus: 0 };
  return JOB_PER_DAY + jd.bonus - jd.n;
}

export function studyLeft(c: Character, now: number) {
  const day = ymd(new Date(now));
  return STUDY_PER_DAY - (c.study?.day === day ? c.study.n : 0);
}

export function rationToday(c: Character, now: number) {
  return c.ration?.day === ymd(new Date(now));
}

/** Profile for a stage, falling back to the most recent earlier stage. */
export function prof(c: Character, stage: number): { p: Profile; stage: Stage } {
  for (let s = stage; s >= 0; s--) {
    const p = c.profiles[s as Stage];
    if (p) return { p, stage: s as Stage };
  }
  return { p: { gender: "", age: "", height: "", pers: "", text: "" }, stage: 0 };
}

export const useStore = create<State>()(
  persist(
    immer((set, get) => {
      const pushNotif = (d: Data, to: string, text: string, link?: { v: string; id?: string }) => {
        d.notifs.unshift({ id: uid(), to, text, link, at: Date.now() + get().shift, read: false });
      };
      const mine = (d: Data) => d.chars.find((c) => c.id === get().session.charId);

      return {
        data: seed(),
        session: { charId: null, admin: false },
        shift: 0,
        ui: todayUI(),
        hydrated: false,

        now: () => Date.now() + get().shift,
        me: () => get().data.chars.find((c) => c.id === get().session.charId) ?? null,
        ch: (id) => get().data.chars.find((c) => c.id === id),

        login: (charId, admin = false) => set((s) => { s.session = { charId, admin }; }),
        logout: () => set((s) => { s.session = { charId: null, admin: false }; }),
        setAdmin: (admin) => set((s) => { s.session.admin = admin; }),
        switchChar: (id) => set((s) => { s.session.charId = id; }),

        addPost: (text, images) => set((s) => {
          const m = mine(s.data); if (!m) return;
          s.data.posts.push({ id: uid(), charId: m.id, stage: s.data.stage, text, images, at: get().now(), likes: [] });
          (text.match(/@(\S+)/g) || []).forEach((x) => {
            const c = s.data.chars.find((c) => c.name.replace(/\s/g, "") === x.slice(1));
            if (c && c.id !== m.id) pushNotif(s.data, c.id, `${m.name}이(가) 타임라인에서 당신을 언급했어요.`, { v: "timeline" });
          });
        }),
        editPost: (id, text) => set((s) => { const p = s.data.posts.find((p) => p.id === id); if (p) { p.text = text; p.edited = true; } }),
        deletePost: (id) => set((s) => { s.data.posts = s.data.posts.filter((p) => p.id !== id); }),
        toggleLike: (id) => set((s) => {
          const m = mine(s.data); const p = s.data.posts.find((p) => p.id === id); if (!m || !p) return;
          const i = p.likes.indexOf(m.id);
          if (i < 0) p.likes.push(m.id); else p.likes.splice(i, 1);
        }),
        talk: (postId, text) => {
          const id = uid();
          set((s) => {
            const m = mine(s.data); const p = s.data.posts.find((p) => p.id === postId); if (!m || !p) return;
            const now = get().now();
            s.data.rooms.push({
              id, members: [p.charId, m.id],
              source: { postId: p.id, charId: p.charId, stage: p.stage, text: p.text, images: [...p.images], at: p.at },
              messages: [{ id: uid(), charId: m.id, stage: s.data.stage, text, at: now }],
              status: "open", lastAt: now, read: { [m.id]: now },
            });
            pushNotif(s.data, p.charId, `${m.name}이(가) 당신의 글에 말을 걸었어요.`, { v: "room", id });
          });
          return id;
        },

        rpSend: (roomId, text, image) => set((s) => {
          const m = mine(s.data); const r = s.data.rooms.find((r) => r.id === roomId); if (!m || !r) return;
          const now = get().now();
          r.messages.push({ id: uid(), charId: m.id, stage: s.data.stage, text, image, at: now });
          r.lastAt = now; r.read[m.id] = now;
          const o = r.members.find((x) => x !== m.id)!;
          pushNotif(s.data, o, `${m.name}이(가) 역극에 답했어요.`, { v: "room", id: r.id });
        }),
        rpEdit: (roomId, msgId, text) => set((s) => {
          const r = s.data.rooms.find((r) => r.id === roomId); const x = r?.messages.find((x) => x.id === msgId);
          if (x) { x.text = text; x.edited = true; }
        }),
        rpDone: (roomId) => set((s) => { const r = s.data.rooms.find((r) => r.id === roomId); if (r) r.status = "done"; }),
        rpReopen: (roomId) => set((s) => { const r = s.data.rooms.find((r) => r.id === roomId); if (r) r.status = "open"; }),
        markRoomRead: (roomId) => set((s) => {
          const m = mine(s.data); const r = s.data.rooms.find((r) => r.id === roomId);
          if (m && r && r.members.includes(m.id)) r.read[m.id] = get().now();
        }),
        dormSend: (dormId, text, image) => set((s) => {
          const m = mine(s.data); if (!m) return;
          const k = `${dormId}-${s.data.stage}`;
          (s.data.dormMsgs[k] = s.data.dormMsgs[k] || []).push({ id: uid(), charId: m.id, stage: s.data.stage, text, image, at: get().now() });
        }),

        setCalSel: (d) => set((s) => { s.ui.calSel = d; const [y, m] = d.split("-"); s.ui.calMonth = [+y, +m - 1]; }),
        moveCalMonth: (delta) => set((s) => {
          let [y, m] = s.ui.calMonth; m += delta;
          if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
          s.ui.calMonth = [y, m];
        }),
        addEvent: (e) => set((s) => { s.data.events.push({ id: uid(), ...e }); s.ui.calSel = e.date; }),

        setShopCat: (c) => set((s) => { s.ui.shopCat = c; }),
        buy: (itemId) => {
          let got: Item | null = null;
          set((s) => {
            const m = mine(s.data); const i = s.data.items.find((i) => i.id === itemId); if (!m || !i) return;
            const own = m.bought?.[i.id] || 0;
            if (m.money < i.price || i.stock === 0 || (i.limit && own >= i.limit)) return;
            m.money -= i.price; if (i.stock > 0) i.stock--;
            m.bought = m.bought || {}; m.bought[i.id] = own + 1;
            m.tx.unshift({ at: get().now(), text: `상점: ${i.name}`, amt: -i.price });
            if (i.instant) {
              const dolls = s.data.items.filter((x) => x.cat === "인형");
              const rare = dolls.find((x) => x.id === "doll-sun")!;
              const common = dolls.filter((x) => x.id !== "doll-sun");
              const doll = Math.random() < 0.06 ? rare : common[rnd(0, common.length - 1)];
              addInv(m, doll.id, 1); got = { ...doll };
            } else {
              addInv(m, i.id, i.qty || 1); got = { ...i };
            }
          });
          return got;
        },
        gift: (itemId, to, memo) => set((s) => {
          const m = mine(s.data); const o = s.data.chars.find((c) => c.id === to); const it = s.data.items.find((i) => i.id === itemId);
          if (!m || !o || !it || !(m.inv[itemId] > 0)) return;
          addInv(m, itemId, -1); addInv(o, itemId, 1);
          pushNotif(s.data, to, `${m.name}이(가) ${it.name}을(를) 선물했어요.${memo ? ` “${memo}”` : ""}`, { v: "profile", id: to });
        }),
        openCookie: () => { set((s) => { const m = mine(s.data); if (m) addInv(m, "cookie", -1); }); return FORTUNES[rnd(0, FORTUNES.length - 1)]; },
        listenEgg: () => HEARTS[rnd(0, HEARTS.length - 1)],
        drinkSolis: () => {
          set((s) => {
            const m = mine(s.data); if (!m || !(m.inv.drink > 0)) return;
            const day = ymd(new Date(get().now()));
            m.jobDay = m.jobDay?.day === day ? m.jobDay : { day, n: 0, bonus: 0 };
            m.jobDay.bonus++; addInv(m, "drink", -1);
          });
          const m = get().me(); return m ? jobLeft(m, get().now()) : 0;
        },
        submitExcuse: () => set((s) => {
          const m = mine(s.data); if (!m || !(m.inv.excuse > 0)) return;
          addInv(m, "excuse", -1);
          s.data.adminLog.unshift({ at: get().now(), text: `${m.name}: 지각사유서 제출 (프로필 제출 1일 연장)` });
        }),
        enterDorm: (dormId) => set((s) => {
          const m = mine(s.data); if (!m || !(m.inv.key > 0)) return;
          addInv(m, "key", -1); m.visit = { dorm: dormId, until: get().now() + 24 * H };
        }),

        ration: () => {
          let n = 0;
          set((s) => {
            const m = mine(s.data); if (!m || rationToday(m, get().now())) return;
            n = RATION[gIdx(m.scores.kw)]; addInv(m, "ration", n); m.ration = { day: ymd(new Date(get().now())) };
          });
          return n;
        },
        studyStart: (subjectId, useJokbo) => {
          let err: string | null = null;
          set((s) => {
            const m = mine(s.data); if (!m) return;
            const now = get().now(); const day = ymd(new Date(now));
            m.study = m.study?.day === day ? m.study : { day, n: 0 };
            if (m.study.n >= STUDY_PER_DAY) { err = "오늘은 더 공부할 수 없어요."; return; }
            if (m.studyJob) { err = "이미 공부 중이에요."; return; }
            if (subjectId === "kw" && (m.inv.ration || 0) < KW_COST) { err = "광휘 실습에는 배급 솔리스가 필요해요."; return; }
            if (subjectId === "kw") addInv(m, "ration", -KW_COST);
            const jb = useJokbo && m.inv.jokbo > 0; if (jb) addInv(m, "jokbo", -1);
            m.study.n++; m.studyJob = { subject: subjectId, start: now, jokbo: jb };
          });
          return err;
        },
        studyFinish: () => {
          let out: StudyResult | null = null;
          set((s) => {
            const m = mine(s.data); const sj = m?.studyJob; if (!m || !sj) return;
            const now = get().now(); if (now - sj.start < STUDY_MS) return;
            const sub = subject(sj.subject); const mx = sub.max || 10;
            const before = m.scores[sub.id]; const g0 = gIdx(before);
            const base = rnd(0, g0 >= 3 ? Math.round(mx * 0.6) : mx);
            const gain = base + (sj.jokbo ? JOKBO : 0);
            m.scores[sub.id] = before + gain; m.studyJob = null;
            const flavor = base === 0 && sj.jokbo ? "졸았지만 족보 덕분에 살았다." : gain === 0 ? "책을 펴자마자 잠들었다…" : gain <= 3 ? "집중이 잘 되지 않았다." : gain <= 7 ? "꽤 진도를 나갔다." : "오늘은 머리가 맑다!";
            out = { subject: sub.id, before, after: m.scores[sub.id], gain, base, jokbo: sj.jokbo, flavor, left: STUDY_PER_DAY - (m.study?.n ?? 0) };
          });
          return out;
        },
        jobStart: (jobId) => {
          let err: string | null = null;
          set((s) => {
            const m = mine(s.data); if (!m) return;
            const now = get().now();
            if (m.job) { err = "이미 아르바이트 중이에요."; return; }
            if (jobLeft(m, now) <= 0) { err = "오늘은 아르바이트를 더 할 수 없어요."; return; }
            const day = ymd(new Date(now));
            m.jobDay = m.jobDay?.day === day ? m.jobDay : { day, n: 0, bonus: 0 };
            m.jobDay.n++; m.job = { id: jobId, start: now };
          });
          return err;
        },
        jobFinish: () => {
          let out: JobResult | null = null;
          set((s) => {
            const m = mine(s.data); if (!m?.job) return;
            const now = get().now(); if (now - m.job.start < JOB_MS) return;
            const j = s.data.jobs.find((x) => x.id === m.job!.id)!;
            const g = gIdx(m.scores[j.subject]); const rate = j.rates[g];
            const ok = Math.random() * 100 < rate;
            const amt = ok ? rnd(j.win[0], j.win[1]) : rnd(j.lose[0], j.lose[1]);
            m.money += amt; m.tx.unshift({ at: now, text: `아르바이트: ${j.name} (${ok ? "성공" : "실패"})`, amt }); m.job = null;
            out = { jobId: j.id, ok, amt, rate, grade: g };
          });
          return out;
        },
        transfer: (to, amt, memo) => {
          let err: string | null = null;
          set((s) => {
            const m = mine(s.data); const o = s.data.chars.find((c) => c.id === to);
            if (!m || !o) { err = "받을 캐릭터를 골라 주세요."; return; }
            if (!(amt >= 2)) { err = "2그로셴 이상 보낼 수 있어요."; return; }
            if (amt > m.money) { err = "지갑에 있는 것보다 많이 보낼 수 없어요."; return; }
            const recv = Math.floor(amt * (1 - TRANSFER_FEE)); const now = get().now();
            m.money -= amt; o.money += recv;
            m.tx.unshift({ at: now, text: `${o.name}에게 송금 (수수료 ${amt - recv})`, amt: -amt });
            o.tx.unshift({ at: now, text: `${m.name}에게서 받음${memo ? ` · ${memo}` : ""}`, amt: recv });
            pushNotif(s.data, to, `${m.name}이(가) ${recv}그로셴을 보냈어요.${memo ? ` “${memo}”` : ""}`, { v: "profile", id: to });
          });
          return err;
        },

        saveProfile: (stage, p) => set((s) => { const m = mine(s.data); if (m) m.profiles[stage] = p; }),
        createCharacter: ({ name, dorm, gender, height, scores }) => {
          const id = uid();
          set((s) => {
            s.data.chars.push({
              id, name, dorm, owner: "me", money: START_MONEY, inv: {},
              profiles: { 0: { gender, age: "11세", height, pers: "", text: "" } },
              scores: scoresFrom(scores), tx: [{ at: get().now(), text: "입학 지원금", amt: START_MONEY }],
            });
            s.session.charId = id;
          });
          return id;
        },

        letterNew: (text) => {
          let out: "sent" | "lost" | "no-stamp" = "no-stamp";
          set((s) => {
            const m = mine(s.data); if (!m || !(m.inv.stamp > 0)) return;
            addInv(m, "stamp", -1);
            const now = get().now();
            if (Math.random() < 0.1) {
              out = "lost";
              pushNotif(s.data, m.id, "마법 우표가 길을 잃었어요. 편지가 선생님의 책상 위에 도착했대요…", { v: "timeline" });
              return;
            }
            const others = s.data.chars.filter((x) => x.id !== m.id);
            const o = others[rnd(0, others.length - 1)];
            const n = () => "#" + pad(rnd(1, 99));
            s.data.threads.push({
              id: uid(), a: m.id, b: o.id, alias: { [m.id]: "익명의 편지인 " + n(), [o.id]: "익명의 편지인 " + n() },
              letters: [{ from: m.id, text, sentAt: now, deliverAt: now + LETTER_MS, read: false }],
            });
            out = "sent";
          });
          return out;
        },
        letterReply: (threadId, text) => {
          let out: "sent" | "no-pigeon" = "no-pigeon";
          set((s) => {
            const m = mine(s.data); const t = s.data.threads.find((t) => t.id === threadId);
            if (!m || !t || !(m.inv.pigeon > 0)) return;
            addInv(m, "pigeon", -1); const now = get().now();
            t.letters.push({ from: m.id, text, sentAt: now, deliverAt: now + LETTER_MS, read: false });
            out = "sent";
          });
          return out;
        },
        markLetterRead: (threadId, idx) => set((s) => {
          const t = s.data.threads.find((t) => t.id === threadId); const l = t?.letters[idx];
          if (l && l.from !== s.session.charId) l.read = true;
        }),

        markNotif: (id) => set((s) => { const n = s.data.notifs.find((n) => n.id === id); if (n) n.read = true; }),

        setStage: (st) => set((s) => { s.data.stage = st; }),
        semester: () => set((s) => {
          const cnt = s.data.chars.map((c) => ({ id: c.id, dorm: c.dorm, n: SUBJECTS.filter((x) => gIdx(c.scores[x.id]) === 4).length }));
          const topN = Math.max(0, ...cnt.map((x) => x.n));
          s.data.results = {
            topN,
            top: topN ? cnt.filter((x) => x.n === topN).map((x) => x.id) : [],
            dorms: DORMS.filter((d) => d.id !== "fifth").map((d) => ({ id: d.id, n: cnt.filter((x) => x.dorm === d.id).reduce((a, x) => a + x.n, 0) })).sort((a, b) => b.n - a.n),
          };
        }),
        postResults: () => set((s) => {
          const r = s.data.results; if (!r) return;
          const nm = (id: string) => s.data.chars.find((c) => c.id === id)?.name ?? "";
          const dn = (id: DormId) => DORMS.find((d) => d.id === id)!.name;
          s.data.notice = { text: `학기말 집계 — 수석: ${r.top.map(nm).join(", ") || "없음"}. 학부 순위: ${r.dorms.map((x) => `${dn(x.id)} ${x.n}`).join(" · ")}`, at: get().now() };
        }),
        saveNotice: (text) => set((s) => { s.data.notice = text ? { text, at: get().now() } : null; }),
        addItem: (i) => set((s) => {
          s.data.items.push({ id: uid(), name: i.name, price: i.price, cat: i.cat || "잡화", stock: i.stock, limit: 0, icon: "scarf", desc: i.desc, use: "" });
        }),
        adjust: (charId, target, n, why) => {
          let label = "";
          set((s) => {
            const c = s.data.chars.find((c) => c.id === charId); if (!c) return;
            const now = get().now();
            if (target === "money") {
              c.money = Math.max(0, c.money + n);
              c.tx.unshift({ at: now, text: `운영 조정${why ? `: ${why}` : ""}`, amt: n });
              label = `재화 ${n > 0 ? "+" : ""}${n}그로셴`;
            } else {
              c.scores[target] = Math.max(0, c.scores[target] + n);
              label = `${subject(target).name} ${n > 0 ? "+" : ""}${n}점`;
            }
            pushNotif(s.data, c.id, `운영자가 ${label}을(를) 조정했어요.${why ? ` (${why})` : ""}`, { v: "profile", id: c.id });
            s.data.adminLog.unshift({ at: now, text: `${c.name}: ${label}${why ? ` · ${why}` : ""}` });
          });
          return label;
        },

        shiftTime: (h) => set((s) => { s.shift += h * H; }),
        reset: () => set((s) => { s.data = seed(); s.shift = 0; s.ui = todayUI(); s.session = { charId: null, admin: false }; }),
      };
    }),
    {
      name: "meridies-v1",
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({ data: s.data, session: s.session, shift: s.shift, ui: s.ui }),
      migrate: () => ({ data: seed(), session: { charId: null, admin: false }, shift: 0, ui: todayUI() }),
      onRehydrateStorage: () => () => { useStore.setState({ hydrated: true }); },
    },
  ),
);

/** Grade label helpers shared by views. */
export const gradeOf = (score: number) => GRADES[gIdx(score)];
