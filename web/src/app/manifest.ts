import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "메리디에스 · Meridies",
    short_name: "메리디에스",
    description: "검은 정오 이후의 루체른 황립 아카데미. 자캐 커뮤니티.",
    start_url: "/timeline",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#fbfaf7",
    lang: "ko",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
