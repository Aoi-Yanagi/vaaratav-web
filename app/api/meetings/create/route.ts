import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST() {
  try {
    // 1. Verify the user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Find the user in the database to get their ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Generate a secure, unique room code (e.g., "vrtv-8f7d-4b2a")
    const rawUuid = crypto.randomUUID();
    const meetingCode = `vrtv-${rawUuid.substring(0, 4)}-${rawUuid.substring(4, 8)}`;

    // 4. Create the meeting in the database
    const newMeeting = await prisma.meeting.create({
      data: {
        title: `${session.user.name?.split(" ")[0] || "User"}'s Meeting`,
        meetingCode: meetingCode,
        hostId: user.id,
        status: "WAITING", // Default status from your schema
        startTime: new Date(),
      },
    });

    // 5. Return the code so the frontend can redirect the user
    return NextResponse.json({ success: true, meetingCode: newMeeting.meetingCode });
  } catch (error) {
    console.error("Failed to create meeting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}