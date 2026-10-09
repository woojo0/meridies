import { H, SUBJECTS } from "./constants";
import { addDays, uid, ymd } from "./format";
import type { CalEvent, CatId, Character, Data, Item, Job, Post, Profile, Room, SubjectId, Thread } from "./types";

export const DATA_VERSION = 1;

function artLibrary() {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#1d2133"/><rect x="0" y="230" width="400" height="70" fill="#2a2418"/><g fill="#0e1120"><path d="M90 230V110a60 60 0 0 1 120 0v120z"/><path d="M230 230V130a45 45 0 0 1 90 0v100z"/></g><path d="M100 230V112a50 50 0 0 1 100 0v118z" fill="#3a4466"/><path d="M240 230V132a35 35 0 0 1 70 0v98z" fill="#3a4466"/><circle cx="160" cy="120" r="22" fill="#d9b85c" opacity=".9"/><circle cx="168" cy="116" r="20" fill="#2d3550"/><path d="M150 230V60M100 150h100M275 230V100M240 175h70" stroke="#0e1120" stroke-width="4"/><rect x="40" y="215" width="120" height="16" fill="#5a4426"/><rect x="60" y="200" width="30" height="15" fill="#8c2c3c"/><rect x="92" y="204" width="22" height="11" fill="#c9a24a"/><circle cx="330" cy="215" r="10" fill="#f2c96a" opacity=".85"/><circle cx="330" cy="215" r="26" fill="#f2c96a" opacity=".15"/></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s);
}

export function scoresFrom(arr: number[]): Record<SubjectId, number> {
  const o = {} as Record<SubjectId, number>;
  SUBJECTS.forEach((s, i) => (o[s.id] = arr[i]));
  return o;
}

const P = (gender: string, age: string, height: string, pers: string, text: string): Profile => ({ gender, age, height, pers, text });

