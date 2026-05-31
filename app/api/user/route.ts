import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Handle updating the User's Name
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name } = await request.json();
    if (!name || name.trim() === "") return NextResponse.json({ error: "Name is required" }, { status: 400 });

    await db.user.update({
      where: { email: session.user.email },
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Handle Account Deletion
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Prisma will cascade and delete associated meetings if your schema is set up with onDelete: Cascade
    await db.user.delete({
      where: { email: session.user.email },
    });

    return NextResponse.json({ success: true, message: "Account deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}