import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { meetingCode, title, date, time } = await request.json();

    // 1. Combine date and time into a Date object
    const scheduledStartTime = new Date(`${date}T${time}:00`);

    // 2. Update the meeting in the database
    const updatedMeeting = await db.meeting.update({
      where: { meetingCode },
      data: {
        title: title,
        startTime: scheduledStartTime,
      },
    });

    // 3. NODEMAILER INTEGRATION
    try {
      // Create the email transporter using Gmail SMTP
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Format the date nicely for the email
      const formattedDate = scheduledStartTime.toLocaleString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      });

      const meetingLink = `${process.env.NEXTAUTH_URL}/meeting/${meetingCode}`;

      // Define the email content
      const mailOptions = {
        from: `"VaartaV Meetings" <${process.env.EMAIL_USER}>`,
        to: session.user.email,
        subject: `📅 Scheduled: ${title}`,
        html: `
          <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Meeting Scheduled!</h1>
            </div>
            <div style="padding: 32px; background-color: #ffffff; color: #1f2937;">
              <p style="font-size: 16px;">Hi ${session.user.name?.split(" ")[0] || "there"},</p>
              <p style="font-size: 16px;">Your meeting <strong>"${title}"</strong> has been successfully scheduled.</p>
              
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0;"><strong>When:</strong> ${formattedDate}</p>
                <p style="margin: 0;"><strong>Room Code:</strong> ${meetingCode}</p>
              </div>

              <div style="text-align: center; margin-top: 32px;">
                <a href="${meetingLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Join Meeting Room
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 32px; border-top: 1px solid #e5e7eb; pt-4;">
                Or share this link with your guests:<br/>
                <a href="${meetingLink}" style="color: #4f46e5;">${meetingLink}</a>
              </p>
            </div>
          </div>
        `,
      };

      // Send the email
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${session.user.email}`);
      
    } catch (emailError) {
      // We catch email errors separately so the meeting still schedules even if the email fails!
      console.error("Meeting scheduled, but email failed to send:", emailError);
    }

    return NextResponse.json({ success: true, meeting: updatedMeeting });
  } catch (error) {
    console.error("Failed to schedule meeting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}