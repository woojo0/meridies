/**
 * 메리디에스 Cloud Functions
 * 확률·시간·재화 계산은 전부 여기서 합니다. 클라이언트는 결과만 받습니다.
 * 시간은 서버 시각 기준, 하루는 한국 시간(KST) 자정에 초기화됩니다.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Transaction, DocumentReference } from "firebase-admin/firestore";
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import {
  DORMS, FORTUNES, GRADES, H, HEARTS, ITEMS, JOBS, JOB_MS, JOB_PER_DAY, JOKBO, KW_COST, KW_MAX_ALLOC, LETTER_MS, LOST_LETTER_RATE,
  RARE_DOLL_RATE, RATION, START_MONEY, STAGES, STUDY_MS, STUDY_PER_DAY, SUBJECTS, TOTAL_ALLOC, TRANSFER_FEE, TRANSFER_MIN, type SubjectId,
} from "./data";

initializeApp();
const db = getFirestore();
const REGION = "asia-northeast3";
type Handler<T = unknown> = (req: CallableRequest<T>) => Promise<unknown>;
const handler = <T = unknown>(h: Handler<T>) => h;
const fn = <T = unknown>(h: Handler<T>) => onCall<T>({ region: REGION }, h);
const HANDLERS: Record<string, Handler<never>> = {};

/* ───────── 헬퍼 ───────── */
const rnd = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const gIdx = (s: number) => Math.min(4, Math.floor(s / 100));
const pad = (n: number) => String(n).padStart(2, "0");
/** KST 기준 날짜 키 */
function kstDay(ms = Date.now()) {
  const d = new Date(ms + 9 * H);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
const bad = (msg: string) => new HttpsError("failed-precondition", msg);

interface Char {
  id: string; name: string; dorm: string; ownerUid: string; money: number; inv: Record<string, number>;
  scores: Record<SubjectId, number>; profiles: Record<string, unknown>;
  study?: { day: string; n: number }; studyJob?: { subject: SubjectId; start: number; jokbo: boolean } | null;
  job?: { id: string; start: number } | null; jobDay?: { day: string; n: number; bonus: number };
  ration?: { day: string }; bought?: Record<string, number>; visit?: { dorm: string; until: number } | null;
}

/** 호출자의 캐릭터를 트랜잭션 안에서 읽어요. 승인된 멤버만. */
async function myChar(tx: Transaction, req: CallableRequest<unknown>): Promise<{ ref: DocumentReference; c: Char }> {
  if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요해요.");
  const u = await tx.get(db.doc(`users/${req.auth.uid}`));
  const ud = u.data();
  if (!ud || (ud.status !== "member" && req.auth.token.admin !== true)) throw new HttpsError("permission-denied", "승인된 멤버만 할 수 있어요.");
  if (!ud.charId) throw bad("먼저 캐릭터를 등록해 주세요.");
  const ref = db.doc(`characters/${ud.charId}`);
  const snap = await tx.get(ref);
  if (!snap.exists) throw bad("캐릭터를 찾을 수 없어요.");
  return { ref, c: { id: snap.id, ...(snap.data() as Omit<Char, "id">) } };
}
function requireAdmin(req: CallableRequest<unknown>) {
  if (req.auth?.token.admin !== true) throw new HttpsError("permission-denied", "운영자만 할 수 있어요.");
}
function addInv(inv: Record<string, number>, id: string, n: number) {
  inv[id] = (inv[id] || 0) + n;
  if (inv[id] <= 0) delete inv[id];
  return inv;
}
function notify(tx: Transaction, to: string, text: string, link?: { v: string; id?: string }) {
  tx.set(db.collection("notifs").doc(), { to, text, link: link ?? null, at: Date.now(), read: false });
}
function tx$(tx: Transaction, charId: string, text: string, amt: number) {
  tx.set(db.collection(`characters/${charId}/tx`).doc(), { at: Date.now(), text, amt });
}
function adminLog(tx: Transaction, text: string) {
  tx.set(db.collection("adminLog").doc(), { at: Date.now(), text });
}
async function itemById(id: string) {
  const s = await db.doc(`items/${id}`).get();
  if (!s.exists) throw bad("아이템을 찾을 수 없어요.");
  return { id, ...(s.data() as Record<string, unknown>) } as { id: string; name: string; price: number; stock: number; limit: number; qty?: number; instant?: boolean; cat: string; desc: string };
}

/* ───────── 가입·운영자 ───────── */
const h_setAdmin = handler<{ uid: string; admin: boolean }>(async (req) => {
  requireAdmin(req);
  const { uid, admin } = req.data;
  if (!uid) throw new HttpsError("invalid-argument", "uid가 필요해요.");
  await getAuth().setCustomUserClaims(uid, { admin: !!admin });
  return { ok: true };
});

const h_approveUser = handler<{ uid: string; status: "member" | "pending" | "suspended" }>(async (req) => {
  requireAdmin(req);
  const { uid, status } = req.data;
  await db.doc(`users/${uid}`).set({ status, reviewedAt: Date.now() }, { merge: true });
  return { ok: true };
});

/** 운영자가 한 번 눌러 상점 아이템·아르바이트·기본 설정을 심어요. 이미 있으면 건너뜀. */
const h_seedDefaults = handler(async (req) => {
  requireAdmin(req);
  const batch = db.batch();
  for (const i of ITEMS) batch.set(db.doc(`items/${i.id}`), i, { merge: true });
  for (const j of JOBS) batch.set(db.doc(`jobs/${j.id}`), j, { merge: true });
  const g = await db.doc("settings/global").get();
  if (!g.exists) batch.set(db.doc("settings/global"), { stage: 0, notice: null, updatedAt: Date.now() });
  for (const d of DORMS) batch.set(db.doc(`dorms/${d}-0`), { dorm: d, stage: 0, open: true }, { merge: true });
  await batch.commit();
  return { ok: true, items: ITEMS.length, jobs: JOBS.length };
});

/* ───────── 캐릭터 등록 ───────── */
type StageProfileIn = { pers?: string; text?: string; detail?: string; age?: string; avatar?: string | null; body?: string | null };
const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const url = (v: unknown) => (typeof v === "string" && /^https:\/\/(firebasestorage\.googleapis\.com|storage\.googleapis\.com)\//.test(v) ? v : null);
const h_createCharacter = handler<{ name: string; dorm: string; gender: string; height: string; birthday?: string; scores: number[]; profiles?: Record<string, StageProfileIn>; secret?: string }>(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "로그인이 필요해요.");
  const uid = req.auth.uid;
  const { name, dorm, gender, height, birthday, scores, profiles: pin = {}, secret } = req.data;
  if (!name?.trim() || name.length > 20) throw new HttpsError("invalid-argument", "이름은 1~20자예요.");
  if (!DORMS.includes(dorm as (typeof DORMS)[number])) throw new HttpsError("invalid-argument", "학부가 올바르지 않아요.");
  if (!Array.isArray(scores) || scores.length !== 9 || scores.some((v) => !Number.isInteger(v) || v < 0)) throw new HttpsError("invalid-argument", "성적 분배가 올바르지 않아요.");
  if (scores.reduce((a, b) => a + b, 0) !== TOTAL_ALLOC) throw bad(`성적 합계는 정확히 ${TOTAL_ALLOC}점이어야 해요.`);
  if (scores[0] > KW_MAX_ALLOC) throw bad(`광휘 실습은 최대 ${KW_MAX_ALLOC}점까지만 넣을 수 있어요.`);

  return db.runTransaction(async (tx) => {
    const uref = db.doc(`users/${uid}`);
    const u = (await tx.get(uref)).data();
    if (!u || (u.status !== "member" && req.auth?.token.admin !== true)) throw new HttpsError("permission-denied", "가입 승인 뒤에 등록할 수 있어요.");
    if (u.charId) throw bad("계정당 캐릭터는 1명이에요.");
    const ref = db.collection("characters").doc();
    const curStage = Number(((await tx.get(db.doc("settings/global"))).data()?.stage) ?? 0);
    const ages = ["11세", "15세", "성인"];
    const profiles: Record<string, unknown> = {};
    const privateProfiles: Record<string, unknown> = {};
    for (const st of ["0", "1", "2"]) {
      const p = pin[st] ?? {};
      const filled = st === "0" || !!(str(p.pers, 200) || str(p.text, 5000) || str(p.detail, 10000) || url(p.avatar) || url(p.body));
      if (!filled) continue;
      const prof = {
        gender: str(gender, 20), height: str(height, 20), birthday: str(birthday, 20), age: str(p.age, 20) || ages[+st],
        pers: str(p.pers, 200), text: str(p.text, 5000), detail: str(p.detail, 10000), extra: [],
        avatar: url(p.avatar), body: url(p.body),
      };
      if (+st > curStage) privateProfiles[st] = prof; else profiles[st] = prof;
    }
    const sc = {} as Record<SubjectId, number>;
    SUBJECTS.forEach((s, i) => (sc[s.id] = scores[i]));
    tx.set(ref, {
      name: name.trim(), dorm, ownerUid: uid, money: START_MONEY, inv: {}, scores: sc,
      profiles,
      createdAt: Date.now(),
    });
    tx$(tx, ref.id, "입학 지원금", START_MONEY);
    if (typeof secret === "string" && secret.trim()) tx.set(ref.collection("private").doc("secret"), { text: secret.slice(0, 10000), updatedAt: Date.now() });
    for (const [st, prof] of Object.entries(privateProfiles)) tx.set(ref.collection("private").doc(`stage${st}`), prof as Record<string, unknown>);
    tx.set(uref, { charId: ref.id }, { merge: true });
    return { id: ref.id };
  });
});

