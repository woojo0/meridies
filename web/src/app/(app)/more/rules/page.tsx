import { DocView } from "@/components/docs/DocView";
import { RULES } from "@/lib/docs";

export const metadata = { title: "규칙" };

export default function Page() {
  return <DocView src={RULES} />;
}
