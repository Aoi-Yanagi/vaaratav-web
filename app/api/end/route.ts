import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingCode } = await req.json();

    if (!meetingCode) {
      return NextResponse.json({ error: "Meeting code is required" }, { status: 400 });
    }

    // Update the meeting status to COMPLETED and set the endTime to right now
    const updatedMeeting = await prisma.meeting.update({
      where: { meetingCode: meetingCode },
      data: {
        status: "COMPLETED",
        endTime: new Date(),
      },
    });

    return NextResponse.json({ success: true, meeting: updatedMeeting });
  } catch (error) {
    console.error("Failed to end meeting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}