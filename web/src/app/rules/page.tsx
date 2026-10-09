import { PublicDoc } from "@/components/landing/PublicDoc";
import { RULES } from "@/lib/docs";

export const metadata = { title: "규칙" };

export default function Page() {
  return <PublicDoc title="규칙" eyebrow="가입 신청 시 동의 필수" src={RULES} />;
}
