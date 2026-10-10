import { Suspense } from "react";
import { DmView } from "@/components/dm/DmView";

export const metadata = { title: "오너 DM" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DmView />
    </Suspense>
  );
}
