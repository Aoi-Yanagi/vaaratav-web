"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { Copy, ShieldCheck, Loader2 } from "lucide-react";
import { LiveKitVideoRoom } from "@/components/LiveKitVideoRoom";

// 1. Import NextAuth's useSession hook to get the real user
import { useSession } from "next-auth/react";

export default function MeetingLobby({ params }: { params: Promise<{ meetingCode: string }> }) {
  const unwrappedParams = use(params);
  const meetingCode = unwrappedParams.meetingCode;
  
  // 2. Fetch the current user's session securely
  const { data: session, status } = useSession();

  const [hasJoined, setHasJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");

  // Setup the shareable link securely on the client side
  useEffect(() => {
    setMeetingLink(`${window.location.origin}/meeting/${meetingCode}`);
  }, [meetingCode]);

  const copyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 3. Show a brief loading state while NextAuth checks the user's cookies
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // 4. Extract the real name, or default to "Guest" if they aren't logged in
  const userName = session?.user?.name || "Guest";

  // --- PHASE 2: THE ACTUAL MEETING ROOM ---
  if (hasJoined) {
    // 5. Pass the dynamic userName into the LiveKit room
    return <LiveKitVideoRoom roomCode={meetingCode} user={{ name: userName }} />;
  }

  // --- PHASE 1: THE LOBBY UI ---
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="max-w-md w-full bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
        
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Ready to join?</h1>
        <p className="text-zinc-400 mb-8">Share this link with others you want in the meeting.</p>

        <div className="flex items-center gap-2 p-2 bg-black/50 rounded-2xl border border-zinc-800 mb-6">
            <span className="flex-1 text-sm text-zinc-300 truncate text-left pl-3 select-all">
               {meetingLink || "Loading link..."}
            </span>
            <Button onClick={copyLink} className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-10 px-4 transition-all active:scale-95">
               {copied ? "Copied!" : <Copy className="w-4 h-4" />}
            </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-8 bg-white/5 py-2 px-4 rounded-full w-fit mx-auto border border-white/5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Code: <span className="text-white font-mono tracking-wider">{meetingCode}</span>
        </div>

        <Button 
            size="lg" 
            onClick={() => setHasJoined(true)} 
            className="w-full bg-white text-black hover:bg-zinc-200 text-lg font-bold h-14 rounded-xl transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
            Join Meeting Now
        </Button>
      </div>
    </div>
  );
}