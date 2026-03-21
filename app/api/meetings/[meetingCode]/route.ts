import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const unwrappedParams = await params;
    const meetingCode = unwrappedParams.meetingCode;
    const session = await getServerSession();

    // 1. Find the meeting in the database
    const meeting = await prisma.meeting.findUnique({
      where: { meetingCode },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // 2. Default role: Guest(Not logged in)
    let role = "GUEST"; 

    // 3. Check for login session and determine their official role
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        if (user.id === meeting.hostId) {
          role = "HOST";
        } else {
          //currently limited to participant(MODERATORS ROLE LATER ON)
          role = "PARTICIPANT"; 
        }
      }
    }

    return NextResponse.json({ 
      meeting: { id: meeting.id, title: meeting.title, status: meeting.status },
      role 
    });

  } catch (error) {
    console.error("Failed to fetch meeting details:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}