/* ───────── 솔리스 배급 ───────── */
const h_ration = handler(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    const day = kstDay();
    if (c.ration?.day === day) throw bad("오늘 배급은 이미 받았어요.");
    const g = gIdx(c.scores.kw);
    const n = RATION[g];
    tx.update(ref, { inv: addInv(c.inv, "ration", n), ration: { day } });
    return { n, grade: GRADES[g] };
  }),
);

/* ───────── 공부 ───────── */
const h_studyStart = handler<{ subject: SubjectId; useJokbo: boolean }>(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    const sub = SUBJECTS.find((s) => s.id === req.data.subject);
    if (!sub) throw new HttpsError("invalid-argument", "과목이 올바르지 않아요.");
    const day = kstDay();
    const study = c.study?.day === day ? c.study : { day, n: 0 };
    if (study.n >= STUDY_PER_DAY) throw bad("오늘은 더 공부할 수 없어요.");
    if (c.studyJob) throw bad("이미 공부 중이에요.");
    const inv = { ...c.inv };
    if (sub.id === "kw") {
      if ((inv.ration || 0) < KW_COST) throw bad("광휘 실습에는 배급 솔리스가 필요해요.");
      addInv(inv, "ration", -KW_COST);
    }
    const jokbo = !!req.data.useJokbo && (inv.jokbo || 0) > 0;
    if (jokbo) addInv(inv, "jokbo", -1);
    tx.update(ref, { inv, study: { day, n: study.n + 1 }, studyJob: { subject: sub.id, start: Date.now(), jokbo } });
    return { ok: true };
  }),
);

