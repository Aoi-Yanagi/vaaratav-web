import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { db } from '@/lib/db';// Our global Prisma connection!

export async function POST(req: Request) {
  // 1. Get the Webhook Secret from our environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env')
  }

  // 2. Grab the headers Clerk sent us (This is how we verify their identity)
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, it's a fake request. Boot them out!
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // 3. Get the actual user data from the request body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // 4. Create a new Svix instance with our secret to verify the signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', { status: 400 })
  }

  // 5. IF IT IS VERIFIED: Figure out what Clerk is telling us to do
  const eventType = evt.type;

  // --- HANDLE NEW USER SIGNUP ---
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    // Use Prisma to create the user in our Neon Database!
    try {
      await db.user.create({
        data: {
          clerkId: id,
          email: email,
          name: name !== '' ? name : null,
          imageUrl: image_url,
        }
      });
      console.log(`Successfully saved new user ${id} to database!`);
    } catch (error) {
      console.error("Error saving user to database:", error);
      return new Response('Database error', { status: 500 })
    }
  }

  // --- HANDLE USER DELETION ---
  if (eventType === 'user.deleted') {
    const { id } = evt.data;
    try {
      await db.user.delete({
        where: { clerkId: id }
      });
      console.log(`Successfully deleted user ${id} from database!`);
    } catch (error) {
      console.error("Error deleting user from database:", error);
    }
  }

  // 6. Tell Clerk we received the message successfully
  return new Response('Webhook received', { status: 200 })
}