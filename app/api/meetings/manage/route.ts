import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
// Define the expected shape of the payload
interface ManagePayload {
  title?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const action = body.action as string;
    const meetingCode = body.meetingCode as string;
    const payload = body.payload as ManagePayload | undefined;

    const meeting = await db.meeting.findUnique({ where: { meetingCode } });
    if (!meeting || meeting.hostId !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (action === "DELETE") {
      await db.meeting.delete({ where: { meetingCode } });
      return NextResponse.json({ success: true, message: "Meeting deleted" });
    } 
    
    if (action === "TOGGLE_FAVORITE") {
    
      const currentFavoriteStatus = meeting.isFavorite || false;
      
      const updated = await db.meeting.update({
        where: { meetingCode },
    
        data: { isFavorite: !currentFavoriteStatus }
      });
      
      return NextResponse.json({ success: true, isFavorite: updated.isFavorite });
    }

    if (action === "RENAME" && payload?.title) {
      await db.meeting.update({
        where: { meetingCode },
        data: { title: payload.title }
      });
      return NextResponse.json({ success: true, title: payload.title });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Manage meeting error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}