const h_studyFinish = handler(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    const sj = c.studyJob;
    if (!sj) throw bad("공부 중이 아니에요.");
    if (Date.now() - sj.start < STUDY_MS) throw bad("아직 끝나지 않았어요.");
    const sub = SUBJECTS.find((s) => s.id === sj.subject)!;
    const mx = sub.max || 10;
    const before = c.scores[sub.id];
    const g0 = gIdx(before);
    const base = rnd(0, g0 >= 3 ? Math.round(mx * 0.6) : mx);
    const gain = base + (sj.jokbo ? JOKBO : 0);
    const after = before + gain;
    tx.update(ref, { [`scores.${sub.id}`]: after, studyJob: null });
    const flavor = base === 0 && sj.jokbo ? "졸았지만 족보 덕분에 살았다." : gain === 0 ? "책을 펴자마자 잠들었다…" : gain <= 3 ? "집중이 잘 되지 않았다." : gain <= 7 ? "꽤 진도를 나갔다." : "오늘은 머리가 맑다!";
    const left = STUDY_PER_DAY - (c.study?.day === kstDay() ? c.study.n : 0);
    return { subject: sub.id, before, after, gain, base, jokbo: sj.jokbo, flavor, left };
  }),
);

/* ───────── 아르바이트 ───────── */
function jobLeft(c: Char) {
  const jd = c.jobDay?.day === kstDay() ? c.jobDay : { n: 0, bonus: 0 };
  return JOB_PER_DAY + jd.bonus - jd.n;
}
const h_jobStart = handler<{ jobId: string }>(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    const j = (await tx.get(db.doc(`jobs/${req.data.jobId}`))).data();
    if (!j) throw new HttpsError("invalid-argument", "아르바이트가 올바르지 않아요.");
    if (c.job) throw bad("이미 아르바이트 중이에요.");
    if (jobLeft(c) <= 0) throw bad("오늘은 아르바이트를 더 할 수 없어요.");
    const day = kstDay();
    const jd = c.jobDay?.day === day ? c.jobDay : { day, n: 0, bonus: 0 };
    tx.update(ref, { jobDay: { ...jd, n: jd.n + 1 }, job: { id: req.data.jobId, start: Date.now() } });
    return { ok: true };
  }),
);
const h_jobFinish = handler(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    if (!c.job) throw bad("아르바이트 중이 아니에요.");
    if (Date.now() - c.job.start < JOB_MS) throw bad("아직 끝나지 않았어요.");
    const j = (await tx.get(db.doc(`jobs/${c.job.id}`))).data() as typeof JOBS[number];
    const g = gIdx(c.scores[j.subject]);
    const rate = j.rates[g];
    const ok = Math.random() * 100 < rate;
    const amt = ok ? rnd(j.win[0], j.win[1]) : rnd(j.lose[0], j.lose[1]);
    tx.update(ref, { money: c.money + amt, job: null });
    tx$(tx, c.id, `아르바이트: ${j.name} (${ok ? "성공" : "실패"})`, amt);
    return { jobId: j.id, ok, amt, rate, grade: g };
  }),
);

