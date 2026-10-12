/**
 * 웹 푸시(FCM). 기기마다 토큰 하나를 users/{uid}/devices/{token}에 등록해요.
 * 서버(functions)가 notifs 문서가 생길 때 그 캐릭터 오너의 기기들로 보내요.
 */
import { collection, deleteDoc, doc, onSnapshot, setDoc, type Unsubscribe } from "firebase/firestore";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";
import { fbApp, fbDb } from "./firebase";
import { useStore } from "./store";

export const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";
const LS_KEY = "meridies.pushToken";

export interface PushDevice { token: string; label: string; kind: "web" | "mobile"; at: number }

/** 이 브라우저가 어떤 기기인지 사람이 읽을 이름으로 */
export function deviceLabel(): { label: string; kind: "web" | "mobile" } {
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  const os = /iPhone|iPad|iPod/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Macintosh/.test(ua) ? "Mac" : "PC";
  const browser = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "삼성 브라우저" : /Whale/.test(ua) ? "웨일" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "브라우저";
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia("(display-mode: standalone)").matches;
  return { label: `${os} · ${browser}${standalone ? " (홈 화면 앱)" : ""}`, kind: mobile ? "mobile" : "web" };
}

/** 이 기기에서 푸시를 받을 수 있는지. 이유를 같이 돌려줘요. */
export async function pushSupport(): Promise<{ ok: boolean; why?: string }> {
  if (typeof window === "undefined") return { ok: false, why: "브라우저에서만 돼요." };
  if (!VAPID_KEY) return { ok: false, why: "서버에 웹 푸시 키가 아직 설정되지 않았어요. 운영자에게 문의해 주세요." };
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return { ok: false, why: "이 브라우저는 웹 푸시를 지원하지 않아요." };
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true || matchMedia("(display-mode: standalone)").matches;
  if (ios && !standalone) return { ok: false, why: "아이폰·아이패드는 Safari 공유 버튼 → ‘홈 화면에 추가’로 설치한 뒤 그 앱에서 추가해야 해요." };
  if (!(await isSupported())) return { ok: false, why: "이 브라우저는 웹 푸시를 지원하지 않아요." };
  if (Notification.permission === "denied") return { ok: false, why: "브라우저에서 알림이 차단돼 있어요. 주소창 옆 사이트 설정에서 알림을 허용해 주세요." };
  return { ok: true };
}

export const thisDeviceToken = (): string | null => { try { return localStorage.getItem(LS_KEY); } catch { return null; } };

/** 이 기기를 등록: 권한 요청 → 서비스워커 → 토큰 → users/{uid}/devices/{token} */
export async function registerThisDevice(): Promise<PushDevice> {
  const uid = useStore.getState().session.uid; if (!uid) throw new Error("로그인이 필요해요.");
  const sup = await pushSupport(); if (!sup.ok) throw new Error(sup.why);
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("알림 권한을 허용해야 받을 수 있어요.");
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  const token = await getToken(getMessaging(fbApp()), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
  if (!token) throw new Error("토큰을 받지 못했어요. 잠시 뒤 다시 시도해 주세요.");
  const { label, kind } = deviceLabel();
  const dev: PushDevice = { token, label, kind, at: Date.now() };
  await setDoc(doc(fbDb(), `users/${uid}/devices`, token), { label, kind, at: dev.at, ua: navigator.userAgent.slice(0, 200) });
  try { localStorage.setItem(LS_KEY, token); } catch { /* 무시 */ }
  return dev;
}

/** 기기 빼기. 이 기기면 브라우저 토큰도 지워요. */
export async function removeDevice(token: string) {
  const uid = useStore.getState().session.uid; if (!uid) throw new Error("로그인이 필요해요.");
  await deleteDoc(doc(fbDb(), `users/${uid}/devices`, token));
  if (thisDeviceToken() === token) {
    try { localStorage.removeItem(LS_KEY); } catch { /* 무시 */ }
    try { if (await isSupported()) await deleteToken(getMessaging(fbApp())); } catch { /* 이미 없음 */ }
  }
}

/** 내 기기 목록 구독 */
export function watchDevices(cb: (list: PushDevice[]) => void): Unsubscribe {
  const uid = useStore.getState().session.uid; if (!uid) return () => {};
  return onSnapshot(collection(fbDb(), `users/${uid}/devices`), (s) => cb(s.docs.map((d) => ({ token: d.id, ...(d.data() as Omit<PushDevice, "token">) })).sort((a, b) => b.at - a.at)), () => cb([]));
}
