import { PublicDoc } from "@/components/landing/PublicDoc";
import { WORLD } from "@/lib/docs";

export const metadata = { title: "공개 세계관" };

export default function Page() {
  return <PublicDoc id="world" title="공개 세계관" eyebrow="제국력 828년 · 전원 공개" src={WORLD} />;
}
