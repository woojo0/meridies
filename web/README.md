# 메리디에스 · Meridies (web)

루체른 황립 아카데미 자캐 커뮤니티의 초기 버전. 기획서(`../자캐 커뮤 홈페이지 기획서.docx`)와 프로토타입(`../메리디에스.html`)의 기능을 Next.js 앱 구조로 옮긴 것입니다.

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 프로덕션 빌드
npm run lint
```

## 구조

- `src/app` — 라우트. `/`(랜딩), `/login`, `/world`·`/rules`(비회원 공개), `(app)/…`(타임라인·기숙사·달력·상점·더보기·프로필·역극방·캐릭터 등록·운영자)
- `src/components` — 화면별 컴포넌트. `ui/`는 공통 프리미티브(버튼·칩·시트·토스트·라이트박스·두상·문장)
- `src/lib` — 도메인 로직
  - `constants.ts` 과목·등급·학부·수치(공부 1시간, 알바 2시간, 배급량, 수수료 등)
  - `seed.ts` 예시 데이터, `docs.ts` 세계관·편람·규칙 원문
  - `store.ts` Zustand 스토어. 모든 규칙(확률·재화·시간 판정)이 여기에 모여 있어 서버(Cloud Functions)로 옮기기 쉽게 되어 있음
  - `hooks.ts` 시계·테마·세션 훅

## 지금 상태와 다음 단계

- 데이터는 브라우저 localStorage에만 저장됩니다(데모). 로그인은 데모 캐릭터 선택으로 대체.
- 다음 단계: Firebase Authentication 연결 → Firestore 데이터 모델(`lib/types.ts` 기준) → 확률·재화 계산을 Cloud Functions로 이동 → Storage 이미지 업로드 → Vercel 배포.
