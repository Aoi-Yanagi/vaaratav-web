import GlobalNavigation from "@/components/ui/global-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Plus, Users, MoreHorizontal, Lock } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { CreateMeetingButton } from "@/components/CreateMeetingButton";
import { authOptions, prisma } from "@/lib/auth";

export const dynamic = "force-dynamic";

type DashboardMeeting = {
  id: string;
  title: string;
  startTime?: Date;
  endTime?: Date | null;
  createdAt?: Date;
  meetingCode?: string;
};

export default async function Dashboard() {
  
  // 1. Check session safely
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.email;

  // Set up default/fallback variables
  let totalMeetings = 0;
  let upcomingMeetingsData: DashboardMeeting[] = [];
  let recentHistoryData: DashboardMeeting[] = [];
  let totalMinutes = 0;
  
  let userName = "Guest User";
  let userImage = null;
  let initials = "GU";

  // 2. Only fetch from PostgreSQL if the user is logged in
  if (isLoggedIn && session.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user) {
      [totalMeetings, upcomingMeetingsData, recentHistoryData] = await Promise.all([
        prisma.meeting.count({ where: { hostId: user.id } }),
        prisma.meeting.findMany({
          where: { hostId: user.id, status: "WAITING" },
          orderBy: { startTime: 'asc' },
          take: 5,
        }),
        prisma.meeting.findMany({
          where: { hostId: user.id, status: "COMPLETED" },
          orderBy: { createdAt: 'desc' },
          take: 5,
        })
      ]);

      totalMinutes = recentHistoryData.reduce((acc, meeting) => {
        if (meeting.startTime && meeting.endTime) {
          const diffInMilliseconds = meeting.endTime.getTime() - meeting.startTime.getTime();
          return acc + Math.round(diffInMilliseconds / 60000);
        }
        return acc;
      }, 0);
    }
    
    userName = session.user.name || "User";
    userImage = session.user.image;
    initials = userName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  }

  // 3. Provide dummy data for guests so the blurred background looks populated
  const displayUpcoming: DashboardMeeting[] = isLoggedIn ? upcomingMeetingsData : [
    { 
      id: 'dummy-1', 
      title: 'Team Standup', 
      startTime: new Date("2024-12-01T10:00:00Z"), 
      meetingCode: 'vrtv-xxxx-xxxx' 
    },
    { 
      id: 'dummy-2', 
      title: 'Project Review', 
      startTime: new Date("2024-12-02T14:00:00Z"), 
      meetingCode: 'vrtv-yyyy-yyyy' 
    },
  ];
  
  const displayHistory: DashboardMeeting[] = isLoggedIn ? recentHistoryData : [
    { 
      id: 'dummy-3', 
      title: 'Client Call', 
      createdAt: new Date("2024-11-28T15:30:00Z") 
    },
    { 
      id: 'dummy-4', 
      title: 'Design Sync', 
      createdAt: new Date("2024-11-25T09:15:00Z") 
    },
  ];

  const formatDate = (date?: Date | null) => {
    if (!date) return "TBD";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };
  
  const formatTime = (date?: Date | null) => {
    if (!date) return "--:--";
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <GlobalNavigation />

      <div className="container mx-auto pt-24 px-4 flex flex-col lg:flex-row gap-8">
        
        {/* --- LEFT SIDEBAR --- */}
        <div className="w-full lg:w-1/4 space-y-6 z-10">
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
              <p className="text-sm text-gray-400">{isLoggedIn ? "Pro Member" : "Not Logged In"}</p>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {isLoggedIn ? (
              <CreateMeetingButton />
            ) : (
              <Button disabled className="h-14 bg-indigo-600/50 justify-start text-lg px-6 w-full opacity-50">
                <Plus className="mr-3 w-6 h-6" /> New Meeting
              </Button>
            )}
            <Button variant="outline" className="h-14 border-neutral-800 bg-neutral-900 justify-start text-lg px-6 hover:bg-neutral-800">
              <Calendar className="mr-3 w-6 h-6 text-indigo-400" /> Schedule
            </Button>
            <Button variant="outline" className="h-14 border-neutral-800 bg-neutral-900 justify-start text-lg px-6 hover:bg-neutral-800">
              <Users className="mr-3 w-6 h-6 text-green-400" /> Contacts
            </Button>
          </div>
        </div>

        {/* --- MAIN CONTENT WITH CONDITIONAL BLUR OVERLAY --- */}
        <div className="flex-1 relative">
          
          {/* THE LOCK OVERLAY (Only shows if user is a guest) */}
          {!isLoggedIn && (
            <div className="absolute inset-0 z-50 flex items-center justify-center mt-[-4rem]">
              <div className="bg-neutral-900/95 border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-sm backdrop-blur-xl">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 border border-indigo-500/30">
                  <Lock className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Analytics Locked</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Login or Get Started to see the Analytics, track your minutes, and manage your meetings.
                </p>
                <div className="flex gap-3 w-full">
                  <Link href="/login" className="flex-1">
                    <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-xl">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup" className="flex-1">
                    <Button variant="outline" className="w-full h-12 border-neutral-700 hover:bg-neutral-800 font-semibold rounded-xl">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* THE ANALYTICS CONTENT (Blurs out if the user is a guest) */}
          <div className={`space-y-8 transition-all duration-500 ${!isLoggedIn ? 'filter blur-[8px] pointer-events-none opacity-40 select-none' : ''}`}>
            
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 bg-indigo-900/20 border-indigo-500/30">
                <h3 className="text-indigo-400 text-sm font-medium uppercase">Upcoming</h3>
                <p className="text-3xl font-bold mt-2">{isLoggedIn ? displayUpcoming.length : '3'}</p>
              </Card>
              <Card className="p-6 bg-neutral-900 border-neutral-800">
                <h3 className="text-gray-400 text-sm font-medium uppercase">Meetings Hosted</h3>
                <p className="text-3xl font-bold mt-2">{isLoggedIn ? totalMeetings : '142'}</p>
              </Card>
              <Card className="p-6 bg-neutral-900 border-neutral-800">
                <h3 className="text-gray-400 text-sm font-medium uppercase">Total Minutes</h3>
                <p className="text-3xl font-bold mt-2">{isLoggedIn ? totalMinutes : '4,200'}</p>
              </Card>
            </div>

            {/* Upcoming Section */}
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-500" /> Upcoming Meetings
              </h2>
              <div className="space-y-3">
                {displayUpcoming.length === 0 ? (
                  <p className="text-zinc-500 italic">No upcoming meetings scheduled.</p>
                ) : (
                  displayUpcoming.map((meeting) => (
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
                 {displayHistory.length === 0 ? (
                   <div className="p-4 bg-neutral-900 text-zinc-500 italic">No completed meetings yet.</div>
                 ) : (
                   displayHistory.map((item, i) => (
                    <div key={item.id} className={`p-4 flex items-center justify-between bg-neutral-900 ${i !== displayHistory.length - 1 ? 'border-b border-neutral-800' : ''}`}>
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
    </div>
  );
}