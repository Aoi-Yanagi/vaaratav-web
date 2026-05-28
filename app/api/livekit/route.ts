import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');

  if (!room || !username) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // --- THE FIX ---
  // Generate a 100% unique ID for the system to prevent tab collisions
  const uniqueIdentity = `${username}-${crypto.randomUUID()}`;

  // Create a secure token
  const at = new AccessToken(apiKey, apiSecret, { 
    identity: uniqueIdentity, // LiveKit uses this to manage connections (Strictly Unique)
    name: username,           // The UI uses this for the Display Name (Can be duplicate)
    ttl: 7200 
  });
  
  at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

  return NextResponse.json({ token: await at.toJwt() });
}