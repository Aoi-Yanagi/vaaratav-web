import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");

  if (!room || !username) {
    return NextResponse.json({ error: 'Missing "room" or "username"' }, { status: 400 });
  }

  // Ensure these exist in your .env file!
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Create a secure token for this specific user in this specific room
  const at = new AccessToken(apiKey, apiSecret, {
    identity: username,
  });

  at.addGrant({ roomJoin: true, room: room });

  return NextResponse.json({ token: await at.toJwt() });
}