/* ───────── 송금 ───────── */
const h_transfer = handler<{ to: string; amt: number; memo?: string }>(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    const amt = Math.floor(Number(req.data.amt));
    if (!(amt >= TRANSFER_MIN)) throw bad(`${TRANSFER_MIN}그로셴 이상 보낼 수 있어요.`);
    if (amt > c.money) throw bad("지갑에 있는 것보다 많이 보낼 수 없어요.");
    if (req.data.to === c.id) throw bad("자기 자신에게는 보낼 수 없어요.");
    const oref = db.doc(`characters/${req.data.to}`);
    const o = (await tx.get(oref)).data() as Char | undefined;
    if (!o) throw bad("받을 캐릭터를 찾을 수 없어요.");
    const recv = Math.floor(amt * (1 - TRANSFER_FEE));
    const memo = (req.data.memo ?? "").slice(0, 80);
    tx.update(ref, { money: c.money - amt });
    tx.update(oref, { money: o.money + recv });
    tx$(tx, c.id, `${o.name}에게 송금 (수수료 ${amt - recv})`, -amt);
    tx$(tx, req.data.to, `${c.name}에게서 받음${memo ? ` · ${memo}` : ""}`, recv);
    notify(tx, req.data.to, `${c.name}이(가) ${recv}그로셴을 보냈어요.${memo ? ` “${memo}”` : ""}`, { v: "profile", id: req.data.to });
    return { recv };
  }),
);

