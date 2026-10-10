import { Suspense } from "react";
import { DmListView } from "@/components/dm/DmView";

export const metadata = { title: "오너 DM" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DmListView />
    </Suspense>
  );
}
