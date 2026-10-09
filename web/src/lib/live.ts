/**
 * 실제 서버 모드: Firestore 실시간 구독 + 쓰기 + Cloud Functions 호출.
 * 스토어(store.ts)는 모드에 따라 이 모듈 또는 데모 구현으로 위임해요.
 */
import {
  EmailAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updatePassword, type User,
} from "firebase/auth";
import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref as sref, uploadString } from "firebase/storage";
import { DORMS } from "./constants";
import { seed } from "./seed";
import { call, fbAuth, fbDb, fbStorage } from "./firebase";
import { uid as mkId } from "./format";
import type { CalEvent, Character, DormId, Item, Job, Msg, Post, Profile, Room, Stage, SubjectId, Thread } from "./types";
import { useStore, type ChatMsg, type ChatThread, type JobResult, type NewCharacter, type PrivateProfile, type StudyResult } from "./store";
import { increment } from "firebase/firestore";

export interface MemberUser { uid: string; email: string; status: "pending" | "member" | "suspended"; charId: string | null; createdAt?: number }

const subs = new Map<string, Unsubscribe>();
function sub(key: string, start: () => Unsubscribe) {
  if (subs.has(key)) return;
  subs.set(key, start());
}
function unsub(prefix: string) {
  for (const [k, u] of subs) if (k.startsWith(prefix)) { u(); subs.delete(k); }
}
const setData = (patch: Partial<ReturnType<typeof useStore.getState>["data"]>) => useStore.setState((s) => ({ data: { ...s.data, ...patch } }));
const withId = <T,>(d: { id: string; data: () => unknown }) => ({ id: d.id, ...(d.data() as object) }) as T;

let started = false;
let ready = { settings: false, chars: false };
let memberSubscribed = false;
const markReady = (k: keyof typeof ready) => { ready[k] = true; if (ready.settings && ready.chars) useStore.setState({ hydrated: true }); };
const fail = (what: string) => (e: unknown) => {
  const msg = (e as { code?: string; message?: string }).code === "permission-denied" ? `${what}을(를) 읽을 권한이 없어요. 가입 승인 상태를 확인해 주세요.` : `${what} 불러오기 실패: ${(e as Error).message}`;
  useStore.setState({ liveError: msg, hydrated: true });
};

/** 앱이 뜰 때 한 번 호출. 로그인 상태를 따라 구독을 켜고 끕니다. */
export function startLive() {
  if (started) return;
  started = true;
  onAuthStateChanged(fbAuth(), async (user) => {
    unsub("");
    ready = { settings: false, chars: false };
    memberSubscribed = false;
    if (!user) {
      useStore.setState({ session: { charId: null, admin: false, uid: null, status: null, email: null }, hydrated: true, liveError: null });
      return;
    }
    useStore.setState({ hydrated: false, liveError: null, session: { charId: null, admin: false, uid: user.uid, status: null, email: user.email } });
    let admin = false;
    try { admin = (await user.getIdTokenResult(true)).claims.admin === true; } catch { /* 토큰 갱신 실패해도 계속 */ }
    const db = fbDb();
    // 내 계정 문서. 승인(member)되면 그때 나머지 데이터를 구독해요.
    sub("user", () => onSnapshot(doc(db, "users", user.uid), (s) => {
      const u = s.data() as Omit<MemberUser, "uid"> | undefined;
      const status = u?.status ?? null;
      useStore.setState((st) => ({ session: { ...st.session, status, charId: u?.charId ?? null, admin } }));
      const approved = status === "member" || admin;
      if (!approved) { useStore.setState({ hydrated: true }); return; }
      if (!memberSubscribed) { memberSubscribed = true; subscribeCore(user, admin); if (admin) subscribeChatHeads(null, true); }
      if (u?.charId) { subscribeMine(u.charId); if (!admin) subscribeChatHeads(u.charId, false); }
    }, (e) => {
      // 계정 문서가 없거나 못 읽음 → 가입 신청 전 상태로 취급
      useStore.setState((st) => ({ session: { ...st.session, status: null }, hydrated: true, liveError: `계정 정보를 읽지 못했어요: ${(e as Error).message}` }));
    }));
  });
}

