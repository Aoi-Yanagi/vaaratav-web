import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// 🚨 THESE TWO LINES TELL VERCEL TO STOP TRYING TO BUILD THIS FILE 🚨
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Note: We intentionally pass the 'request' parameter even if we don't use it.
// This forces Next.js to realize this route handles dynamic incoming user requests!
export async function GET(request: Request, { params }: { params: { meetingCode: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const meeting = await db.meeting.findUnique({
      where: { meetingCode: params.meetingCode }
    });

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, meeting });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// (If you also have a POST, PATCH, or DELETE function in this file, leave them below as they were!)