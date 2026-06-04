"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Timer, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { LiveKitRoom, GridLayout, ParticipantTile, RoomAudioRenderer, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

import { FloatingControlBar, ReactionEngine, REACTION_MAP } from "@/components/meeting/RoomModules";

// --- TYPES ---
type Reaction = { id: string; reactionId: string; name: string; startX: number; endX: number };

// FIX 2: Strict typing for the UI component to eliminate the 'any' error
interface GuestRoomUIProps {
  roomId: string;
  timeLeft: number;
  isClosing: boolean;
  formatTime: (seconds: number) => string;
  endSession: () => void;
  reactions: Reaction[];
  showMobileControls: boolean;
  setShowMobileControls: React.Dispatch<React.SetStateAction<boolean>>;
  addReactionToScreen: (reactionData: { id: string; reactionId: string; name: string }) => void;
}

// --- MAIN WRAPPER COMPONENT ---
export default function GuestChat({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.roomId || "fallback-room-id";
  
  const [timeLeft, setTimeLeft] = useState(300);
  const [isClosing, setIsClosing] = useState(false);
  const [token, setToken] = useState("");
  
  const [showMobileControls, setShowMobileControls] = useState(true);
  const [reactions, setReactions] = useState<Reaction[]>([]);

  // FIX 1: We use a ref to track if the session has ended, bypassing the render cycle loop
  const hasEndedRef = useRef(false);

  const [guestName] = useState(() => {
    const randomId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID().substring(0, 4) 
      : Math.floor(Math.random() * 10000).toString();
    return `Guest-${randomId}`;
  });

  // Action: Safely end the session
  const endSession = useCallback(async () => {
    if (hasEndedRef.current) return; 
    hasEndedRef.current = true;
    
    setIsClosing(true);
    try {
      await fetch('/api/end', { method: 'POST', body: JSON.stringify({ roomId }) });
    } catch (e) {
      console.error("Failed to end session gracefully");
    }
    setTimeout(() => router.push('/meeting-ended'), 1000);
  }, [router, roomId]);

  // The Timer Effect
  useEffect(() => {
    // If the timer hits zero, trigger the endSession outside the main render flow
    if (timeLeft <= 0) {
      if (!hasEndedRef.current) {
        // We use setTimeout to push the state change to the next event loop, satisfying React's strict mode
        setTimeout(endSession, 0); 
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, endSession]);

  // Init Connection
  useEffect(() => {
    const initRoom = async () => {
      try {
        const response = await fetch(`/api/livekit?room=${roomId}&username=${guestName}`);
        const data = await response.json();
        if (data.token) {
           setToken(data.token);
        } else {
           console.error("Failed to get token:", data.error);
           alert("Could not connect to the room.");
        }
      } catch (e) {
        console.error("Network error:", e);
      }
    };
    initRoom();
  }, [roomId, guestName]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addReactionToScreen = useCallback((reactionData: {id: string, reactionId: string, name: string}) => {
    const startX = Math.floor(Math.random() * 60) - 30;
    const endX = startX + (Math.floor(Math.random() * 40) - 20);
    setReactions(prev => [...prev, { ...reactionData, startX, endX }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionData.id)), 3000);
  }, []);

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-500 font-medium">Preparing your instant secure connection...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      className="flex flex-col min-h-[100dvh] w-full bg-zinc-50 dark:bg-black transition-colors overflow-hidden relative"
      onDisconnected={() => router.push('/meeting-ended')}
    >
      <GuestRoomUI 
          roomId={roomId} 
          timeLeft={timeLeft} 
          isClosing={isClosing} 
          formatTime={formatTime} 
          endSession={endSession} 
          reactions={reactions} 
          showMobileControls={showMobileControls} 
          setShowMobileControls={setShowMobileControls} 
          addReactionToScreen={addReactionToScreen} 
      />
    </LiveKitRoom>
  );
}

// --- INTERNAL UI COMPONENT ---
function GuestRoomUI({ 
  roomId, 
  timeLeft, 
  isClosing, 
  formatTime, 
  endSession, 
  reactions, 
  showMobileControls, 
  setShowMobileControls, 
  addReactionToScreen 
}: GuestRoomUIProps) {
  
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  useEffect(() => {
    const handleScreenTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'video') return;
      if (target.closest('#custom-control-bar') || target.closest('#reaction-engine')) return;
      if (window.innerWidth < 640) {
        setShowMobileControls((prev: boolean) => !prev);
      }
    };
    window.addEventListener('pointerup', handleScreenTap);
    return () => window.removeEventListener('pointerup', handleScreenTap);
  }, [setShowMobileControls]);

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="flex-1 flex flex-col w-full h-full"
        >
          {/* HEADER */}
          <header className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-50 flex items-center justify-between px-6 sm:px-8">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-white font-bold tracking-tight drop-shadow-md">VaartaV <span className="font-light text-white/70">Instant</span></span>
               </div>
               <div className="h-6 w-px bg-white/20 hidden sm:block" />
               <div className="hidden sm:flex items-center gap-2 text-white/70 text-sm bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                  <span className="font-mono">{roomId}</span>
               </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md font-mono font-bold tracking-wider transition-colors",
                    timeLeft < 60 ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" : "bg-white/10 text-white border-white/10"
                )}>
                    <Timer className={cn("w-4 h-4", timeLeft < 60 ? "text-red-400" : "text-white/70")} />
                    {formatTime(timeLeft)}
                </div>

                <Button variant="ghost" className="group px-4 py-2 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 text-zinc-300 hover:text-red-400 rounded-full transition-all">
                    <AlertTriangle className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:block">Report</span>
                </Button>
                <Button variant="destructive" onClick={endSession} className="group px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-lg shadow-red-900/20">
                    <X className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:block">Leave</span>
                </Button>
            </div>
          </header>

          {/* FLOATING LOTTIE BUBBLES */}
           <div className="fixed bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-[90]">
              <AnimatePresence>
                  {reactions.map((r: Reaction) => (
                      <motion.div
                          key={r.id}
                          initial={{ scale: 0, y: 0, x: r.startX, rotate: -20, opacity: 0 }}
                          animate={{ scale: 1.5, y: -300, x: r.endX, rotate: [0, 15, -10, 10, 0], opacity: [0, 1, 1, 0] }}
                          transition={{ duration: 3, scale: { type: "spring", stiffness: 300, damping: 10 }, ease: "easeOut" }}
                          className="absolute bottom-10 flex flex-col items-center"
                      >
                          <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm text-zinc-900 dark:text-white text-[10px] px-2 py-0.5 rounded-full mb-1 shadow-lg border border-zinc-200 dark:border-white/10 whitespace-nowrap">
                              {r.name}
                          </div>
                          <div className="w-24 h-24 drop-shadow-2xl">
                              {/* FIX 3: Safely cast the Lottie key lookup */}
                              <Lottie animationData={REACTION_MAP[r.reactionId as keyof typeof REACTION_MAP]} loop={true} />
                          </div>
                      </motion.div>
                  ))}
              </AnimatePresence>
          </div>

          {/* ABSOLUTE DOM BOXING FOR VIDEO GRID */}
          <div className="absolute inset-x-0 top-20 bottom-0 sm:inset-x-6 sm:top-24 sm:bottom-6 z-10 flex flex-col">
            <div className="flex-1 w-full relative bg-zinc-900 rounded-none sm:rounded-[2rem] overflow-hidden shadow-2xl transition-all border-0 sm:border border-white/10">
               <div className="absolute inset-0 flex flex-col bg-black">
                  <GridLayout tracks={tracks} style={{ width: '100%', height: '100%' }}>
                    <ParticipantTile />
                  </GridLayout>
                  <RoomAudioRenderer />
               </div>
            </div>
          </div>

          {/* CONTROLS */}
          <ReactionEngine onReaction={addReactionToScreen} visible={showMobileControls} />
          
          <FloatingControlBar 
              visible={showMobileControls} 
              isGuest={true} 
              onLeave={endSession} 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}