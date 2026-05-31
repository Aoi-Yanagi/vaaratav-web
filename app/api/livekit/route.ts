import { AccessToken } from "livekit-server-sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomCode = searchParams.get("room");
    if (!roomCode) return NextResponse.json({ error: "Missing room" }, { status: 400 });

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    const meeting = await db.meeting.findUnique({ where: { meetingCode: roomCode } });

    if (!user || !meeting) return NextResponse.json({ error: "Invalid meeting" }, { status: 404 });

    const isHost = String(meeting.hostId) === String(user.id);
    const safeName = user.name || (user.email ? user.email.split("@")[0] : "Guest User");

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: user.id, 
      name: safeName,
    });

    at.addGrant({
      roomJoin: true,
      room: roomCode,
      canPublish: true,
      canSubscribe: true,
      roomAdmin: isHost, 
    });

    // FIX: Send isHost directly to the frontend so it bypasses the waiting room!
    return NextResponse.json({ token: await at.toJwt(), isHost });
  } catch (error) {
    console.error("LiveKit Token Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}