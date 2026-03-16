// app/dashboard/page.tsx
"use client";

import { Navbar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Calendar, Clock, Plus, Video, 
  Users, Settings, MoreHorizontal 
} from "lucide-react";

export default function Dashboard() {
  const upcomingMeetings = [
    { id: 1, title: "Team Standup", time: "10:00 AM", date: "Today", participants: 4 },
    { id: 2, title: "Project Review", time: "2:00 PM", date: "Tomorrow", participants: 8 },
  ];

  const recentHistory = [
    { id: 101, title: "Client Call", date: "Yesterday", duration: "45 min" },
    { id: 102, title: "Design Sync", date: "2 days ago", duration: "1h 20m" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="container mx-auto pt-24 px-4 flex flex-col lg:flex-row gap-8">
        
        {/* --- LEFT SIDEBAR (Quick Actions) --- */}
        <div className="w-full lg:w-1/4 space-y-6">
          
          {/* User Profile Card */}
          <Card className="p-6 bg-neutral-900 border-neutral-800 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg">
              JD
            </div>
            <div>
              <h3 className="font-semibold">John Doe</h3>
              <p className="text-sm text-gray-400">Pro Member</p>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-4">
            <Button className="h-14 bg-indigo-600 hover:bg-indigo-700 justify-start text-lg px-6">
              <Plus className="mr-3 w-6 h-6" /> New Meeting
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
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-indigo-900/20 border-indigo-500/30">
              <h3 className="text-indigo-400 text-sm font-medium uppercase">Upcoming</h3>
              <p className="text-3xl font-bold mt-2">3</p>
            </Card>
            <Card className="p-6 bg-neutral-900 border-neutral-800">
              <h3 className="text-gray-400 text-sm font-medium uppercase">Meetings Hosted</h3>
              <p className="text-3xl font-bold mt-2">142</p>
            </Card>
            <Card className="p-6 bg-neutral-900 border-neutral-800">
              <h3 className="text-gray-400 text-sm font-medium uppercase">Total Minutes</h3>
              <p className="text-3xl font-bold mt-2">4,200</p>
            </Card>
          </div>

          {/* Upcoming Section */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" /> Upcoming Meetings
            </h2>
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-neutral-800 p-3 rounded-lg text-center min-w-[60px]">
                      <span className="block text-xs text-gray-400">{meeting.date}</span>
                      <span className="block font-bold text-indigo-400">{meeting.time}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{meeting.title}</h4>
                      <p className="text-sm text-gray-400">{meeting.participants} participants expected</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Start</Button>
                </div>
              ))}
            </div>
          </section>

          {/* History Section */}
          <section>
            <h2 className="text-xl font-bold mb-4">Recent History</h2>
            <div className="rounded-xl border border-neutral-800 overflow-hidden">
              {recentHistory.map((item, i) => (
                <div key={item.id} className={`p-4 flex items-center justify-between bg-neutral-900 ${i !== recentHistory.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <span className="text-xs text-gray-500">{item.date} • {item.duration}</span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}