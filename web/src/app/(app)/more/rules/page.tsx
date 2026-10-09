import { LiveDoc } from "@/components/docs/LiveDoc";
import { RULES } from "@/lib/docs";

export const metadata = { title: "규칙" };

export default function Page() {
  return <LiveDoc id="rules" fallback={RULES} />;
}
