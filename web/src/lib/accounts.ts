/**
 * 운영자용 두 계정 동시 로그인.
 * 기본 앱(활성 계정)과 별도로 "alt" Firebase 앱에 두 번째 계정을 로그인해 둬요.
 * 전환은 두 Auth 인스턴스의 currentUser를 서로 바꿔 끼우는 방식이라 비밀번호를 저장하지 않아요.
 * 활성이 아닌 계정의 알림도 alt Firestore로 구독해서 같이 받아요.
 */
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateCurrentUser, type Auth } from "firebase/auth";
import { collection, doc, getFirestore, limit, onSnapshot, orderBy, query, where, type Firestore, type Unsubscribe } from "firebase/firestore";
import { fbAuth, fbConfig, LIVE } from "./firebase";
import { useStore } from "./store";
import type { Notif, NotifKind } from "./types";

const ALT = "alt";
function altApp(): FirebaseApp {
  return getApps().find((a) => a.name === ALT) ?? initializeApp(fbConfig, ALT);
}
export const altAuth = (): Auth => getAuth(altApp());
export const altDb = (): Firestore => getFirestore(altApp());

export interface AltAccount { uid: string; email: string | null; admin: boolean; charId: string | null; notify: Partial<Record<NotifKind, boolean>> }

let started = false;
let subs: Unsubscribe[] = [];
const stop = () => { subs.forEach((u) => u()); subs = []; };

/** 앱이 뜰 때 한 번. 두 번째 계정 로그인 상태를 따라 그 계정의 알림을 구독해요. */
export function startAlt() {
  if (started || !LIVE) return;
  started = true;
  onAuthStateChanged(altAuth(), async (user) => {
    stop();
    if (!user) { useStore.setState({ alt: null, altNotifs: [] }); return; }
    let admin = false;
    try { admin = (await user.getIdTokenResult(true)).claims.admin === true; } catch { /* 계속 */ }
    const db = altDb();
    subs.push(onSnapshot(doc(db, "users", user.uid), (s) => {
      const u = s.data() as { charId?: string | null; notify?: Partial<Record<NotifKind, boolean>> } | undefined;
      const charId = u?.charId ?? null;
      const prev = useStore.getState().alt;
      useStore.setState({ alt: { uid: user.uid, email: user.email, admin, charId, notify: u?.notify ?? {} } });
      // 알림 대상(캐릭터 id 또는 운영자)이 바뀌었을 때만 다시 구독
      const target = admin ? "admin" : charId;
      const prevTarget = prev ? (prev.admin ? "admin" : prev.charId) : undefined;
      if (target === prevTarget && subs.length > 1) return;
      subs.splice(1).forEach((un) => un());
      if (!target) { useStore.setState({ altNotifs: [] }); return; }
      subs.push(onSnapshot(query(collection(db, "notifs"), where("to", "==", target), orderBy("at", "desc"), limit(50)),
        (q) => useStore.setState({ altNotifs: q.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notif, "id">) })) }),
        () => useStore.setState({ altNotifs: [] })));
    }, () => {}));
  });
}

/** 두 번째 계정 추가: 이메일·비밀번호로 alt 앱에 로그인 */
export async function addAltAccount(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(altAuth(), email, password);
  if (cred.user.uid === fbAuth().currentUser?.uid) { await signOut(altAuth()); throw new Error("지금 로그인한 계정이에요. 다른 계정을 넣어 주세요."); }
  return cred.user;
}

/** 두 번째 계정 빼기 */
export const removeAltAccount = () => signOut(altAuth());

/** 활성 계정과 두 번째 계정을 맞바꾸고 새로고침 */
export async function switchAccount() {
  const main = fbAuth(), alt = altAuth();
  const cur = main.currentUser, other = alt.currentUser;
  if (!cur || !other) throw new Error("전환할 계정이 없어요.");
  await updateCurrentUser(main, other);
  await updateCurrentUser(alt, cur);
  location.reload();
}
