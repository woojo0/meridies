"use client";

import { useParams } from "next/navigation";
import { RoomView } from "./RoomView";

export function RoomPage() {
  const { id } = useParams<{ id: string }>();
  return <RoomView key={id} id={id} />;
}