/* ───────── 상점·인벤토리 ───────── */
const h_buyItem = handler<{ itemId: string }>(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    const iref = db.doc(`items/${req.data.itemId}`);
    const i = (await tx.get(iref)).data() as Awaited<ReturnType<typeof itemById>> | undefined;
    if (!i || (i as { hidden?: boolean }).hidden) throw bad("살 수 없는 물건이에요.");
    const own = c.bought?.[req.data.itemId] || 0;
    if (c.money < i.price) throw bad("재화가 부족해요.");
    if (i.stock === 0) throw bad("품절이에요.");
    if (i.limit && own >= i.limit) throw bad("구매 제한에 걸렸어요.");
    const inv = { ...c.inv };
    let got: { id: string; name: string; desc: string } = { id: req.data.itemId, name: i.name, desc: i.desc };
    if (i.instant) {
      const dolls = ITEMS.filter((x) => x.cat === "인형");
      const rare = dolls.find((x) => x.id === "doll-sun")!;
      const common = dolls.filter((x) => x.id !== "doll-sun");
      const doll = Math.random() < RARE_DOLL_RATE ? rare : common[rnd(0, common.length - 1)];
      addInv(inv, doll.id, 1);
      got = { id: doll.id, name: doll.name, desc: doll.desc };
    } else {
      addInv(inv, req.data.itemId, i.qty || 1);
    }
    tx.update(ref, { money: c.money - i.price, inv, bought: { ...(c.bought ?? {}), [req.data.itemId]: own + 1 } });
    if (i.stock > 0) tx.update(iref, { stock: i.stock - 1 });
    tx$(tx, c.id, `상점: ${i.name}`, -i.price);
    return { got };
  }),
);

const h_giftItem = handler<{ itemId: string; to: string; memo?: string }>(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    if (!(c.inv[req.data.itemId] > 0)) throw bad("가지고 있지 않은 물건이에요.");
    const oref = db.doc(`characters/${req.data.to}`);
    const o = (await tx.get(oref)).data() as Char | undefined;
    if (!o || req.data.to === c.id) throw bad("받을 캐릭터를 찾을 수 없어요.");
    const item = ITEMS.find((x) => x.id === req.data.itemId) ?? (await itemById(req.data.itemId));
    tx.update(ref, { inv: addInv({ ...c.inv }, req.data.itemId, -1) });
    tx.update(oref, { inv: addInv({ ...o.inv }, req.data.itemId, 1) });
    const memo = (req.data.memo ?? "").slice(0, 80);
    notify(tx, req.data.to, `${c.name}이(가) ${item.name}을(를) 선물했어요.${memo ? ` “${memo}”` : ""}`, { v: "profile", id: req.data.to });
    return { ok: true };
  }),
);

const h_useItem = handler<{ itemId: string; dorm?: string }>(async (req) =>
  db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    const id = req.data.itemId;
    if (id !== "egg" && !(c.inv[id] > 0)) throw bad("가지고 있지 않은 물건이에요.");
    const inv = { ...c.inv };
    switch (id) {
      case "cookie": addInv(inv, id, -1); tx.update(ref, { inv }); return { text: FORTUNES[rnd(0, FORTUNES.length - 1)] };
      case "egg": return { text: HEARTS[rnd(0, HEARTS.length - 1)] };
      case "drink": {
        const day = kstDay();
        const jd = c.jobDay?.day === day ? c.jobDay : { day, n: 0, bonus: 0 };
        addInv(inv, id, -1);
        tx.update(ref, { inv, jobDay: { ...jd, bonus: jd.bonus + 1 } });
        return { left: JOB_PER_DAY + jd.bonus + 1 - jd.n };
      }
      case "excuse": addInv(inv, id, -1); tx.update(ref, { inv }); adminLog(tx, `${c.name}: 지각사유서 제출 (프로필 제출 1일 연장)`); return { ok: true };
      case "key": {
        if (!req.data.dorm || !DORMS.includes(req.data.dorm as (typeof DORMS)[number]) || req.data.dorm === c.dorm) throw bad("들어갈 기숙사를 골라 주세요.");
        addInv(inv, id, -1);
        tx.update(ref, { inv, visit: { dorm: req.data.dorm, until: Date.now() + 24 * H } });
        return { ok: true };
      }
      default: throw bad("사용할 수 없는 물건이에요.");
    }
  }),
);

