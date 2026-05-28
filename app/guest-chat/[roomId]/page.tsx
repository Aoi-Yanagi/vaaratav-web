"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Timer, X, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import Lottie from "lottie-react";

// IMPORT OUR CUSTOM UI COMPONENTS & THE NEW LOTTIE DICTIONARY
import { FloatingControlBar, ReactionEngine, REACTION_MAP } from "@/components/LiveKitVideoRoom";

// FIX 1: Changed 'emoji' to 'reactionId'
type Reaction = { id: string; reactionId: string; name: string; startX: number; endX: number };

export default function GuestChat({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.roomId || "fallback-room-id";
  
  const [timeLeft, setTimeLeft] = useState(300);
  const [isClosing, setIsClosing] = useState(false);
  const [token, setToken] = useState("");
  
  // Mobile UI States
  const [showMobileControls, setShowMobileControls] = useState(true);
  const [reactions, setReactions] = useState<Reaction[]>([]);

  // Safe Lazy Initialization
  const [guestName] = useState(() => {
    const randomId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID().substring(0, 6) 
        : Date.now().toString(36).substring(4);
    return `Guest-${randomId}`;
  });

  const endSession = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { router.push('/'); }, 600);
  }, [router]);

  const handleReportAbuse = async () => {
    console.log(`Reported abuse in room: ${roomId}`);
    endSession();
  };

  // FIXED TIMER
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [endSession]); 

  // Mobile Tap-to-Hide Logic
  useEffect(() => {
    const handleScreenTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'video') return;
      if (target.closest('#custom-control-bar') || target.closest('#reaction-engine')) return;
      if (window.innerWidth < 640) {
        setShowMobileControls(prev => !prev);
      }
    };
    window.addEventListener('pointerup', handleScreenTap);
    return () => window.removeEventListener('pointerup', handleScreenTap);
  }, []);

  // Fetch LiveKit Token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${roomId}&username=${guestName}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error("Failed to fetch token", e);
      }
    };
    fetchToken();
  }, [roomId, guestName]);

  // FIX 2: Updated the callback to expect 'reactionId'
  const addReactionToScreen = useCallback((reactionData: {id: string, reactionId: string, name: string}) => {
    const startX = Math.floor(Math.random() * 60) - 30;
    const endX = startX + (Math.floor(Math.random() * 40) - 20);
    setReactions(prev => [...prev, { ...reactionData, startX, endX }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionData.id)), 3000);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading State
  if (token === "") {
      return (
          <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] bg-zinc-950 text-white">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-zinc-400 font-medium">Securing encrypted connection...</p>
          </div>
      );
  }

  // 1. LIVEKIT ROOT
  return (
    <LiveKitRoom 
        video={true} 
        audio={true} 
        connect={true} 
        token={token} 
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} 
        options={{ adaptiveStream: true, dynacast: true }} 
        onDisconnected={endSession}
        data-lk-theme="default"
        className="w-full h-[100dvh] overflow-hidden bg-zinc-950"
    >
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: isClosing ? 0 : 1 }} transition={{ duration: 0.6 }}
        className="flex flex-col items-center w-full h-full text-zinc-100 font-sans relative"
      >
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

        {/* Floating Reaction Bubbles */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-[90]">
            <AnimatePresence>
                {reactions.map((r) => (
                    <motion.div
                        key={r.id}
                        initial={{ scale: 0, y: 0, x: r.startX, rotate: -20, opacity: 0 }}
                        animate={{ scale: 1.5, y: -300, x: r.endX, rotate: [0, 15, -10, 10, 0], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 3, scale: { type: "spring", stiffness: 300, damping: 10 }, ease: "easeOut" }}
                        className="absolute bottom-10 flex flex-col items-center"
                    >
                        <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full mb-1 border border-white/10">{r.name}</div>
                        
                        {/* FIX 3: Replaced text emoji with proper Lottie component */}
                        <div className="w-24 h-24 drop-shadow-2xl">
                            <Lottie animationData={REACTION_MAP[r.reactionId]} loop={true} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Header */}
        <header className="flex items-center justify-between w-full max-w-5xl mt-6 px-4 z-20 shrink-0">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full shadow-lg">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium tracking-wide text-zinc-200 hidden sm:block">Secure Guest Session</span>
          </div>
          
          <div className={`flex items-center gap-2 text-lg font-semibold px-5 py-2.5 rounded-full border backdrop-blur-xl shadow-lg transition-colors ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-zinc-200'}`}>
            <Timer className={`w-5 h-5 ${timeLeft < 60 ? 'animate-pulse' : ''}`} />
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleReportAbuse} className="group px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-full">
                  <AlertTriangle className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:block">Report</span>
              </Button>
              <Button variant="ghost" onClick={endSession} className="group px-5 py-2.5 bg-white/5 hover:bg-zinc-800 border border-white/10 text-zinc-300 rounded-full">
                  <X className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:block">Leave</span>
              </Button>
          </div>
        </header>

        {/* 2. BULLETPROOF VIDEO CONTAINER */}
        <div className="flex-1 w-full max-w-7xl p-4 sm:p-6 z-10 min-h-0 flex flex-col pb-32 sm:pb-24">
          <div className="flex-1 w-full bg-zinc-900/50 backdrop-blur-sm rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative">
             <VideoConference className="w-full h-full" />
             <RoomAudioRenderer />
          </div>
        </div>

        {/* 3. THE LIBERATED CONTROLS */}
        <ReactionEngine onReaction={addReactionToScreen} visible={showMobileControls} />
        <FloatingControlBar visible={showMobileControls} />
                <FloatingControlBar visible={showMobileControls} isGuest={true} />
      </motion.div>
    </LiveKitRoom>
    
  );
}