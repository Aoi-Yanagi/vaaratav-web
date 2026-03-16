// app/meeting/[roomId]/page.tsx
"use client";

import MeetingRoom from "@/components/meeting/MeetingRoom";
import { useParams } from "next/navigation";

export default function MeetingPage() {
  // Grab the room ID from the URL (e.g., /meeting/123 -> roomId = "123")
  const params = useParams();
  const roomId = params.roomId as string;

  return <MeetingRoom roomId={roomId} />;
}