/* ───────── 익명 펜팔 ───────── */
const h_letterSend = handler<{ text: string }>(async (req) => {
  const text = (req.data.text ?? "").trim().slice(0, 3000);
  if (!text) throw new HttpsError("invalid-argument", "편지를 써 주세요.");
  // 무작위 수신자는 트랜잭션 밖에서 고르고, 안에서 검증
  const all = await db.collection("characters").select("name").get();
  return db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    if (!(c.inv.stamp > 0)) throw bad("마법 우표가 필요해요.");
    tx.update(ref, { inv: addInv({ ...c.inv }, "stamp", -1) });
    if (Math.random() < LOST_LETTER_RATE) {
      notify(tx, c.id, "마법 우표가 길을 잃었어요. 편지가 선생님의 책상 위에 도착했대요…", { v: "timeline" });
      return { result: "lost" };
    }
    const others = all.docs.filter((d) => d.id !== c.id);
    if (!others.length) throw bad("편지를 받을 사람이 아직 없어요.");
    const o = others[rnd(0, others.length - 1)];
    const alias = () => "익명의 편지인 #" + pad(rnd(1, 99));
    const tref = db.collection("threads").doc();
    const now = Date.now();
    tx.set(tref, { a: c.id, b: o.id, alias: { [c.id]: alias(), [o.id]: alias() }, createdAt: now, lastAt: now });
    tx.set(tref.collection("letters").doc(), { from: c.id, text, sentAt: now, deliverAt: now + LETTER_MS, read: false });
    return { result: "sent" };
  });
});

const h_letterReply = handler<{ threadId: string; text: string }>(async (req) => {
  const text = (req.data.text ?? "").trim().slice(0, 3000);
  if (!text) throw new HttpsError("invalid-argument", "편지를 써 주세요.");
  return db.runTransaction(async (tx) => {
    const { ref, c } = await myChar(tx, req);
    const tref = db.doc(`threads/${req.data.threadId}`);
    const t = (await tx.get(tref)).data();
    if (!t || (t.a !== c.id && t.b !== c.id)) throw bad("편지 묶음을 찾을 수 없어요.");
    if (!(c.inv.pigeon > 0)) throw bad("마법 비둘기가 필요해요.");
    tx.update(ref, { inv: addInv({ ...c.inv }, "pigeon", -1) });
    const now = Date.now();
    tx.set(tref.collection("letters").doc(), { from: c.id, text, sentAt: now, deliverAt: now + LETTER_MS, read: false });
    tx.update(tref, { lastAt: now });
    return { result: "sent" };
  });
});

