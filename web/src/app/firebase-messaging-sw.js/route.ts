/**
 * FCM 서비스워커. public/ 정적 파일 대신 라우트로 내려서 환경변수의 Firebase 설정을 그대로 넣어요.
 * 알림 표시는 FCM SDK가 notification 페이로드로 알아서 하고, 클릭은 webpush.fcmOptions.link를 따라가요.
 */
export function GET() {
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
  const js = `importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(cfg)});
const messaging = firebase.messaging();
// 알림 페이로드가 없는 데이터 메시지만 직접 띄워요.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const d = payload.data || {};
  self.registration.showNotification(d.title || "메리디에스", { body: d.body || "", icon: "/icon-192.png", badge: "/icon-192.png", data: { link: d.link || "/timeline" } });
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const link = (e.notification.data && e.notification.data.link) || "/timeline";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((ws) => {
    for (const w of ws) { if ("focus" in w) { w.navigate(link); return w.focus(); } }
    return clients.openWindow(link);
  }));
});
`;
  return new Response(js, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Service-Worker-Allowed": "/", "Cache-Control": "no-cache" } });
}
