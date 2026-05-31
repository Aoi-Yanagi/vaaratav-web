"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, ShieldCheck, Loader2, Calendar, Clock, Edit3, X } from "lucide-react";
import { LiveKitVideoRoom } from "@/components/LiveKitVideoRoom";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = "force-dynamic";

export default function MeetingLobby({ params }: { params: Promise<{ meetingCode: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const meetingCode = unwrappedParams.meetingCode;
  
  const { status } = useSession();

  const [hasJoined, setHasJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [token, setToken] = useState("");
  const [isHost, setIsHost] = useState(false); 
  const [isJoining, setIsJoining] = useState(false);
  
  const meetingLink = typeof window !== "undefined" ? `${window.location.origin}/meeting/${meetingCode}` : "";
  
  const [title, setTitle] = useState("VaartaV Sync");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleData, setScheduleData] = useState({ date: "", time: "" });

  const copyLink = () => {
    if (!meetingLink) return;
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async () => {
    try {
      await fetch('/api/meetings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingCode, action: 'DELETE' })
      });
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      router.push('/dashboard');
    }
  };

  const handleRename = async () => {
    try {
      await fetch('/api/meetings/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingCode, action: 'RENAME', payload: { title } })
      });
      setIsRenaming(false);
    } catch (e) { console.error(e); }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/meetings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingCode, title, ...scheduleData })
      });
      setIsScheduling(false);
      alert("Meeting scheduled successfully!");
    } catch (error) { console.error(error); } 
    finally { setIsSubmitting(false); }
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const response = await fetch(`/api/livekit?room=${meetingCode}`);
      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to join room.");
        setIsJoining(false);
        return;
      }

      setToken(data.token);
      setIsHost(data.isHost || false); 
      setHasJoined(true);
    } catch (error) {
      console.error(error);
      alert("A network error occurred while connecting.");
      setIsJoining(false);
    }
  };

  if (status === "loading") return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  // THE MAGIC FIX IS HERE: Notice `isHost={isHost}` is now attached!
  if (hasJoined && token) {
    return <LiveKitVideoRoom roomCode={meetingCode} token={token} isHost={isHost} />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white flex flex-col items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900/50 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-3xl p-8 shadow-2xl text-center relative">
        <button onClick={handleCancel} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-500/10"><X className="w-5 h-5" /></button>

        {isRenaming ? (
            <div className="flex items-center gap-2 mb-2 justify-center">
                <input autoFocus className="bg-zinc-100 dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-lg px-3 py-1 text-xl font-bold text-center outline-none focus:border-indigo-500 w-3/4" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Button size="sm" onClick={handleRename} className="bg-indigo-600 h-9">Save</Button>
            </div>
        ) : (
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight group flex items-center justify-center gap-2 cursor-pointer" onClick={() => setIsRenaming(true)}>
                {title} <Edit3 className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
        )}
        
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">Share this link or schedule it for later.</p>

        <div className="flex items-center gap-2 p-2 bg-zinc-100 dark:bg-black/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-6">
            <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-300 truncate text-left pl-3 select-all">{meetingLink || "Loading..."}</span>
            <Button onClick={copyLink} className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 px-4 transition-all">
               {copied ? "Copied!" : <Copy className="w-4 h-4" />}
            </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-8 bg-zinc-100 dark:bg-white/5 py-2 px-4 rounded-full w-fit mx-auto border border-zinc-200 dark:border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Code: <span className="text-zinc-900 dark:text-white font-mono tracking-wider">{meetingCode}</span>
        </div>

        <div className="flex flex-col gap-3">
            <Button size="lg" onClick={handleJoin} disabled={isJoining} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-lg font-bold h-14 rounded-xl transition-transform hover:scale-[1.02] shadow-lg disabled:opacity-50">
                {isJoining ? <Loader2 className="w-6 h-6 animate-spin" /> : "Join Meeting Now"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => setIsScheduling(true)} className="w-full border-zinc-200 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-white/5 h-14 rounded-xl">
                <Calendar className="w-5 h-5 mr-2" /> Schedule for Later
            </Button>
        </div>

        <AnimatePresence>
            {isScheduling && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-white/10 p-6 rounded-3xl w-full max-w-sm text-left shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Schedule Meeting</h2>
                        <form onSubmit={handleScheduleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-zinc-500 block mb-1"><Calendar className="w-4 h-4 inline mr-1"/> Date</label>
                                    <input type="date" required className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500" value={scheduleData.date} onChange={(e) => setScheduleData({...scheduleData, date: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-sm text-zinc-500 block mb-1"><Clock className="w-4 h-4 inline mr-1"/> Time</label>
                                    <input type="time" required className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500" value={scheduleData.time} onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="ghost" className="flex-1 hover:bg-zinc-100 dark:hover:bg-white/5" onClick={() => setIsScheduling(false)}>Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Confirm"}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}