/* ───────── 운영자 ───────── */
const h_adminAdjust = handler<{ charId: string; target: SubjectId | "money"; n: number; why?: string }>(async (req) => {
  requireAdmin(req);
  const n = Math.trunc(Number(req.data.n));
  if (!n) throw new HttpsError("invalid-argument", "증감 값을 넣어 주세요.");
  const why = (req.data.why ?? "").slice(0, 100);
  return db.runTransaction(async (tx) => {
    const ref = db.doc(`characters/${req.data.charId}`);
    const c = (await tx.get(ref)).data() as Char | undefined;
    if (!c) throw bad("캐릭터를 찾을 수 없어요.");
    let label: string;
    if (req.data.target === "money") {
      tx.update(ref, { money: Math.max(0, c.money + n) });
      tx$(tx, req.data.charId, `운영 조정${why ? `: ${why}` : ""}`, n);
      label = `재화 ${n > 0 ? "+" : ""}${n}그로셴`;
    } else {
      const sub = SUBJECTS.find((s) => s.id === req.data.target);
      if (!sub) throw new HttpsError("invalid-argument", "항목이 올바르지 않아요.");
      tx.update(ref, { [`scores.${sub.id}`]: Math.max(0, c.scores[sub.id] + n) });
      label = `${sub.name} ${n > 0 ? "+" : ""}${n}점`;
    }
    notify(tx, req.data.charId, `운영자가 ${label}을(를) 조정했어요.${why ? ` (${why})` : ""}`, { v: "profile", id: req.data.charId });
    adminLog(tx, `${c.name}: ${label}${why ? ` · ${why}` : ""}`);
    return { label };
  });
});

const h_setStage = handler<{ stage: 0 | 1 | 2 }>(async (req) => {
  requireAdmin(req);
  const stage = req.data.stage;
  if (![0, 1, 2].includes(stage)) throw new HttpsError("invalid-argument", "단계가 올바르지 않아요.");
  const batch = db.batch();
  batch.set(db.doc("settings/global"), { stage, updatedAt: Date.now() }, { merge: true });
  // 미리 써 둔 단계 프로필(비공개)을 공개 프로필로 옮겨요.
  const chars = await db.collection("characters").select().get();
  for (const c of chars.docs) {
    for (let s = 1; s <= stage; s++) {
      const pref = c.ref.collection("private").doc(`stage${s}`);
      const ps = await pref.get();
      if (!ps.exists) continue;
      batch.set(c.ref, { profiles: { [s]: ps.data() } }, { merge: true });
      batch.delete(pref);
    }
  }
  for (const d of DORMS) {
    batch.set(db.doc(`dorms/${d}-${stage}`), { dorm: d, stage, open: true }, { merge: true });
    for (const s of [0, 1, 2]) if (s !== stage) batch.set(db.doc(`dorms/${d}-${s}`), { open: false }, { merge: true });
  }
  batch.set(db.collection("adminLog").doc(), { at: Date.now(), text: `성장 단계 전환: ${STAGES[stage]}` });
  await batch.commit();
  return { ok: true };
});

const h_closeSemester = handler<{ post?: boolean }>(async (req) => {
  requireAdmin(req);
  const chars = await db.collection("characters").get();
  const cnt = chars.docs.map((d) => { const c = d.data() as Char; return { id: d.id, name: c.name, dorm: c.dorm, n: SUBJECTS.filter((s) => gIdx(c.scores[s.id]) === 4).length }; });
  const topN = Math.max(0, ...cnt.map((x) => x.n));
  const top = topN ? cnt.filter((x) => x.n === topN) : [];
  const dorms = DORMS.filter((d) => d !== "fifth").map((d) => ({ id: d, n: cnt.filter((x) => x.dorm === d).reduce((a, x) => a + x.n, 0) })).sort((a, b) => b.n - a.n);
  const results = { topN, top: top.map((x) => x.id), dorms, at: Date.now() };
  const patch: Record<string, unknown> = { results };
  if (req.data?.post) {
    const names: Record<string, string> = { aurora: "아우로라", vesper: "베스퍼", candida: "칸디다", astra: "아스트라" };
    patch.notice = { text: `학기말 집계 — 수석: ${top.map((x) => x.name).join(", ") || "없음"}. 학부 순위: ${dorms.map((x) => `${names[x.id]} ${x.n}`).join(" · ")}`, at: Date.now() };
  }
  await db.doc("settings/global").set(patch, { merge: true });
  return results;
});

