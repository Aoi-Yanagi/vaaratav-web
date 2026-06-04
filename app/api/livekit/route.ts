import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room");
    const guestUsername = searchParams.get("username");

    if (!room) {
      return NextResponse.json({ error: "Missing 'room' query parameter" }, { status: 400 });
    }

    // Safely check for a logged-in user
    const session = await getServerSession(authOptions);
    
    let identity = "";
    let isHost = false;

    // Logic: Authenticated Users = Hosts. Fallback to Guest Name.
    if (session?.user) {
        identity = session.user.name || session.user.email || "Host User";
        isHost = true; 
    } else if (guestUsername) {
        identity = guestUsername;
        isHost = false;
    } else {
        // If neither exists, they shouldn't be requesting a token
        return NextResponse.json({ error: "Unauthorized. Please log in or provide a guest username." }, { status: 401 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "LiveKit credentials not configured" }, { status: 500 });
    }

    // Generate the token
    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name: identity,
      ttl: "10m", // Token expiration
    });

    at.addGrant({ 
        roomJoin: true, 
        room, 
        canPublish: true, 
        canSubscribe: true,
        canPublishData: true, // Required for Chat & Reactions
        roomAdmin: isHost     // Only give host powers to logged in users
    });

    const token = await at.toJwt();

    return NextResponse.json({ token, isHost });
  } catch (error) {
    console.error("LiveKit Token Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}