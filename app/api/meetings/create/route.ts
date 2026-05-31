import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// 1. IMPORT DB FROM THE NEW LOCATION
import { db } from "@/lib/db"; 

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. USE 'db' INSTEAD OF 'prisma'
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a secure, random 9-character meeting code
    const generateCode = () => Math.random().toString(36).substring(2, 11);
    const meetingCode = generateCode();

    // 3. USE 'db' INSTEAD OF 'prisma' TO CREATE THE MEETING
    const newMeeting = await db.meeting.create({
      data: {
        title: `${user.name?.split(" ")[0] || "Guest"}'s Meeting`,
        meetingCode: meetingCode,
        hostId: user.id,
        status: "WAITING",
      }
    });

    return NextResponse.json({ meetingCode: newMeeting.meetingCode });
    
  } catch (error) {
    console.error("Failed to create meeting:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}