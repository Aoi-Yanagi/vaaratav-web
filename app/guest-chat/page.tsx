"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Timer, X, Mic, MicOff, Video as VideoIcon, VideoOff, ShieldCheck, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/components/providers/SocketProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function GuestChat() {
  const router = useRouter();
  const { socket } = useSocket();
  
  const [timeLeft, setTimeLeft] = useState(300);
  const [isClosing, setIsClosing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  // --- CLEANUP & EXIT FUNCTION ---
  const endSession = () => {
    setIsClosing(true);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null; 
    }

    if (socket) {
        socket.emit("leave-room", "guest-lobby"); 
    }

    setTimeout(() => {
        router.push('/'); // Redirecting back to home for a smooth exit
    }, 600);
  };

  // 1. COUNTDOWN TIMER
  useEffect(() => {
    if (timeLeft <= 0) {
      endSession();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]); 

  // 2. GET MEDIA
  useEffect(() => {
    let isMounted = true; 

    const startMedia = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        if (!isMounted) {
          localStream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = localStream; 
        
        if (videoRef.current) {
            videoRef.current.srcObject = localStream;
        }
        
        if (socket) {
            socket.emit("join-room", "guest-lobby", "guest-user", "Anonymous Guest");
        }
      } catch (err) {
        console.error("Failed to get media", err);
      }
    };

    startMedia();

    return () => {
      isMounted = false; 
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [socket]); 

  // Toggle Helpers
  const toggleMic = () => {
    if (streamRef.current) {
        const track = streamRef.current.getAudioTracks()[0];
        track.enabled = !track.enabled;
        setIsMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        track.enabled = !track.enabled;
        setIsCamOn(track.enabled);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: isClosing ? 0 : 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center min-h-[100dvh] bg-zinc-950 text-zinc-100 font-sans relative overflow-hidden selection:bg-indigo-500/30"
    >
      {/* Premium Background Orbs (Matches your Landing Page) */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" /> {/* Optional: Add a subtle noise texture if you have one */}

      {/* Floating Header Pill */}
      <motion.header 
        initial={{ y: -40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.4 }}
        className="flex items-center justify-between w-full max-w-5xl mt-6 px-4 z-20"
      >
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full shadow-lg">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium tracking-wide text-zinc-200 hidden sm:block">Secure Guest Session</span>
        </div>
        
        <div className={`flex items-center gap-2 text-lg font-semibold px-5 py-2.5 rounded-full border backdrop-blur-xl shadow-lg transition-colors duration-500 ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-zinc-200'}`}>
          <Timer className={`w-5 h-5 ${timeLeft < 60 ? 'animate-pulse' : ''}`} />
          {formatTime(timeLeft)}
        </div>

        <Button 
            variant="ghost" 
            onClick={endSession} 
            className="group px-5 py-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-zinc-300 hover:text-red-400 rounded-full transition-all duration-300"
        >
          <X className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" /> 
          <span className="font-medium">Leave</span>
        </Button>
      </motion.header>

      {/* Main Video Container */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl p-4 sm:p-6 z-10">
        
        <motion.div 
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: isClosing ? 0.9 : 1 }}
          transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.3 }}
          className="relative w-full aspect-video bg-zinc-900/50 backdrop-blur-sm rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl group"
        >
            {/* The Video Stream */}
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover transition-opacity duration-700 ${!isCamOn ? 'opacity-0' : 'opacity-100'}`} 
            />
            
            {/* Camera Off State */}
            <AnimatePresence>
                {!isCamOn && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md"
                    >
                        <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 shadow-xl mb-4">
                            <VideoOff className="w-8 h-8 text-zinc-500" />
                        </div>
                        <span className="text-zinc-400 font-medium tracking-wide">Camera is turned off</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Control Dock (macOS Style) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 bg-zinc-950/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-500">
                <Button 
                    size="icon"
                    className={`w-12 h-12 rounded-xl transition-all duration-300 active:scale-90 ${isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
                    onClick={toggleMic}
                >
                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                <Button 
                    size="icon"
                    className={`w-12 h-12 rounded-xl transition-all duration-300 active:scale-90 ${isCamOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
                    onClick={toggleCam}
                >
                    {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
            </div>
        </motion.div>

        {/* Minimalist Connection Info Pill */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-6 flex items-center gap-6 px-6 py-3 bg-white/5 border border-white/5 backdrop-blur-md rounded-full text-xs font-medium text-zinc-400"
        >
            <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Socket: {socket?.id ? socket.id.substring(0, 8) + '...' : 'Connecting'}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/20" /> {/* Dot separator */}
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>E2E Encrypted</span>
            </div>
        </motion.div>

      </div>
    </motion.div>
  );
}