import GlobalNavigation from "@/components/ui/global-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
// FIX 3 & 4: Added 'Video' and removed 'Plus'
import { Calendar, Clock, Users, MoreHorizontal, Lock, Video } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { CreateMeetingButton } from "@/components/CreateMeetingButton";
// FIX 1: Imported authOptions from auth, and db from our database file
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db"; 

export const dynamic = "force-dynamic";

type DashboardMeeting = {
  id: string;
  title: string;
  startTime?: Date | null;
  endTime?: Date | null;
  createdAt?: Date;
  meetingCode?: string;
  status?: string; 
};

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.email;

  let totalMeetings = 0;
  let upcomingMeetingsData: DashboardMeeting[] = [];
  let recentHistoryData: DashboardMeeting[] = [];
  let totalMinutes = 0;
  
  let userName = "Guest User";
  let userImage = null;
  let initials = "GU";

  if (isLoggedIn && session.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        meetings: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (user) {
      userName = user.name || "User";
      userImage = user.image;
      initials = userName.split(" ").map((n: string) => n[0]).join("").substring(0,2).toUpperCase();

      const meetings = user.meetings || [];
      totalMeetings = meetings.length;
      
      // FIX 2: Explicitly typed 'm' to resolve the implicit 'any' error
      upcomingMeetingsData = meetings.filter((m: { status: string }) => m.status === "WAITING").slice(0, 3) as DashboardMeeting[];
      recentHistoryData = meetings.filter((m: { status: string }) => m.status === "COMPLETED").slice(0, 5) as DashboardMeeting[];

      recentHistoryData.forEach(meeting => {
        if (meeting.startTime && meeting.endTime) {
          const diffMs = new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime();
          totalMinutes += Math.round(diffMs / 60000);
        }
      });
    }
  }

  const displayUpcoming = isLoggedIn ? upcomingMeetingsData : [];
  const displayHistory = isLoggedIn ? recentHistoryData : [];
  
  const formatDate = (date?: Date) => {
    if (!date) return "Unknown date";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white selection:bg-indigo-500/30 transition-colors duration-500 pb-20">
      <GlobalNavigation />

      <div className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-lg">
               {userImage ? (
                  <Image src={userImage} alt={userName} fill className="object-cover" />
               ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white">
                    {initials}
                  </div>
               )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName.split(" ")[0]}!</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Ready to host your next great meeting?</p>
            </div>
          </div>
          
          <div className="w-full md:w-auto">
             {isLoggedIn ? (
               <CreateMeetingButton />
             ) : (
                <Link href="/login" className="w-full">
                  <Button className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white justify-start text-lg px-6 w-full md:w-auto">
                    <Lock className="mr-3 w-5 h-5" /> Log in to Host
                  </Button>
                </Link>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="p-6 bg-white dark:bg-neutral-900/50 border-zinc-200 dark:border-white/5 backdrop-blur-sm transition-colors shadow-sm dark:shadow-none">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400"><Video className="w-6 h-6" /></div>
              <h3 className="font-semibold text-zinc-600 dark:text-zinc-400">Total Meetings</h3>
            </div>
            <p className="text-4xl font-bold">{totalMeetings}</p>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-neutral-900/50 border-zinc-200 dark:border-white/5 backdrop-blur-sm transition-colors shadow-sm dark:shadow-none">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-cyan-100 dark:bg-cyan-500/10 rounded-xl text-cyan-600 dark:text-cyan-400"><Clock className="w-6 h-6" /></div>
              <h3 className="font-semibold text-zinc-600 dark:text-zinc-400">Minutes Hosted</h3>
            </div>
            <p className="text-4xl font-bold">{totalMinutes}</p>
          </Card>

          <Card className="p-6 bg-white dark:bg-neutral-900/50 border-zinc-200 dark:border-white/5 backdrop-blur-sm transition-colors shadow-sm dark:shadow-none">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400"><Users className="w-6 h-6" /></div>
              <h3 className="font-semibold text-zinc-600 dark:text-zinc-400">Participants</h3>
            </div>
            <p className="text-4xl font-bold">--</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4">Upcoming Meetings</h2>
              <div className="grid gap-4">
                {displayUpcoming.length === 0 ? (
                   <div className="p-8 border border-dashed border-zinc-300 dark:border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center bg-white/50 dark:bg-neutral-900/20">
                     <Calendar className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-3" />
                     <h3 className="font-semibold mb-1">No upcoming meetings</h3>
                     <p className="text-sm text-zinc-500">Create a new meeting to get started.</p>
                   </div>
                ) : (
                  displayUpcoming.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between group hover:border-indigo-500/50 transition-colors shadow-sm dark:shadow-none">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:scale-110 transition-transform">
                          {new Date(item.createdAt!).getDate()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{item.title}</h4>
                          <p className="text-sm text-zinc-500">Code: <span className="font-mono">{item.meetingCode}</span></p>
                        </div>
                      </div>
                      <Link href={`/meeting/${item.meetingCode}`}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">Start</Button>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Recent History</h2>
              <div className="rounded-xl border border-zinc-200 dark:border-neutral-800 overflow-hidden shadow-sm dark:shadow-none">
                 {displayHistory.length === 0 ? (
                   <div className="p-4 bg-white dark:bg-neutral-900 text-zinc-500 italic border-b border-zinc-200 dark:border-neutral-800">No completed meetings yet.</div>
                 ) : (
                   displayHistory.map((item, i) => (
                    <div key={item.id} className={`p-4 flex items-center justify-between bg-white dark:bg-neutral-900 ${i !== displayHistory.length - 1 ? 'border-b border-zinc-200 dark:border-neutral-800' : ''}`}>
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4 text-zinc-500" />
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