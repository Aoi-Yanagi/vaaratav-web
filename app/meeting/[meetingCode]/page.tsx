"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Copy, Video, ShieldCheck, Crown, User, Loader2 } from "lucide-react";
import { ActualVideoRoom } from "@/components/ActualVideoRoom"; // <-- Make sure this is imported!

export default function MeetingLobby({ params }: { params: Promise<{ meetingCode: string }> }) {
  const unwrappedParams = use(params);
  const meetingCode = unwrappedParams.meetingCode;
  
  const { data: session, status: sessionStatus } = useSession();
  
  const [hasJoined, setHasJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [meetingLink, setMeetingLink] = useState(""); // <-- FIX: State for the URL
  
  const [role, setRole] = useState<"HOST" | "PARTICIPANT" | "GUEST" | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [meetingError, setMeetingError] = useState("");

  // FIX: Safely grab the URL only after the component mounts on the client
  useEffect(() => {
    setMeetingLink(`${window.location.origin}/meeting/${meetingCode}`);
  }, [meetingCode]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    const fetchMeetingDetails = async () => {
      try {
        const res = await fetch(`/api/meetings/${meetingCode}`);
        const data = await res.json();

        if (!res.ok) {
          setMeetingError(data.error || "Meeting not found");
          setIsLoadingRole(false);
          return;
        }

        setRole(data.role);
        setIsLoadingRole(false);
      } catch (err) {
        setMeetingError("Failed to connect to server");
        setIsLoadingRole(false);
      }
    };

    fetchMeetingDetails();
  }, [meetingCode, sessionStatus]);

  const copyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- PHASE 2: THE ACTUAL MEETING ROOM ---
  if (hasJoined) {
    return (
      <div className="h-[100dvh] w-full bg-black">
         <ActualVideoRoom roomCode={meetingCode} role={role} user={session?.user} />
      </div>
    );
  }

  // --- PHASE 1: THE PRE-JOIN LOBBY ---
  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center z-10 relative">
        
        {!isLoadingRole && !meetingError && (
          <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg">
            {role === "HOST" && (
              <span className="flex items-center gap-1 text-amber-400 border-amber-400/20 bg-amber-400/10 rounded-full px-2 py-1">
                <Crown className="w-3.5 h-3.5" /> Host
              </span>
            )}
            {role === "PARTICIPANT" && (
              <span className="flex items-center gap-1 text-indigo-400 border-indigo-400/20 bg-indigo-400/10 rounded-full px-2 py-1">
                <User className="w-3.5 h-3.5" /> Participant
              </span>
            )}
            {role === "GUEST" && (
              <span className="flex items-center gap-1 text-zinc-400 border-zinc-400/20 bg-zinc-400/10 rounded-full px-2 py-1">
                <User className="w-3.5 h-3.5" /> Guest
              </span>
            )}
          </div>
        )}

        <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Video className="w-10 h-10" />
        </div>
        
        {meetingError ? (
          <>
             <h1 className="text-3xl font-bold mb-2 tracking-tight text-red-500">Invalid Meeting</h1>
             <p className="text-zinc-400 mb-8">{meetingError}</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Meeting Ready</h1>
            <p className="text-zinc-400 mb-8">Share this link with others to invite them.</p>

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
              disabled={isLoadingRole}
              className="w-full bg-white text-black hover:bg-zinc-200 text-lg font-bold h-14 rounded-xl transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingRole ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Meeting Now"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}