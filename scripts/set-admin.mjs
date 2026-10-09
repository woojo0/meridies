/**
 * 첫 운영자 지정 스크립트 (로컬에서 한 번만 실행)
 *
 * 1) Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → "새 비공개 키 생성" → 받은 JSON을
 *    이 저장소 루트에 serviceAccount.json 으로 저장 (git에 올라가지 않음)
 * 2) 운영자로 쓸 계정으로 사이트에서 먼저 한 번 가입(이메일/비밀번호)
 * 3) 실행:  node scripts/set-admin.mjs you@example.com
 */
import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = process.argv[2];
if (!email) { console.error("사용법: node scripts/set-admin.mjs <운영자 이메일>"); process.exit(1); }

const sa = JSON.parse(readFileSync(new URL("../serviceAccount.json", import.meta.url), "utf8"));
initializeApp({ credential: cert(sa) });

const user = await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid, { admin: true });
await getFirestore().doc(`users/${user.uid}`).set({ status: "member", email }, { merge: true });
console.log(`운영자 지정 완료: ${email} (${user.uid}). 사이트에서 로그아웃 후 다시 로그인하면 적용돼요.`);
