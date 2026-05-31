import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Import only auth options from here
import { db } from "@/lib/db"; // Import your database instance from here

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the incoming request for the meeting code
    const { meetingCode } = await req.json();

    if (!meetingCode) {
      return NextResponse.json({ error: "Meeting code is required" }, { status: 400 });
    }

    // Update the meeting status to COMPLETED and set the exact end time
    // Changed `prisma.meeting` to `db.meeting` to match your setup
    const updatedMeeting = await db.meeting.update({
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