/** 운영자: 캐릭터 삭제. 캐릭터 문서와 하위(거래·비밀)를 지우고 계정의 캐릭터 연결을 풀어 다시 등록할 수 있게 해요. 글·역극 기록은 남겨요. */
const h_deleteCharacter = handler<{ charId: string }>(async (req) => {
  requireAdmin(req);
  const ref = db.doc(`characters/${req.data.charId}`);
  const snap = await ref.get();
  if (!snap.exists) throw bad("캐릭터를 찾을 수 없어요.");
  const c = snap.data() as Char;
  const batch = db.batch();
  for (const sub of ["tx", "private"]) {
    const docs = await ref.collection(sub).get();
    docs.forEach((d) => batch.delete(d.ref));
  }
  batch.delete(ref);
  if (c.ownerUid) batch.set(db.doc(`users/${c.ownerUid}`), { charId: null }, { merge: true });
  batch.set(db.collection("adminLog").doc(), { at: Date.now(), text: `캐릭터 삭제: ${c.name}` });
  await batch.commit();
  return { ok: true };
});
HANDLERS["deleteCharacter"] = h_deleteCharacter as Handler<never>;
export const deleteCharacter = fn(h_deleteCharacter);

/* ───────── 내보내기: 개별 함수 + 단일 진입점 api ───────── */
HANDLERS["setAdmin"] = h_setAdmin as Handler<never>;
export const setAdmin = fn(h_setAdmin);
HANDLERS["approveUser"] = h_approveUser as Handler<never>;
export const approveUser = fn(h_approveUser);
HANDLERS["seedDefaults"] = h_seedDefaults as Handler<never>;
export const seedDefaults = fn(h_seedDefaults);
HANDLERS["createCharacter"] = h_createCharacter as Handler<never>;
export const createCharacter = fn(h_createCharacter);
HANDLERS["ration"] = h_ration as Handler<never>;
export const ration = fn(h_ration);
HANDLERS["studyStart"] = h_studyStart as Handler<never>;
export const studyStart = fn(h_studyStart);
HANDLERS["studyFinish"] = h_studyFinish as Handler<never>;
export const studyFinish = fn(h_studyFinish);
HANDLERS["jobStart"] = h_jobStart as Handler<never>;
export const jobStart = fn(h_jobStart);
HANDLERS["jobFinish"] = h_jobFinish as Handler<never>;
export const jobFinish = fn(h_jobFinish);
HANDLERS["transfer"] = h_transfer as Handler<never>;
export const transfer = fn(h_transfer);
HANDLERS["buyItem"] = h_buyItem as Handler<never>;
export const buyItem = fn(h_buyItem);
HANDLERS["giftItem"] = h_giftItem as Handler<never>;
export const giftItem = fn(h_giftItem);
HANDLERS["useItem"] = h_useItem as Handler<never>;
export const useItem = fn(h_useItem);
HANDLERS["letterSend"] = h_letterSend as Handler<never>;
export const letterSend = fn(h_letterSend);
HANDLERS["letterReply"] = h_letterReply as Handler<never>;
export const letterReply = fn(h_letterReply);
HANDLERS["adminAdjust"] = h_adminAdjust as Handler<never>;
export const adminAdjust = fn(h_adminAdjust);
HANDLERS["setStage"] = h_setStage as Handler<never>;
export const setStage = fn(h_setStage);
HANDLERS["closeSemester"] = h_closeSemester as Handler<never>;
export const closeSemester = fn(h_closeSemester);

/**
 * 단일 진입점. 모든 요청이 같은 인스턴스를 쓰므로 콜드 스타트가 줄어요.
 * { action: "ration", data: {...} }
 */
export const api = onCall<{ action: string; data?: unknown }>({ region: REGION, memory: "256MiB", concurrency: 20 }, async (req) => {
  const h = HANDLERS[req.data?.action ?? ""];
  if (!h) throw new HttpsError("not-found", "알 수 없는 요청이에요.");
  return (h as Handler<unknown>)({ ...req, data: req.data.data } as CallableRequest<unknown>);
});
