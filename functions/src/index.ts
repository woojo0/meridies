/**
 * 메리디에스 Cloud Functions (뼈대)
 * 확률·시간·재화 계산은 전부 여기서 합니다. 클라이언트는 결과만 받습니다.
 * 실제 구현은 화면 연결 단계에서 하나씩 채웁니다. 지금은 운영자 지정 함수만 동작합니다.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const REGION = "asia-northeast3";

/** 운영자 지정: 이미 운영자인 사람만 다른 사람을 운영자로 만들 수 있어요. 첫 운영자는 scripts/set-admin.ts로. */
export const setAdmin = onCall({ region: REGION }, async (req) => {
  if (req.auth?.token.admin !== true) throw new HttpsError("permission-denied", "운영자만 할 수 있어요.");
  const { uid, admin } = req.data as { uid: string; admin: boolean };
  if (!uid) throw new HttpsError("invalid-argument", "uid가 필요해요.");
  await getAuth().setCustomUserClaims(uid, { admin: !!admin });
  return { ok: true };
});

/*
 * 다음 단계에서 추가될 함수들 (기획서 기준):
 * - studyStart / studyFinish : 하루 3회, 1시간, 과목별 점수 폭, 족보 +10, 광휘 실습은 배급 솔리스 1병
 * - jobStart / jobFinish     : 하루 2회(+드링크), 2시간, 등급별 성공률, 보상 범위
 * - transfer                 : 최소 2그로셴, 10% 수수료 버림, 거래 내역·알림
 * - buyItem / useItem / gift : 재고·인당 제한, 인형 뽑기 6%, 열쇠 24시간
 * - ration                   : 하루 1회, 광휘 실습 등급별 1/1/2/2/3병 (KST 자정 초기화)
 * - letterSend / letterReply : 우표·비둘기 소모, 10% 분실, 1시간 뒤 배달, 무작위 수신자
 * - onCharacterCreate        : 성적 합계 2,000·광휘 ≤199 검증, 기본금 지급
 * - setStage / closeSemester : 성장 단계 전환(기숙사 방 새로 열기, 2차 때 펜팔 공개), 학기 집계
 */
