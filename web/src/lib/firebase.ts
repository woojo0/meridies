/**
 * Firebase 초기화. 값은 `web/.env.local`(NEXT_PUBLIC_FIREBASE_*)에서 읽어요.
 * 설정이 비어 있으면 앱은 데모(localStorage) 모드로 동작합니다.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions, httpsCallable, type Functions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** 설정이 모두 들어 있으면 true → 실제 서버 모드. */
export const LIVE = Object.values(config).every(Boolean);
export const REGION = "asia-northeast3";

let app: FirebaseApp | null = null;
export function fbApp(): FirebaseApp {
  if (!LIVE) throw new Error("Firebase 설정이 없어요.");
  if (!app) app = getApps().length ? getApp() : initializeApp(config);
  return app;
}
export const fbAuth = (): Auth => getAuth(fbApp());
export const fbDb = (): Firestore => getFirestore(fbApp());
export const fbStorage = (): FirebaseStorage => getStorage(fbApp());
export const fbFns = (): Functions => getFunctions(fbApp(), REGION);

/** Cloud Function 호출. 에러 메시지는 사용자에게 그대로 보여 줄 수 있게 정리해요. */
export async function call<TIn, TOut>(name: string, data?: TIn): Promise<TOut> {
  try {
    const res = await httpsCallable<TIn, TOut>(fbFns(), name)(data as TIn);
    return res.data;
  } catch (e) {
    const err = e as { code?: string; message?: string };
    const code = (err.code ?? "").replace(/^functions\//, "");
    if (code === "internal" || code === "not-found" || code === "unavailable") throw new Error(`서버 함수(${name})에 연결하지 못했어요. Functions 배포가 끝났는지 확인해 주세요.`);
    if (code === "unauthenticated") throw new Error("로그인이 필요해요.");
    const msg = err.message?.replace(/^.*?:\s*/, "") || "요청에 실패했어요.";
    throw new Error(msg);
  }
}
