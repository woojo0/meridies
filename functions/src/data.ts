/** 서버 쪽 게임 수치. web/src/lib/constants.ts와 같은 값을 유지하세요. */
export const H = 3600e3;
export const STUDY_MS = H;
export const JOB_MS = 2 * H;
export const LETTER_MS = H;
export const JOKBO = 10;
export const KW_COST = 1;
export const RATION = [1, 1, 2, 2, 3];
export const TOTAL_ALLOC = 2000;
export const KW_MAX_ALLOC = 199;
export const STUDY_PER_DAY = 3;
export const JOB_PER_DAY = 2;
export const TRANSFER_FEE = 0.1;
export const TRANSFER_MIN = 2;
export const START_MONEY = 40;
export const LOST_LETTER_RATE = 0.1;
export const RARE_DOLL_RATE = 0.06;

export type SubjectId = "kw" | "th" | "lt" | "wr" | "ma" | "na" | "et" | "pe" | "ar";
export const SUBJECTS: { id: SubjectId; name: string; max?: number }[] = [
  { id: "kw", name: "광휘 실습 (기초)", max: 4 },
  { id: "th", name: "마법 이론 입문", max: 8 },
  { id: "lt", name: "빛 개론", max: 7 },
  { id: "wr", name: "제국어와 글쓰기" },
  { id: "ma", name: "셈법" },
  { id: "na", name: "자연 견문" },
  { id: "et", name: "예법과 생활" },
  { id: "pe", name: "기초 단련" },
  { id: "ar", name: "노래와 그림" },
];
export const GRADES = ["니힐", "빅스", "사티스", "베네", "옵티메"];
export const DORMS = ["aurora", "vesper", "candida", "astra", "fifth"] as const;
export const STAGES = ["입학", "1차 성장", "2차 성장"];

export const FORTUNES = [
  "오늘은 질문 하나가 답 세 개보다 값지다.",
  "잃어버린 물건은 생각보다 가까이 있다. 주머니를 다시 볼 것.",
  "정오의 그림자가 짧은 날, 좋은 소식이 온다.",
  "온실 사과를 나누면 친구가 하나 는다.",
  "오늘 실습에서는 서두르지 말 것. 빛은 기다리는 손에 모인다.",
  "도서관 3층 창가에 행운이 앉아 있다.",
  "누군가 당신의 편지를 기다리고 있다.",
];
export const HEARTS = [
  "콩, 콩. 아주 느리게, 하지만 분명하게.",
  "두근두근두근. 오늘따라 유난히 빠르다.",
  "…아무 소리도 안 들린다. 아니, 방금 들렸나?",
  "따뜻하다. 귀를 대고 있으면 졸음이 온다.",
  "두 개의 심장 소리가 겹쳐 들리는 것 같다.",
];

export interface Item { id: string; name: string; cat: string; price: number; icon: string; desc: string; use: string; stock: number; limit: number; qty?: number; instant?: boolean; hidden?: boolean }
const it = (id: string, name: string, cat: string, price: number, icon: string, desc: string, use: string, x: Partial<Item> = {}): Item => ({ id, name, cat, price, icon, desc, use, stock: -1, limit: 0, ...x });
export const ITEMS: Item[] = [
  it("stamp", "마법 우표", "편지", 5, "stamp", "랜덤한 학생에게 편지를 부칠 수 있는 우표. 가끔은 선생님의 책상 위에 도착하기도 한다.", "펜팔 새 편지를 보낼 때 1장 사용"),
  it("pigeon", "마법 비둘기", "편지", 8, "bird", "마법 우표의 출처를 추적할 수 있는 비둘기. 움직임이 빨라 직접 따라갈 수는 없지만 답장을 보낼 수는 있다.", "펜팔 답장을 보낼 때 1마리 사용"),
  it("bracelet", "우정 팔찌", "장식·선물", 30, "bracelet", "두 가지 색실을 엮어 만든 끈 팔찌 한 쌍. 다양한 디자인이 구비되어 있다.", "한 쌍(2개)이 들어와요. 하나를 선물할 수 있어요", { qty: 2 }),
  it("lantern", "장식용 등불", "장식·선물", 40, "lantern", "빛이 담긴 등불 모양 소품. 솔리스를 꺼내 쓸 만큼의 빛은 담겨있지 않지만 방 안에 장식해두면 은은하게 빛난다.", "장식·선물용"),
  it("flowers", "꽃다발", "장식·선물", 25, "flower", "포장이 화려한 꽃다발. 정작 꽃은 두세송이 정도밖에 없다.", "장식·선물용"),
  it("jokbo", "선배가 남기고 간 족보", "학교생활", 120, "scroll", "기숙사의 구석에서 발견된 의문의 족보. 성적에 도움이 될 것 같은 기분이 든다.", "공부하기 때 사용하면 그 과목 성적 +10점"),
  it("excuse", "지각사유서", "학교생활", 60, "note", "교장선생님의 인장이 미리 찍혀있는 지각사유서. 무얼 적어도 용서될 것 같다.", "프로필 제출 1일 연장"),
  it("cookie", "포춘 쿠키", "뽑기", 3, "cookie", "쿠키 안의 쪽지를 보고 오늘의 운세를 알 수 있다. 쿠키에서는 밀가루 맛이 난다.", "열어서 오늘의 운세 보기"),
  it("egg", "정체불명의 알", "뽑기", 50, "egg", "색상, 형태가 다양한 여러가지 알. 귀를 기울이면 심장소리가 들린다.", "귀 기울이기 · 인당 1회 구매", { limit: 1 }),
  it("drink", "솔리스 드링크", "학교생활", 20, "bottle", "반짝이가 떠다니는 황금빛 물약. 마시면 온 몸에 힘이 솟는다.", "오늘 아르바이트 가능 횟수 +1"),
  it("key", "사감 선생님의 만능열쇠", "학교생활", 150, "key", "어느 기숙사든 드나들 수 있는 만능열쇠. 하루쯤이면 사용해도 들키지 않을 것 같다.", "다른 학부 기숙사 역극 하루(24시간) 체험"),
  it("claw", "인형 뽑기", "뽑기", 10, "doll", "집게가 내려간다. 무엇이 걸려 올라올지는 집게 마음.", "사는 즉시 인형 하나가 나와요", { instant: true }),
  it("ration", "배급 솔리스", "배급", 0, "bottle", "제국이 배급하는 표준 용기에 담긴 햇빛. 흔들면 잔량을 가늠할 수 있다.", "광휘 실습 연습에 1병씩 쓴다. 하루 한 번 배급, 광휘 실습 등급이 높을수록 많이 받는다", { hidden: true }),
  it("doll-owl", "겨울 올빼미 인형", "인형", 0, "doll", "눈이 동그란 회색 올빼미. 배를 누르면 부엉 소리가 난다.", "장식·선물용", { hidden: true }),
  it("doll-cat", "검은 고양이 인형", "인형", 0, "doll", "꼬리가 유난히 긴 검은 고양이. 어딘가 시큰둥한 얼굴.", "장식·선물용", { hidden: true }),
  it("doll-sheep", "아기 양 인형", "인형", 0, "doll", "손바닥만 한 양. 털이 진짜 양털이라는 소문이 있다.", "장식·선물용", { hidden: true }),
  it("doll-carriage", "등불 마차 인형", "인형", 0, "doll", "입학 날 탔던 그 마차를 닮은 작은 봉제 인형.", "장식·선물용", { hidden: true }),
  it("doll-sun", "온전한 해 인형", "인형", 0, "doll", "둥글고 노란 해. 아무도 본 적 없는 모양이라 오히려 인기가 많다. (희귀)", "장식·선물용", { hidden: true }),
];

