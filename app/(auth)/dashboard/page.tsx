import GlobalNavigation from "@/components/ui/global-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Plus, Users, MoreHorizontal } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Image from "next/image";
import { CreateMeetingButton } from "@/components/CreateMeetingButton";

// Ideally, import prisma from a centralized lib/prisma.ts file to prevent connection pooling issues in dev
const prisma = new PrismaClient(); 

export default async function Dashboard() {
  // 1. Authenticate the user on the server
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login"); // Protect the route
  }

  // 2. Fetch the user's internal ID based on their email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  // 3. FREE REAL-TIME ANALYTICS: Run Prisma queries in parallel for maximum speed
  const [totalMeetings, upcomingMeetingsData, recentHistoryData] = await Promise.all([
    // Count all meetings hosted by this user
    prisma.meeting.count({ where: { hostId: user.id } }),
    
    // Get meetings that haven't started yet (Limit to 5)
    prisma.meeting.findMany({
      where: { hostId: user.id, status: "WAITING" },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
    
    // Get meetings that are finished (Limit to 5)
    prisma.meeting.findMany({
      where: { hostId: user.id, status: "COMPLETED" },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })
  ]);

  // --- NEW: Calculate Total Minutes dynamically ---
  const totalMinutes = recentHistoryData.reduce((acc, meeting) => {
    // Ensure both startTime and endTime exist before doing math
    if (meeting.startTime && meeting.endTime) {
      const diffInMilliseconds = meeting.endTime.getTime() - meeting.startTime.getTime();
      const diffInMinutes = Math.round(diffInMilliseconds / 60000);
      return acc + diffInMinutes;
    }
    return acc;
  }, 0);

  // Extract user details securely for the UI
  const userName = session.user.name || "Guest User";
  const userImage = session.user.image;
  const initials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

  // Helper to format dates beautifully
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <GlobalNavigation />

      <div className="container mx-auto pt-24 px-4 flex flex-col lg:flex-row gap-8">
        
        {/* --- LEFT SIDEBAR (Quick Actions) --- */}
        <div className="w-full lg:w-1/4 space-y-6">
          <Card className="p-6 bg-neutral-900 border-neutral-800 flex items-center gap-4">
            {userImage ? (
              <Image 
                src={userImage} 
                alt="Profile" 
                width={48}
                height={48}
                className="rounded-full border-2 border-indigo-500/50" 
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
                {initials}
              </div>
            )}
            <div>
              <h3 className="font-semibold">{userName}</h3>
              <p className="text-sm text-gray-400">Pro Member</p>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            <CreateMeetingButton />
            <Button variant="outline" className="h-14 border-neutral-800 bg-neutral-900 justify-start text-lg px-6 hover:bg-neutral-800">
            </Button>
            <Button variant="outline" className="h-14 border-neutral-800 bg-neutral-900 justify-start text-lg px-6 hover:bg-neutral-800">
              <Calendar className="mr-3 w-6 h-6 text-indigo-400" /> Schedule
            </Button>
            <Button variant="outline" className="h-14 border-neutral-800 bg-neutral-900 justify-start text-lg px-6 hover:bg-neutral-800">
              <Users className="mr-3 w-6 h-6 text-green-400" /> Contacts
            </Button>
          </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 space-y-8">
          
          {/* Real-Time Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-indigo-900/20 border-indigo-500/30">
              <h3 className="text-indigo-400 text-sm font-medium uppercase">Upcoming</h3>
              <p className="text-3xl font-bold mt-2">{upcomingMeetingsData.length}</p>
            </Card>
            <Card className="p-6 bg-neutral-900 border-neutral-800">
              <h3 className="text-gray-400 text-sm font-medium uppercase">Meetings Hosted</h3>
              <p className="text-3xl font-bold mt-2">{totalMeetings}</p>
            </Card>
            <Card className="p-6 bg-neutral-900 border-neutral-800">
              <h3 className="text-gray-400 text-sm font-medium uppercase">Total Minutes</h3>
              {/* --- NEW: Display calculated minutes --- */}
              <p className="text-3xl font-bold mt-2">{totalMinutes}</p>
            </Card>
          </div>

          {/* Upcoming Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Upcoming Meetings
            </h2>
            <div className="space-y-3">
              {upcomingMeetingsData.length === 0 ? (
                <p className="text-zinc-500 italic">No upcoming meetings scheduled.</p>
              ) : (
                upcomingMeetingsData.map((meeting) => (
                  <div key={meeting.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-neutral-800 p-3 rounded-lg text-center min-w-[60px]">
                        <span className="block text-xs text-gray-400">{formatDate(meeting.startTime)}</span>
                        <span className="block font-bold text-indigo-400">{formatTime(meeting.startTime)}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{meeting.title}</h4>
                        <p className="text-sm text-gray-400">Code: {meeting.meetingCode}</p>
                      </div>
                    </div>
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Start</Button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* History Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Recent History</h2>
            <div className="rounded-xl border border-neutral-800 overflow-hidden">
               {recentHistoryData.length === 0 ? (
                 <div className="p-4 bg-neutral-900 text-zinc-500 italic">No completed meetings yet.</div>
               ) : (
                 recentHistoryData.map((item, i) => (
                  <div key={item.id} className={`p-4 flex items-center justify-between bg-neutral-900 ${i !== recentHistoryData.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <span className="text-xs text-gray-500">{formatDate(item.createdAt)}</span>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                ))
               )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}