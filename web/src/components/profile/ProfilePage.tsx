"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Empty } from "../ui/primitives";
import { ProfileView } from "./ProfileView";

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const c = useStore((s) => s.data.chars.find((x) => x.id === id));
  if (!c) return <Empty className="py-16">캐릭터를 찾을 수 없어요.</Empty>;
  return <ProfileView key={c.id} c={c} />;
}
