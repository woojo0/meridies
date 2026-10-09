/**
 * Firebase 초기화. 값은 `web/.env.local`(NEXT_PUBLIC_FIREBASE_*)에서 읽어요.
 * 아직 화면과 연결되지 않았고, 다음 단계(인증 → Firestore → Functions)에서 여기서 가져다 씁니다.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** 설정이 모두 들어 있으면 true. 비어 있으면 앱은 데모(localStorage) 모드로 동작해요. */
export const firebaseConfigured = Object.values(config).every(Boolean);

let app: FirebaseApp | null = null;

/** 브라우저에서 한 번만 초기화해서 돌려줘요. 설정이 없으면 null. */
export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfigured) return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(config);
  return app;
}
