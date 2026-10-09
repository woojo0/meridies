"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Empty } from "../ui/primitives";
import { AdminView } from "./AdminView";

/** 운영자 권한이 있을 때만 운영자 도구를 보여줘요. */
export function AdminGate() {
  const admin = useStore((s) => s.session.admin);
  if (!admin) {
    return (
      <Empty className="py-16">
        운영자만 볼 수 있는 화면이에요.<br />
        <Link href="/more" className="mt-2 inline-block underline underline-offset-2">더보기로 돌아가기</Link>
      </Empty>
    );
  }
  return <AdminView />;
}
