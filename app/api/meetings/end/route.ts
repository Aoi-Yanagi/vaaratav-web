import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { meetingCode } = body;

    if (!meetingCode) {
      return NextResponse.json({ error: "Meeting code required" }, { status: 400 });
    }

    // 1. Verify the user is actually the host of this meeting
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    const meeting = await db.meeting.findUnique({ where: { meetingCode } });

    if (!meeting || meeting.hostId !== user?.id) {
      return NextResponse.json({ error: "Not authorized to end this meeting" }, { status: 403 });
    }

    // 2. Update the meeting status to COMPLETED so it moves to Recent History
    await db.meeting.update({
      where: { meetingCode },
      data: {
        status: "COMPLETED",
        endTime: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to end meeting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}