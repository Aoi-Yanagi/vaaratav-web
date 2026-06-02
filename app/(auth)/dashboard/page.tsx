import GlobalNavigation from "@/components/ui/global-navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Users, Lock, Video, Star, History } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { CreateMeetingButton } from "@/components/CreateMeetingButton";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db"; 
import { MeetingActionMenu } from "@/components/MeetingActionMenu"; 
import { Input } from "@/components/ui/input";
export const dynamic = "force-dynamic";

// FIX: Define a strict type so we don't use 'any'
type DashboardMeeting = {
  id: string;
  title: string;
  startTime?: Date | null;
  endTime?: Date | null;
  createdAt: Date;
  meetingCode: string;
  status: string; 
  isFavorite?: boolean; // Optional to prevent schema lag errors
};

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.email;

  let totalMeetings = 0;
  let upcomingMeetingsData: DashboardMeeting[] = [];
  let recentHistoryData: DashboardMeeting[] = [];
  let favoriteMeetingsData: DashboardMeeting[] = [];
  let totalMinutes = 0;
  
  let userName = "Guest";
  let userImage = null;
  let initials = "GU";

  if (isLoggedIn && session.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { meetings: { orderBy: { createdAt: 'desc' } } }
    });

    if (user) {
      userName = user.name || "User";
      userImage = user.image;
      initials = userName.split(" ").map((n: string) => n[0]).join("").substring(0,2).toUpperCase();

      const meetings = (user.meetings as DashboardMeeting[]) || [];
      totalMeetings = meetings.length;
      
      const thresholdTime = new Date();
      thresholdTime.setHours(thresholdTime.getHours() - 12);
      
      // 1. Favorites
      favoriteMeetingsData = meetings.filter((m) => m.isFavorite);

      // 2. Upcoming (Waiting, newer than 12 hours, not favorite)
      upcomingMeetingsData = meetings.filter((m) => {
        const meetingDate = m.startTime ? new Date(m.startTime) : new Date(m.createdAt);
        return m.status === "WAITING" && meetingDate > thresholdTime && !m.isFavorite;
      }).slice(0, 3);

      // 3. History (Completed OR Waiting > 12 hours, not favorite)
      recentHistoryData = meetings.filter((m) => {
        const meetingDate = m.startTime ? new Date(m.startTime) : new Date(m.createdAt);
        return (m.status === "COMPLETED" || (m.status === "WAITING" && meetingDate <= thresholdTime)) && !m.isFavorite;
      }).slice(0, 8);

      recentHistoryData.forEach((meeting) => {
        if (meeting.status === "COMPLETED" && meeting.startTime && meeting.endTime) {
          const diffMs = new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime();
          totalMinutes += Math.round(diffMs / 60000);
        }
      });
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return "Unknown date";
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(date));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white transition-colors duration-500 pb-20">
      <GlobalNavigation />

      <div className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-lg">
               {userImage ? <Image src={userImage} alt={userName} fill className="object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-2xl font-bold text-white">{initials}</div>}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName.split(" ")[0]}!</h1>
              <p className="text-zinc-500 mt-1">Ready to host your next great meeting?</p>
            </div>
          </div>
          <div className="w-full md:w-auto">
             {isLoggedIn ? <CreateMeetingButton /> : <Link href="/login" className="w-full"><Button className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto"><Lock className="mr-3 w-5 h-5" /> Log in to Host</Button></Link>}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="p-6 bg-white dark:bg-neutral-900/50 border-zinc-200 dark:border-white/5 shadow-sm"><div className="flex items-center gap-4 mb-4"><div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400"><Video className="w-6 h-6" /></div><h3 className="font-semibold text-zinc-600 dark:text-zinc-400">Total Meetings</h3></div><p className="text-4xl font-bold">{totalMeetings}</p></Card>
          <Card className="p-6 bg-white dark:bg-neutral-900/50 border-zinc-200 dark:border-white/5 shadow-sm"><div className="flex items-center gap-4 mb-4"><div className="p-3 bg-cyan-100 dark:bg-cyan-500/10 rounded-xl text-cyan-600 dark:text-cyan-400"><Clock className="w-6 h-6" /></div><h3 className="font-semibold text-zinc-600 dark:text-zinc-400">Minutes Hosted</h3></div><p className="text-4xl font-bold">{totalMinutes}</p></Card>
          <Card className="p-6 bg-white dark:bg-neutral-900/50 border-zinc-200 dark:border-white/5 shadow-sm"><div className="flex items-center gap-4 mb-4"><div className="p-3 bg-purple-100 dark:bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400"><Users className="w-6 h-6" /></div><h3 className="font-semibold text-zinc-600 dark:text-zinc-400">Participants</h3></div><p className="text-4xl font-bold">--</p></Card>
        </div>

        {/* SIDE-BY-SIDE SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT SIDE: CREATED MEETINGS */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3 mb-6">
               <Video className="w-6 h-6 text-indigo-500" />
               <h2 className="text-2xl font-bold">Created Meetings</h2>
            </div>
            
            {/* Favorites Section */}
            {favoriteMeetingsData.length > 0 && (
                <section id="favorites">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-500"><Star className="w-4 h-4 fill-amber-500" /> Starred</h3>
                <div className="grid gap-3">
                    {favoriteMeetingsData.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/5 flex items-center justify-between group">
                        <div className="flex-1">
                            <h4 className="font-semibold text-lg">{item.title}</h4>
                            <p className="text-sm text-zinc-500">Code: <span className="font-mono">{item.meetingCode}</span> • {formatDate(item.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/meeting/${item.meetingCode}`}><Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">Join</Button></Link>
                            <MeetingActionMenu meeting={{ meetingCode: item.meetingCode, title: item.title, isFavorite: item.isFavorite || false }} />
                        </div>
                    </div>
                    ))}
                </div>
                </section>
            )}

            <section id="upcoming">
              <h3 className="text-lg font-bold mb-4 text-zinc-700 dark:text-zinc-300">Upcoming</h3>
              <div className="grid gap-3">
                {upcomingMeetingsData.length === 0 ? (
                   <div className="p-8 border border-dashed border-zinc-300 dark:border-neutral-800 rounded-2xl flex flex-col items-center text-center bg-white/50 dark:bg-neutral-900/20"><Calendar className="w-10 h-10 text-zinc-400 mb-3" /><h3 className="font-semibold mb-1">No upcoming meetings</h3></div>
                ) : (
                  upcomingMeetingsData.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-zinc-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                      <div className="flex-1">
                          <h4 className="font-semibold text-lg">{item.title}</h4>
                          <p className="text-sm text-zinc-500">Code: <span className="font-mono">{item.meetingCode}</span> • {formatDate(item.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/meeting/${item.meetingCode}`}><Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">Start</Button></Link>
                        <MeetingActionMenu meeting={{ meetingCode: item.meetingCode, title: item.title, isFavorite: item.isFavorite || false }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

           <section id="history">
              <h3 className="text-lg font-bold mb-4 text-zinc-700 dark:text-zinc-300">Recent History</h3>
              <div className="rounded-xl border border-zinc-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                 {recentHistoryData.length === 0 ? (
                   <div className="p-4 bg-white dark:bg-neutral-900 text-zinc-500 italic text-center">No completed meetings yet.</div>
                 ) : (
                   recentHistoryData.map((item, i) => (
                    <div key={item.id} className={`p-4 flex items-center justify-between bg-white dark:bg-neutral-900 hover:bg-zinc-50 dark:hover:bg-neutral-800/50 transition-colors ${i !== recentHistoryData.length - 1 ? 'border-b border-zinc-200 dark:border-neutral-800' : ''}`}>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">{item.title} {item.status === "WAITING" && <span className="text-[10px] bg-amber-100 dark:bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full font-bold">Unfinished</span>}</h4>
                        <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
                      </div>
                      <MeetingActionMenu meeting={{ meetingCode: item.meetingCode, title: item.title, isFavorite: item.isFavorite || false }} />
                    </div>
                  ))
                 )}
              </div>
            </section>
          </div>

          {/* RIGHT SIDE: JOINED MEETINGS */}
          <div className="space-y-8">
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/10 pb-3 mb-6">
               <History className="w-6 h-6 text-emerald-500" />
               <h2 className="text-2xl font-bold">Joined Meetings</h2>
            </div>
            
            {/* Placeholder for Joined Meetings until backend logic is connected */}
            <div className="rounded-2xl border border-zinc-200 dark:border-neutral-800 overflow-hidden shadow-sm bg-white dark:bg-neutral-900 p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                    <History className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="font-semibold text-lg mb-1">No joined history</h3>
                <p className="text-zinc-500 text-sm">You haven't joined any external meetings recently.</p>
                <div className="mt-6 flex w-full max-w-sm items-center space-x-2">
                  <Input type="text" placeholder="Enter meeting code" className="bg-zinc-50 dark:bg-neutral-950" />
                  <Button type="button" className="bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200">Join</Button>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}