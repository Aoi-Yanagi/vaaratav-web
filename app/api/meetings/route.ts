import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";

// TO Prevent multiple Prisma instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function POST(req: Request) {
  try {
    // 1. Check if the USER is logged in
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // 2. Finds USER in the database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in database." }, { status: 404 });
    }

    // 3. Generates clean, 6-character meeting code (no. and alphabets in small-case)
    const meetingCode = Math.random().toString(36).substring(2, 8).toLowerCase();

    // 4. Save the meeting to Neon, locking this user as the Host
    const meeting = await prisma.meeting.create({
      data: {
        meetingCode,
        hostId: user.id, // This officially makes USER the owner
      },
    });

    return NextResponse.json({ meetingCode: meeting.meetingCode });
  } catch (error) {
    console.error("Failed to create meeting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}