function subscribeCore(user: User, admin: boolean) {
  const db = fbDb();
  void user;
  sub("settings", () => onSnapshot(doc(db, "settings", "global"), (s) => {
    const g = (s.data() ?? {}) as { stage?: Stage; notice?: { text: string; at: number } | null; results?: { topN: number; top: string[]; dorms: { id: DormId; n: number }[] } | null };
    setData({ stage: g.stage ?? 0, notice: g.notice ?? null, results: g.results ?? null });
    markReady("settings");
  }, fail("설정")));
  sub("chars", () => onSnapshot(collection(db, "characters"), (s) => {
    const myTx = useStore.getState().myTx;
    setData({ chars: s.docs.map((d) => { const c = withId<Character>(d); return { ...c, tx: c.id === useStore.getState().session.charId ? myTx : [] }; }) });
    markReady("chars");
  }, fail("캐릭터")));
  subscribePosts(useStore.getState().postLimit);
  sub("rooms", () => onSnapshot(query(collection(db, "rooms"), orderBy("lastAt", "desc")), (s) => {
    const cur = useStore.getState().data.rooms;
    setData({ rooms: s.docs.map((d) => { const r = withId<Room>(d); const old = cur.find((x) => x.id === r.id); return { ...r, messages: old?.messages ?? [] }; }) });
  }, fail("역극")));
  sub("events", () => onSnapshot(collection(db, "events"), (s) => setData({ events: s.docs.map((d) => withId<CalEvent>(d)) }), fail("일정")));
  sub("items", () => onSnapshot(collection(db, "items"), (s) => setData({ items: s.docs.map((d) => withId<Item>(d)) }), fail("상점")));
  sub("jobs", () => onSnapshot(collection(db, "jobs"), (s) => setData({ jobs: s.docs.map((d) => withId<Job>(d)) }), fail("아르바이트")));
  if (admin) {
    sub("adminLog", () => onSnapshot(query(collection(db, "adminLog"), orderBy("at", "desc")), (s) => setData({ adminLog: s.docs.map((d) => d.data() as { at: number; text: string }) }), () => {}));
    sub("users", () => onSnapshot(collection(db, "users"), (s) => useStore.setState({ users: s.docs.map((d) => ({ ...(d.data() as Omit<MemberUser, "uid">), uid: d.id })) }), () => {}));
  }
}

function subscribeMine(charId: string) {
  const db = fbDb();
  unsub("mine:");
  sub("mine:tx", () => onSnapshot(query(collection(db, `characters/${charId}/tx`), orderBy("at", "desc")), (s) => {
    const tx = s.docs.map((d) => d.data() as { at: number; text: string; amt: number });
    useStore.setState((st) => ({ data: { ...st.data, chars: st.data.chars.map((c) => (c.id === charId ? { ...c, tx } : c)) }, myTx: tx }));
  }));
  sub("mine:notifs", () => onSnapshot(query(collection(db, "notifs"), where("to", "==", charId), orderBy("at", "desc")), (s) => setData({ notifs: s.docs.map((d) => withId<{ id: string; to: string; text: string; link?: { v: string; id?: string }; at: number; read: boolean }>(d)) })));
  for (const side of ["a", "b"] as const) {
    sub(`mine:threads:${side}`, () => onSnapshot(query(collection(db, "threads"), where(side, "==", charId)), (s) => {
      const cur = useStore.getState().data.threads.filter((t) => (side === "a" ? t.a !== charId : t.b !== charId));
      const mine = s.docs.map((d) => { const t = withId<Thread>(d); const old = useStore.getState().data.threads.find((x) => x.id === t.id); return { ...t, letters: old?.letters ?? [] }; });
      setData({ threads: [...cur, ...mine] });
      for (const t of mine) sub(`mine:letters:${t.id}`, () => onSnapshot(query(collection(db, `threads/${t.id}/letters`), orderBy("sentAt")), (ls) => {
        const letters = ls.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as unknown as Thread["letters"];
        useStore.setState((st) => ({ data: { ...st.data, threads: st.data.threads.map((x) => (x.id === t.id ? { ...x, letters } : x)) } }));
      }));
    }));
  }
}

