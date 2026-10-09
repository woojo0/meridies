# Firebase 세팅 가이드 (메리디에스)

기획서의 기술 스택대로 **Vercel(화면) + Firebase(인증·데이터·이미지·서버 계산)** 구성을 잡는 순서입니다. 아래는 전부 브라우저와 터미널에서 직접 하는 작업이고, 코드 연결은 이 문서의 마지막 단계에서 제가 이어서 할 수 있습니다.

## 0. 준비물

- Google 계정 (운영자 계정으로 쓸 것)
- 결제 수단 (Blaze 종량제 전환용. 20명 규모면 무료 한도 안에서 거의 끝나지만, Storage·Functions를 쓰려면 Blaze가 필요합니다)
- Node.js 20 이상 (이미 설치돼 있음)

## 1. Firebase 프로젝트 만들기

1. https://console.firebase.google.com 접속 → **프로젝트 추가**
2. 이름: `meridies` (아무거나 가능). Google 애널리틱스는 **끄기** 권장
3. 만들어지면 왼쪽 상단 톱니바퀴 → **프로젝트 설정** → **일반** 탭 아래로 내려서 **내 앱** → `</>` (웹) 클릭
4. 앱 닉네임 `meridies-web`, **Firebase Hosting 설정은 체크하지 않음** (Vercel에 배포하니까) → 앱 등록
5. 나오는 `firebaseConfig` 값 6개를 복사해 둡니다 (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)

## 2. Authentication (로그인)

1. 왼쪽 메뉴 **빌드 → Authentication → 시작하기**
2. **로그인 방법** 탭에서
   - **Google** 사용 설정 → 프로젝트 공개 이름·지원 이메일 입력 → 저장
   - **이메일/비밀번호** 사용 설정 → 저장
3. **설정 → 승인된 도메인**에 나중에 Vercel 도메인(`xxx.vercel.app`, 커스텀 도메인)을 추가합니다. `localhost`는 기본으로 들어 있습니다.

## 3. Cloud Firestore (데이터)

1. **빌드 → Firestore Database → 데이터베이스 만들기**
2. 위치: `asia-northeast3 (서울)` 선택 (**한 번 정하면 못 바꿉니다**)
3. **프로덕션 모드**로 시작 (규칙은 아래에서 제가 작성해 넣습니다)

## 4. Storage (두상·전신·타임라인 이미지)

1. **빌드 → Storage → 시작하기**
2. 여기서 **Blaze 요금제 전환**을 요구합니다. 전환 후 위치는 Firestore와 같은 `asia-northeast3`
3. 프로덕션 모드로 시작

## 5. Blaze 예산 알림 걸기 (요금 폭탄 방지)

1. 프로젝트 설정 → **사용량 및 결제** → **세부정보 및 설정** → Google Cloud 결제 콘솔로 이동
2. **예산 및 알림** → 예산 만들기 → 금액 `$2` → 50%·90%·100%에서 이메일 알림

## 6. 운영자 권한

운영자는 커스텀 클레임(`admin: true`)으로 구분합니다. 이건 콘솔에서 못 하고 서버(Functions 또는 Admin SDK 스크립트)에서 설정합니다. 1단계 코드 연결 때 `scripts/set-admin.ts`를 만들어 드릴 테니, 그때 운영자 계정의 이메일만 알려주시면 됩니다.

## 7. 로컬 연결 (.env)

`web/.env.local` 파일을 만들고 1단계에서 복사한 값을 넣습니다. (이 파일은 git에 올라가지 않습니다)

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

같은 내용의 `web/.env.example`을 이미 만들어 두었습니다(값만 비어 있음).

## 8. Firebase CLI (Functions·규칙 배포용)

```bash
npm install -g firebase-tools
firebase login
cd "D:\[1].coding\[OC.CM]\meridies"
firebase init
```

`firebase init`에서 **Firestore, Functions, Storage**만 체크 → 기존 프로젝트 `meridies` 선택 → Functions 언어는 **TypeScript**. 생성된 `firestore.rules`, `storage.rules`, `functions/`는 제가 채워 넣겠습니다.

## 9. Vercel 배포

1. https://vercel.com → **Add New → Project** → GitHub `woojo0/meridies` 가져오기
2. **Root Directory**를 `web`으로 지정 (중요)
3. Environment Variables에 7단계의 6개 값을 그대로 추가
4. Deploy → 나온 도메인을 2-3의 **승인된 도메인**에 추가

## 이후 제가 하는 코드 작업 순서

1. `web/src/lib/firebase.ts` (SDK 초기화) + 로그인 화면을 실제 Google/이메일 로그인으로 교체, 가입 승인 흐름
2. Firestore 데이터 모델(`lib/types.ts` 기준)과 보안 규칙, 실시간 리스너로 타임라인·역극 반영
3. 확률·재화·시간 판정(공부, 아르바이트, 송금 수수료, 펜팔 분실, 배급)을 Cloud Functions로 이동
4. Storage 업로드 + 리사이즈(WebP)
5. 운영자 클레임 스크립트, 운영자 화면 연결

세팅이 끝나면 "파이어베이스 세팅 끝났어"라고만 알려주세요. 그때부터 1번부터 이어서 진행합니다.