export interface Job { id: string; name: string; subject: SubjectId; desc: string; rates: number[]; win: [number, number]; lose: [number, number]; flavorW: string; flavorL: string }
const E = [45, 60, 75, 88, 95], N = [35, 50, 65, 80, 93], D = [10, 25, 45, 68, 88];
const job = (id: string, name: string, subject: SubjectId, desc: string, rates: number[], win: [number, number], lose: [number, number], flavorW: string, flavorL: string): Job => ({ id, name, subject, desc, rates, win, lose, flavorW, flavorL });
export const JOBS: Job[] = [
  job("j-kw", "솔리스 램프 점검", "kw", "램프 잔량을 흔들어 가늠하고 기록한다. 실기 등급이 그대로 드러나는, 아무나 못 하는 일.", [5, 15, 30, 50, 75], [35, 50], [0, 2], "잔량 기록이 사감 장부와 정확히 맞았다.", "병 하나를 빈 것으로 잘못 적었다."),
  job("j-th", "판서 필사 보조", "th", "교수의 판서를 학생용 노트로 옮겨 적는다. 틀린 공식 하나가 한 학년을 헤매게 한다.", [25, 40, 55, 72, 90], [14, 20], [1, 3], "교수가 노트를 넘겨보며 고개를 끄덕였다.", "공식 하나를 거꾸로 옮겨 적었다."),
  job("j-lt", "일조 관측 기록", "lt", "천문원에 보낼 오늘의 빛 시간을 재고 적는다. 정오의 차폐 시작과 끝을 놓치면 안 된다.", [25, 40, 55, 72, 90], [15, 21], [1, 2], "기록이 천문원 수치와 1분도 다르지 않았다.", "차폐가 끝나는 순간을 놓쳤다."),
  job("j-wr", "도서관 서가 정리", "wr", "열람실 반납 도서를 제자리에. 안쪽 서고는 들어가지 말 것.", E, [7, 11], [1, 3], "사서가 고개를 끄덕였다.", "책 한 권의 자리를 끝내 못 찾았다."),
  job("j-ma", "매점 장부 정리", "ma", "식당 매점의 그로셴 장부를 맞춘다. 사과 한 알 값이 비면 처음부터 다시.", N, [10, 15], [1, 2], "장부가 한 그로셴도 틀리지 않고 맞았다.", "2그로셴이 끝내 어디로 갔는지 모른다."),
  job("j-na", "온실 일손", "na", "물 주기와 사과 따기. 손이 얼지 않게 장갑을 챙길 것.", E, [6, 10], [1, 2], "사과 한 알을 덤으로 받았다.", "화분을 하나 깼다. 반만 받았다."),
  job("j-et", "만찬 식탁 차리기", "et", "학부 만찬의 식기와 자리를 격식대로 놓는다. 포크 하나의 방향도 예법이다.", E, [7, 12], [1, 3], "사감이 식탁을 한 바퀴 돌고 아무 말도 하지 않았다. 칭찬이다.", "나이프를 전부 반대로 놓았다."),
  job("j-pe", "옛 창고 지구 정리", "pe", "관리인 요제프 그로프 씨의 왕국. 벌점 노역과 같은 일을 돈 받고 한다.", D, [14, 22], [0, 1], "그로프 씨가 처음으로 이름을 불러 주었다.", "그로프 씨가 말없이 상자를 다시 쌓았다."),
  job("j-ar", "회랑 습작 걸기", "ar", "학기 습작을 회랑에 거는 일. 비뚤게 걸면 다시.", N, [9, 14], [0, 2], "걸어 둔 그림 앞에 사람들이 멈췄다.", "액자 셋이 비뚤었다."),
];