/** 역극방에 들어가면 메시지와 입력중 상태를 구독해요. 나올 때 해제. */
export function watchRoom(roomId: string) {
  const db = fbDb();
  sub(`room:${roomId}`, () => onSnapshot(query(collection(db, `rooms/${roomId}/messages`), orderBy("at")), (s) => {
    const messages = s.docs.map((d) => withId<Msg>(d));
    useStore.setState((st) => ({ data: { ...st.data, rooms: st.data.rooms.map((r) => (r.id === roomId ? { ...r, messages } : r)) } }));
  }));
  watchTyping(`room:${roomId}`);
  return () => { unsub(`room:${roomId}`); unsub(`typing:room:${roomId}`); };
}
export function watchDorm(dormId: DormId, stage: number) {
  const db = fbDb();
  const key = `${dormId}-${stage}`;
  sub(`dorm:${key}`, () => onSnapshot(query(collection(db, `dorms/${key}/messages`), orderBy("at")), (s) => {
    const msgs = s.docs.map((d) => withId<Msg>(d));
    useStore.setState((st) => ({ data: { ...st.data, dormMsgs: { ...st.data.dormMsgs, [key]: msgs } } }));
  }, () => { /* 권한 없음(다른 학부) → 조용히 무시 */ }));
  watchTyping(`dorm:${key}`);
  return () => { unsub(`dorm:${key}`); unsub(`typing:dorm:${key}`); };
}

/* ───────── 타임라인 페이지 단위 구독 ───────── */
function subscribePosts(n: number) {
  const db = fbDb();
  sub("posts", () => onSnapshot(query(collection(db, "posts"), orderBy("at", "desc"), limit(n)), (s) => {
    setData({ posts: s.docs.map((d) => withId<Post>(d)) });
    useStore.setState({ postsHasMore: s.docs.length >= n });
  }, fail("타임라인")));
}
/** 더 불러오기: 상한을 늘려 다시 구독해요(최신 글 실시간 반영은 유지). */
export function resubscribePosts(n: number) { unsub("posts"); subscribePosts(n); }

/* ───────── 운영자 문의함 ───────── */
function chatKey(charId: string) { return `chat:${charId}`; }
/** 대화 구독 + 읽음 처리. 운영자는 목록도 구독해요. */
export function watchChat(charId: string) {
  const db = fbDb();
  const st = useStore.getState();
  sub(chatKey(charId), () => onSnapshot(query(collection(db, `adminChats/${charId}/messages`), orderBy("at")), (s) => {
    const messages = s.docs.map((d) => withId<ChatMsg>(d));
    useStore.setState((x) => { const prev = x.adminChats[charId]; return { adminChats: { ...x.adminChats, [charId]: { charId, lastText: prev?.lastText ?? "", lastAt: prev?.lastAt ?? 0, unreadAdmin: prev?.unreadAdmin ?? 0, unreadChar: prev?.unreadChar ?? 0, messages } } }; });
    // 열어 두는 동안 새 메시지가 오면 읽음 유지
    setDoc(doc(db, "adminChats", charId), st.session.admin ? { unreadAdmin: 0 } : { unreadChar: 0 }, { merge: true }).catch(() => {});
  }, () => {}));
}
export function unwatchChat(charId: string) { unsub(chatKey(charId)); }
/** 내 대화(멤버) 또는 전체 목록(운영자)의 머리 정보를 구독해요. 로그인 시 자동. */
function subscribeChatHeads(charId: string | null, admin: boolean) {
  const db = fbDb();
  const apply = (docs: { id: string; data: () => unknown }[]) => useStore.setState((x) => {
    const next = { ...x.adminChats };
    for (const d of docs) { const h = d.data() as Omit<ChatThread, "charId" | "messages">; next[d.id] = { charId: d.id, messages: next[d.id]?.messages ?? [], ...h }; }
    return { adminChats: next };
  });
  if (admin) sub("chatheads", () => onSnapshot(collection(db, "adminChats"), (s) => apply(s.docs), () => {}));
  else if (charId) sub("chatheads", () => onSnapshot(doc(db, "adminChats", charId), (s) => { if (s.exists()) apply([s]); }, () => {}));
}

/** 문서(세계관·편람·규칙) 구독. 비회원도 읽을 수 있어요. 없거나 권한 없으면 기본 원문 사용. */
export function watchDoc(id: string) {
  if (subs.has(`doc:${id}`)) return () => {};
  sub(`doc:${id}`, () => onSnapshot(doc(fbDb(), "docs", id), (s) => {
    const d = s.data() as { text?: string; updatedAt?: number; summary?: string } | undefined;
    if (d?.text) useStore.setState((st) => ({ docTexts: { ...st.docTexts, [id]: { text: d.text!, updatedAt: d.updatedAt ?? 0, summary: d.summary } } }));
  }, () => {}));
  return () => unsub(`doc:${id}`);
}

