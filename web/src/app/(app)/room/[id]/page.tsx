import { Suspense } from "react";
import { RoomPage } from "@/components/rp/RoomPage";

export const metadata = { title: "역극" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RoomPage />
    </Suspense>
  );
}
