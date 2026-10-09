import { DocView } from "@/components/docs/DocView";
import { WORLD } from "@/lib/docs";

export const metadata = { title: "공개 세계관" };

export default function Page() {
  return <DocView src={WORLD} />;
}