/* ───────── 입력중 표시 ───────── */
function watchTyping(key: string) {
  const db = fbDb();
  sub(`typing:${key}`, () => onSnapshot(doc(db, "typing", key), (s) => {
    const m = (s.data() ?? {}) as Record<string, number>;
    useStore.setState((st) => ({ typing: { ...st.typing, [key]: m } }));
  }));
}
const lastTyped = new Map<string, number>();
/** 3초에 한 번만 서버에 알려요. */
export function setTyping(key: string, charId: string) {
  const now = Date.now();
  if (now - (lastTyped.get(key) ?? 0) < 3000) return;
  lastTyped.set(key, now);
  setDoc(doc(fbDb(), "typing", key), { [charId]: now }, { merge: true }).catch(() => {});
}
export function clearTyping(key: string, charId: string) {
  lastTyped.delete(key);
  setDoc(doc(fbDb(), "typing", key), { [charId]: 0 }, { merge: true }).catch(() => {});
}

/* ───────── 인증 ───────── */
export const auth = {
  signIn: (email: string, password: string) => signInWithEmailAndPassword(fbAuth(), email, password),
  signUp: async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(fbAuth(), email, password);
    await setDoc(doc(fbDb(), "users", cred.user.uid), { email, status: "pending", charId: null, agreedRules: true, createdAt: Date.now() });
    return cred;
  },
  signOut: () => signOut(fbAuth()),
  /** 현재 비밀번호로 다시 확인한 뒤 새 비밀번호로 바꿔요. */
  changePassword: async (current: string, next: string) => {
    const u = fbAuth().currentUser;
    if (!u?.email) throw new Error("로그인이 필요해요.");
    await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, current));
    await updatePassword(u, next);
  },
  resetPassword: (email: string) => sendPasswordResetEmail(fbAuth(), email),
};

/* ───────── 이미지 ───────── */
async function upload(path: string, dataUrl: string) {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const m = /^data:image\/(png|webp|gif|jpeg)/.exec(dataUrl);
  const ext = m ? (m[1] === "jpeg" ? "jpg" : m[1]) : "jpg";
  path = path.replace(/\.jpg$/, `.${ext}`);
  const r = sref(fbStorage(), path);
  await uploadString(r, dataUrl, "data_url");
  return getDownloadURL(r);
}

/* ───────── 쓰기 (클라이언트 직접) ───────── */
const me = () => {
  const s = useStore.getState();
  const c = s.data.chars.find((x) => x.id === s.session.charId);
  if (!c) throw new Error("캐릭터가 없어요.");
  return c;
};
const now = () => Date.now();

