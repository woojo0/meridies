import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Nanum_Pen_Script, Noto_Serif_KR } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const notoSerif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-noto-serif",
  display: "swap",
});
const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  weight: "45 920",
  variable: "--font-pretendard",
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic", "normal"],
  variable: "--font-cormorant",
  display: "swap",
});
const nanumPen = Nanum_Pen_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-nanum-pen",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "메리디에스 · Meridies", template: "%s · 메리디에스" },
  description: "검은 정오 이후의 루체른 황립 아카데미. 아우렐 제국을 배경으로 한 자캐 커뮤니티.",
  applicationName: "메리디에스",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "메리디에스" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#121211" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${notoSerif.variable} ${pretendard.variable} ${cormorant.variable} ${nanumPen.variable}`} suppressHydrationWarning>
      <head>
        {/* 저장된 테마를 첫 페인트 전에 적용해 깜빡임을 막아요. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("meridies-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-bg text-ink font-body">{children}</body>
    </html>
  );
}
