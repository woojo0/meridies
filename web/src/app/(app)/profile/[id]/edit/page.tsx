import { Suspense } from "react";
import { EditProfile } from "@/components/profile/EditProfile";

export const metadata = { title: "프로필 수정" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <EditProfile />
    </Suspense>
  );
}
