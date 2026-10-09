import { Suspense } from "react";
import { InboxView } from "@/components/inbox/InboxView";

export const metadata = { title: "운영자 문의" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <InboxView />
    </Suspense>
  );
}
