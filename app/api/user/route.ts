import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // OR import { db } from "@/lib/db"; depending on your setup
import { db } from "@/lib/db"; 

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, image } = body;

    // Safety check: Ensure an email was provided if they are trying to update
    if (!email || email.trim() === "") {
      return NextResponse.json({ error: "Email cannot be empty." }, { status: 400 });
    }

    // If the user changed their email, verify the new email isn't already taken
    if (email !== session.user.email) {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "This email is already in use by another account." }, { status: 400 });
      }
    }

    // Update the database with all provided fields
    const updatedUser = await db.user.update({
      where: { email: session.user.email },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(image && { image }), // Stores the URL or Base64 string directly
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("User Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}