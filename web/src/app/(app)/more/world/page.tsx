import { LiveDoc } from "@/components/docs/LiveDoc";
import { WORLD } from "@/lib/docs";

export const metadata = { title: "공개 세계관" };

export default function Page() {
  return <LiveDoc id="world" fallback={WORLD} />;
}
