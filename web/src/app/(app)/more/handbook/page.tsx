import { LiveDoc } from "@/components/docs/LiveDoc";
import { HANDBOOK } from "@/lib/docs";

export const metadata = { title: "루체른 생활 편람" };

export default function Page() {
  return <LiveDoc id="handbook" fallback={HANDBOOK} />;
}