export const L = {
  async addPost(text: string, images: string[]) {
    const m = me(); const db = fbDb(); const id = mkId();
    const urls = await Promise.all(images.map((src, i) => upload(`posts/${id}/${i}.jpg`, src)));
    await setDoc(doc(db, "posts", id), { charId: m.id, stage: useStore.getState().data.stage, text, images: urls, at: now(), likes: [] });
    const mentioned = (text.match(/@(\S+)/g) || []).map((x) => useStore.getState().data.chars.find((c) => c.name.replace(/\s/g, "") === x.slice(1))).filter(Boolean);
    // 멘션 알림은 서버 트리거가 없으므로 생략(다음 단계).
    void mentioned;
  },
  editPost: (id: string, text: string) => updateDoc(doc(fbDb(), "posts", id), { text, edited: true }),
  deletePost: (id: string) => deleteDoc(doc(fbDb(), "posts", id)),
  toggleLike: async (id: string) => {
    const m = me(); const p = useStore.getState().data.posts.find((p) => p.id === id); if (!p) return;
    await updateDoc(doc(fbDb(), "posts", id), { likes: p.likes.includes(m.id) ? arrayRemove(m.id) : arrayUnion(m.id) });
  },
  async talk(postId: string, text: string) {
    const m = me(); const db = fbDb();
    const p = useStore.getState().data.posts.find((p) => p.id === postId); if (!p) throw new Error("글을 찾을 수 없어요.");
    const roomRef = doc(collection(db, "rooms")); const t = now();
    const b = writeBatch(db);
    b.set(roomRef, { members: [p.charId, m.id], source: { postId: p.id, charId: p.charId, stage: p.stage, text: p.text, images: p.images, at: p.at }, status: "open", lastAt: t, lastText: text, read: { [m.id]: t } });
    b.set(doc(collection(db, `rooms/${roomRef.id}/messages`)), { charId: m.id, stage: useStore.getState().data.stage, text, image: null, at: t });
    b.set(doc(collection(db, "notifs")), { to: p.charId, text: `${m.name}이(가) 당신의 글에 말을 걸었어요.`, link: { v: "room", id: roomRef.id }, at: t, read: false });
    await b.commit();
    return roomRef.id;
  },
  async rpSend(roomId: string, text: string, image: string | null) {
    const m = me(); const db = fbDb(); const t = now();
    const url = image ? await upload(`rooms/${roomId}/${mkId()}.jpg`, image) : null;
    const r = useStore.getState().data.rooms.find((r) => r.id === roomId);
    const b = writeBatch(db);
    b.set(doc(collection(db, `rooms/${roomId}/messages`)), { charId: m.id, stage: useStore.getState().data.stage, text, image: url, at: t });
    b.update(doc(db, "rooms", roomId), { lastAt: t, lastText: text || "(이미지)", [`read.${m.id}`]: t });
    const other = r?.members.find((x) => x !== m.id);
    if (other) b.set(doc(collection(db, "notifs")), { to: other, text: `${m.name}이(가) 역극에 답했어요.`, link: { v: "room", id: roomId }, at: t, read: false });
    await b.commit();
    clearTyping(`room:${roomId}`, m.id);
  },
  rpEdit: (roomId: string, msgId: string, text: string) => updateDoc(doc(fbDb(), `rooms/${roomId}/messages`, msgId), { text, edited: true }),
  rpDone: (roomId: string) => updateDoc(doc(fbDb(), "rooms", roomId), { status: "done" }),
  rpReopen: (roomId: string) => updateDoc(doc(fbDb(), "rooms", roomId), { status: "open" }),
  markRoomRead: async (roomId: string) => {
    const s = useStore.getState(); const m = s.data.chars.find((x) => x.id === s.session.charId);
    const r = s.data.rooms.find((r) => r.id === roomId);
    if (!m || !r || !r.members.includes(m.id)) return;
    if ((r.read?.[m.id] ?? 0) >= r.lastAt) return;
    await updateDoc(doc(fbDb(), "rooms", roomId), { [`read.${m.id}`]: now() });
  },
  async dormSend(dormId: DormId, text: string, image: string | null) {
    const m = me(); const key = `${dormId}-${useStore.getState().data.stage}`;
    const url = image ? await upload(`dorms/${key}/${mkId()}.jpg`, image) : null;
    await addDoc(collection(fbDb(), `dorms/${key}/messages`), { charId: m.id, stage: useStore.getState().data.stage, text, image: url, at: now() });
    clearTyping(`dorm:${key}`, m.id);
  },
  addEvent: (e: Omit<CalEvent, "id">) => addDoc(collection(fbDb(), "events"), e),
  async saveProfile(stage: Stage, p: Profile, charId?: string) {
    const id = charId ?? me().id;
    const avatar = p.avatar ? await upload(`characters/${id}/${stage}/avatar-${Date.now()}.jpg`, p.avatar) : p.avatar ?? null;
    const body = p.body ? await upload(`characters/${id}/${stage}/body-${Date.now()}.jpg`, p.body) : p.body ?? null;
    const data = { ...p, avatar, body };
    // 아직 공개 전인 단계는 비공개 문서에 두고, 운영자가 전환할 때 서버가 공개로 옮겨요.
    if (stage > useStore.getState().data.stage) await setDoc(doc(fbDb(), `characters/${id}/private`, `stage${stage}`), data);
    else await updateDoc(doc(fbDb(), "characters", id), { [`profiles.${stage}`]: data });
  },
  allocateStage1: (electives: string[], alloc: Record<string, number>, charId?: string) => call("allocateStage1", { electives, alloc, charId }).then(() => undefined),
  renameCharacter: (charId: string, name: string) => updateDoc(doc(fbDb(), "characters", charId), { name }),
  async loadPrivateProfiles(charId: string) {
    const out: Partial<Record<Stage, Profile>> = {};
    for (const st of [1, 2] as Stage[]) {
      try { const s = await getDoc(doc(fbDb(), `characters/${charId}/private`, `stage${st}`)); if (s.exists()) out[st] = s.data() as Profile; } catch { /* 권한 없음 */ }
    }
    return out;
  },
  async loadSecret(charId: string) { const s = await getDoc(doc(fbDb(), `characters/${charId}/private`, "secret")); return (s.data()?.text as string | undefined) ?? null; },
  async loadPrivate(charId: string): Promise<PrivateProfile> { const s = await getDoc(doc(fbDb(), `characters/${charId}/private`, "secret")); const d = (s.data() ?? {}) as { text?: string; trigger?: string; growthIf?: string }; return { secret: d.text ?? "", trigger: d.trigger ?? "", growthIf: d.growthIf ?? "" }; },
  savePrivate: (charId: string, p: PrivateProfile) => setDoc(doc(fbDb(), `characters/${charId}/private`, "secret"), { text: p.secret, trigger: p.trigger, growthIf: p.growthIf, updatedAt: now() }, { merge: true }),
  saveSecret: (charId: string, text: string) => setDoc(doc(fbDb(), `characters/${charId}/private`, "secret"), { text, updatedAt: now() }, { merge: true }),
  markNotif: (id: string) => updateDoc(doc(fbDb(), "notifs", id), { read: true }),
  async markAllNotifs() {
    const m = me(); const db = fbDb(); const b = writeBatch(db);
    useStore.getState().data.notifs.filter((n) => n.to === m.id && !n.read).slice(0, 400).forEach((n) => b.update(doc(db, "notifs", n.id), { read: true }));
    await b.commit();
  },
  async clearReadNotifs() {
    const m = me(); const db = fbDb(); const b = writeBatch(db);
    useStore.getState().data.notifs.filter((n) => n.to === m.id && n.read).slice(0, 400).forEach((n) => b.delete(doc(db, "notifs", n.id)));
    await b.commit();
  },
  markLetterRead: async (threadId: string, idx: number) => {
    const t = useStore.getState().data.threads.find((t) => t.id === threadId); const l = t?.letters[idx] as (Thread["letters"][number] & { id?: string }) | undefined;
    if (!t || !l?.id || l.read) return;
    await updateDoc(doc(fbDb(), `threads/${threadId}/letters`, l.id), { read: true });
  },
  saveNotice: (text: string) => setDoc(doc(fbDb(), "settings", "global"), { notice: text ? { text, at: now() } : null }, { merge: true }),
  addItem: (i: { name: string; price: number; cat: string; stock: number; desc: string }) => setDoc(doc(fbDb(), "items", mkId()), { ...i, limit: 0, icon: "scarf", use: "" }),
  updateItem: (id: string, patch: Partial<Item>) => updateDoc(doc(fbDb(), "items", id), patch),
  deleteCharacter: (charId: string) => call("deleteCharacter", { charId }).then(() => undefined),
  async sendChat(charId: string, text: string) {
    const db = fbDb(); const s = useStore.getState(); const admin = s.session.admin; const at = now();
    const from = admin ? "admin" : charId;
    const c = s.data.chars.find((x) => x.id === charId);
    const b = writeBatch(db);
    b.set(doc(collection(db, `adminChats/${charId}/messages`)), { from, text: text.slice(0, 1000), at });
    b.set(doc(db, "adminChats", charId), { charId, charName: c?.name ?? "", lastText: text.slice(0, 80), lastAt: at, ...(admin ? { unreadChar: increment(1), unreadAdmin: 0 } : { unreadAdmin: increment(1), unreadChar: 0 }) }, { merge: true });
    if (admin) b.set(doc(collection(db, "notifs")), { to: charId, text: `운영자: ${text.slice(0, 60)}${text.length > 60 ? "…" : ""}`, link: { v: "inbox" }, at, read: false, from: "admin" });
    await b.commit();
  },
  adminMessage: (charId: string, text: string) => addDoc(collection(fbDb(), "notifs"), { to: charId, text: `운영자: ${text}`, link: { v: "timeline" }, at: now(), read: false, from: "admin" }).then(() => undefined),
  saveDoc: (id: string, text: string, summary: string) => setDoc(doc(fbDb(), "docs", id), { text, summary, public: true, updatedAt: now() }, { merge: true }),

  /* ───── 서버 계산 ───── */
  async createCharacter(c: NewCharacter) {
    // 이미지는 Storage에 먼저 올리고 URL만 서버에 넘겨요.
    const uid = useStore.getState().session.uid ?? "anon";
    const profiles: NonNullable<NewCharacter["profiles"]> = {};
    for (const st of ["0", "1", "2"] as const) {
      const p = c.profiles?.[st]; if (!p) continue;
      profiles[st] = {
        ...p,
        avatar: p.avatar ? await upload(`characters/new-${uid}/${st}/avatar.jpg`, p.avatar) : null,
        body: p.body ? await upload(`characters/new-${uid}/${st}/body.jpg`, p.body) : null,
      };
    }
    const r = await call<NewCharacter, { id: string }>("createCharacter", { ...c, profiles });
    return r.id;
  },
  ration: () => call<undefined, { n: number }>("ration").then((r) => r.n),
  studyStart: (subject: string, useJokbo: boolean) => call("studyStart", { subject, useJokbo }).then(() => null as string | null),
  studyFinish: () => call<undefined, StudyResult>("studyFinish"),
  jobStart: (jobId: string) => call("jobStart", { jobId }).then(() => null as string | null),
  jobFinish: () => call<undefined, JobResult>("jobFinish"),
  transfer: (to: string, amt: number, memo: string) => call("transfer", { to, amt, memo }).then(() => null as string | null),
  buy: (itemId: string) => call<{ itemId: string }, { got: Item }>("buyItem", { itemId }).then((r) => r.got),
  gift: (itemId: string, to: string, memo: string) => call("giftItem", { itemId, to, memo }).then(() => undefined),
  openCookie: () => call<{ itemId: string }, { text: string }>("useItem", { itemId: "cookie" }).then((r) => r.text),
  listenEgg: () => call<{ itemId: string }, { text: string }>("useItem", { itemId: "egg" }).then((r) => r.text),
  drinkSolis: () => call<{ itemId: string }, { left: number }>("useItem", { itemId: "drink" }).then((r) => r.left),
  submitExcuse: () => call("useItem", { itemId: "excuse" }).then(() => undefined),
  enterDorm: (dorm: DormId) => call("useItem", { itemId: "key", dorm }).then(() => undefined),
  letterNew: (text: string) => call<{ text: string }, { result: "sent" | "lost" }>("letterSend", { text }).then((r) => r.result),
  letterReply: (threadId: string, text: string) => call<{ threadId: string; text: string }, { result: "sent" }>("letterReply", { threadId, text }).then((r) => r.result),
  adjust: (charId: string, target: string, n: number, why: string) => call<unknown, { label: string }>("adminAdjust", { charId, target, n, why }).then((r) => r.label),
  setStage: (stage: Stage) => call("setStage", { stage }).then(() => undefined),
  semester: () => call("closeSemester", { post: false }).then(() => undefined),
  postResults: () => call("closeSemester", { post: true }).then(() => undefined),
  approveUser: (uid: string, status: MemberUser["status"]) => setDoc(doc(fbDb(), "users", uid), { status, reviewedAt: now() }, { merge: true }),
  /** 상점·아르바이트·기본 설정·기숙사 방을 운영자 권한으로 직접 심어요. */
  async seedDefaults() {
    const db = fbDb(); const b = writeBatch(db); const d = seed();
    for (const i of d.items) b.set(doc(db, "items", i.id), i, { merge: true });
    for (const j of d.jobs) b.set(doc(db, "jobs", j.id), j, { merge: true });
    const g = await getDoc(doc(db, "settings", "global"));
    if (!g.exists()) b.set(doc(db, "settings", "global"), { stage: 0, notice: null, updatedAt: now() });
    for (const dm of DORMS) b.set(doc(db, "dorms", `${dm.id}-0`), { dorm: dm.id, stage: 0, open: true }, { merge: true });
    await b.commit();
    return { items: d.items.length, jobs: d.jobs.length };
  },
  async getUser(uid: string) { const s = await getDoc(doc(fbDb(), "users", uid)); return s.data() as MemberUser | undefined; },
};
export { serverTimestamp };