export function seed(): Data {
  const t = Date.now();
  const td = new Date();

  const chars: Character[] = [
    {
      id: "c1", name: "리제 아른하임", dorm: "vesper", owner: "u1", money: 120, inv: { stamp: 1, pigeon: 1, cookie: 1 },
      profiles: {
        0: P("여", "11세", "139cm", "관찰하고 기록한다. 질문이 대답보다 많다.", "항구 도시 측량사의 딸. 일곱 살 겨울, 잔의 물이 저 혼자 얼었다. 베스퍼 문의 관찰 문제를 첫날부터 맞혔다고 은근히 자랑하고 다닌다."),
        1: P("여", "15세", "156cm", "여전히 묻는다. 다만 이제는 답을 직접 찾는다.", "5학년. 천문 관측과 고어 강독을 골랐다. 4학년 때 폐강 위기의 고어 입문을 살리려고 서명을 받으러 다닌 장본인."),
      },
      scores: scoresFrom([180, 250, 300, 260, 240, 280, 170, 150, 170]), tx: [],
    },
    {
      id: "c2", name: "카스파 폰 될러", dorm: "astra", owner: "u2", money: 310, inv: {},
      profiles: { 0: P("남", "11세", "144cm", "예의 바르고 계산이 빠르다. 지는 걸 싫어한다.", "중부 귀족가의 차남. 등불 마차에서 수리공 집 아이와 같은 칸에 앉은 것이 인생 첫 충격이었다.") },
      scores: scoresFrom([290, 260, 220, 240, 330, 150, 250, 120, 140]), tx: [],
    },
    {
      id: "c3", name: "마르타 크닐", dorm: "candida", owner: "u3", money: 40, inv: {},
      profiles: { 0: P("여", "11세", "137cm", "곧고 다정하다. 거짓말을 하면 귀가 빨개진다.", "방앗간 집 셋째. 아이가 크게 운 날 시계가 멎었다. 칸디다 기숙사에 자물쇠가 없다는 걸 알고 오히려 안심했다.") },
      scores: scoresFrom([240, 220, 200, 230, 200, 260, 320, 200, 130]), tx: [],
    },
    {
      id: "c4", name: "요나스 헤르츠", dorm: "aurora", owner: "u4", money: 52, inv: {},
      profiles: { 0: P("남", "11세", "141cm", "시끄럽고 손이 빠르다. 그림을 그리면 조용해진다.", "수도 변두리 간판장이의 아들. 아우로라 공용 벽에 첫 주부터 그림을 걸었다가 금요일에 지워지는 걸 보고 울 뻔했다.") },
      scores: scoresFrom([230, 200, 160, 210, 140, 190, 180, 230, 340]), tx: [],
    },
    {
      id: "c5", name: "이다 바흐", dorm: "fifth", owner: "u5", money: 18, inv: {},
      profiles: { 0: P("여", "11세", "133cm", "말수가 적다. 대답 대신 고개를 끄덕인다.", "극북 국경 마을 출신. 화로에 손을 넣었을 때 아무 색도 피지 않았다. 북편 기숙사는 생각보다 넓고, 생각보다 조용하다.") },
      scores: scoresFrom([200, 230, 280, 220, 210, 250, 190, 210, 210]), tx: [],
    },
    {
      id: "c6", name: "펠릭스 오르만", dorm: "vesper", owner: "u6", money: 88, inv: {},
      profiles: { 0: P("남", "11세", "146cm", "느긋하다. 시계 고치는 걸 좋아한다.", "시계공의 손자. 녹스본이라는 말을 들으면 웃어넘기지만, 실습 시간엔 누구보다 오래 남는다.") },
      scores: scoresFrom([170, 240, 250, 190, 300, 230, 200, 220, 200]), tx: [],
    },
  ];

  const posts: Post[] = [
    { id: "p1", charId: "c3", stage: 0, text: "오늘 빛 다섯 시간 사십 분. 온실 사과 하나 남았는데 반 나눠 먹을 사람?", images: [], at: t - 1.5 * H, likes: ["c4"] },
    { id: "p2", charId: "c2", stage: 0, text: "아스트라 옥상 천문대는 전교 개방이다. 다만 내 자리는 창가 첫 번째니까, 그건 알아두도록.", images: [], at: t - 4 * H, likes: ["c6", "c1"] },
    { id: "p3", charId: "c5", stage: 0, text: "도서관 열람실 창가. 정오에 해가 가려질 때 이 창으로 보면 둥근 테두리만 남는다.", images: [artLibrary()], at: t - 7 * H, likes: ["c1"] },
    { id: "p4", charId: "c4", stage: 0, text: "누가 내 그림 옆에 낙서했어. 솔직히 좀 잘 그렸는데 그래도 나와. (회랑에 걸린 습작 앞에서 팔짱을 끼고)", images: [], at: t - 20 * H, likes: [] },
    { id: "p5", charId: "c1", stage: 0, text: "빛 개론 교재가 해마다 얇아진다는 농담, 진짜였다. 첫 장이 \"우리는 모른다\"로 시작한다.", images: [], at: t - 26 * H, likes: ["c2", "c3", "c6"] },
  ];

  const rooms: Room[] = [
    {
      id: "r1", members: ["c1", "c4"],
      source: { postId: "p4", charId: "c4", stage: 0, text: posts[3].text, images: [], at: posts[3].at },
      messages: [
        { id: "m1", charId: "c1", stage: 0, text: "(습작을 한참 들여다보다가) 낙서가 아니라, 네 그림에 그림자를 그려 넣은 것 같은데. 빛이 왼쪽에서 오니까.", at: t - 19 * H },
        { id: "m2", charId: "c4", stage: 0, text: "…그림자? (다시 보고는 잠깐 입을 다문다) 그럼 이거 지우면 안 되는 거야?", at: t - 18.5 * H },
      ],
      status: "open", lastAt: t - 18.5 * H, read: { c1: t - 18 * H, c4: t - 18 * H },
    },
  ];

  const dormMsgs = {
    "vesper-0": [
      { id: "x0", charId: "c6", stage: 0 as const, text: "여기가 제일 따뜻하네. (벽난로 앞 자리를 차지하고 앉으며)", at: t - 50 * H },
      { id: "x1", charId: "c6", stage: 0 as const, text: "\"오늘 정오의 그림자는 어제보다 길었는가, 짧았는가.\" (문에 붙은 쪽지를 소리 내어 읽고) …측정 안 한 사람?", at: t - 3 * H },
      { id: "x2", charId: "c1", stage: 0 as const, text: "짧았어. 손가락 한 마디쯤. (수첩을 펼쳐 보이며) 근데 이유는 모르겠어.", at: t - 2.6 * H },
    ],
  };

  const threads: Thread[] = [
    {
      id: "t1", a: "c2", b: "c1", alias: { c2: "익명의 편지인 #07", c1: "익명의 편지인 #19" },
      letters: [
        { from: "c2", text: "처음 편지를 써 봐요.\n학교에서 제일 좋아하는 장소가 어디예요? 저는 아직 정하지 못했어요. 다들 천문대가 좋다는데, 사람이 너무 많아서요.\n\n답장은 천천히 해도 돼요.", sentAt: t - 6 * H, deliverAt: t - 5 * H, read: false },
      ],
    },
  ];

  const ev = (off: number, title: string, cat: CatId, desc: string, len = 0): CalEvent => ({
    id: uid(), date: ymd(addDays(td, off)), end: len ? ymd(addDays(td, off + len)) : "", title, cat, desc,
  });
  const events: CalEvent[] = [
    ev(-2, "서버 점검", "notice", "오전 2시~4시. 이 시간엔 글 작성이 안 됩니다."),
    ev(3, "등불 축제의 밤", "event", "회랑과 연회장에 솔리스 램프가 켜집니다. 축제 역극 기간."),
    ev(6, "스토리: 거울 호수의 종소리", "story", "운영 진행 스토리. 공지된 시간에 타임라인에서 시작합니다."),
    ev(10, "중간 시험 기간", "academic", "공부하기 횟수가 하루 4회로 늘어납니다(예시).", 4),
    ev(21, "1차 성장 프로필 공개 예정", "story", "1차 성장 프로필 마감 3일 전까지 등록해 주세요."),
  ];

  const it = (id: string, name: string, cat: string, price: number, icon: string, desc: string, use: string, x: Partial<Item> = {}): Item => ({
    id, name, cat, price, icon, desc, use, stock: -1, limit: 0, ...x,
  });
  const items: Item[] = [
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

  const E = [45, 60, 75, 88, 95];
  const N = [35, 50, 65, 80, 93];
  const D = [10, 25, 45, 68, 88];
  const job = (id: string, name: string, subject: SubjectId, desc: string, rates: number[], win: [number, number], lose: [number, number], flavorW: string, flavorL: string): Job => ({
    id, name, subject, desc, rates, win, lose, flavorW, flavorL,
  });
  const jobs: Job[] = [
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

  return {
    v: DATA_VERSION,
    stage: 0,
    chars, posts, rooms, dormMsgs, threads, events, items, jobs,
    notifs: [],
    notice: { text: "2학기 첫 주 공지: 마법 사용은 수업 시간과 지정 연습실에서만. 손바닥 위 불빛 한 점은 눈감아 줍니다.", at: t - 30 * H },
    adminLog: [],
    results: null,
  };
}
