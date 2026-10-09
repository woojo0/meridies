/**
 * 운영자 계정 만들기 / 지정 (Cloud Shell에서 실행)
 *
 *   node scripts/set-admin.mjs <이메일> [비밀번호]
 *
 * - 계정이 없으면 비밀번호로 새로 만들고, 있으면 그 계정을 씁니다.
 * - 운영자 권한(admin 클레임)을 붙이고 가입 상태를 승인(member)으로 바꿉니다.
 * - 인증: 저장소에 serviceAccount.json이 있으면 그걸, 없으면 Cloud Shell의 로그인 정보를 씁니다.
 */
import { existsSync, readFileSync } from "node:fs";
import { applicationDefault, cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [email, password] = process.argv.slice(2);
if (!email) { console.error("사용법: node scripts/set-admin.mjs <이메일> [비밀번호]"); process.exit(1); }

const projectId = "meridies-8cbe6";
const saPath = new URL("../serviceAccount.json", import.meta.url);
if (existsSync(saPath)) {
  initializeApp({ credential: cert(JSON.parse(readFileSync(saPath, "utf8"))), projectId });
} else {
  initializeApp({ credential: applicationDefault(), projectId });
}

const auth = getAuth();
let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`기존 계정을 찾았어요: ${email}`);
  if (password) { await auth.updateUser(user.uid, { password }); console.log("비밀번호를 새로 설정했어요."); }
} catch (e) {
  if (e?.code !== "auth/user-not-found") throw e;
  if (!password) { console.error("계정이 없어요. 비밀번호를 함께 적어 주세요:  node scripts/set-admin.mjs 이메일 비밀번호"); process.exit(1); }
  if (password.length < 6) { console.error("비밀번호는 6자 이상이어야 해요."); process.exit(1); }
  user = await auth.createUser({ email, password, emailVerified: true });
  console.log(`새 계정을 만들었어요: ${email}`);
}

await auth.setCustomUserClaims(user.uid, { admin: true });
await getFirestore().doc(`users/${user.uid}`).set({ email, status: "member", agreedRules: true, createdAt: Date.now(), charId: null }, { merge: true });
console.log(`운영자 지정 완료 (${user.uid}). 사이트에서 이 이메일로 로그인하면 더보기 → 운영자 도구가 보여요.`);
