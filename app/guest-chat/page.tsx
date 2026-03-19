"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Timer, XCircle, Mic, MicOff, Video as VideoIcon, VideoOff, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/components/providers/SocketProvider";
import { motion } from "framer-motion";

export default function GuestChat() {
  const router = useRouter();
  const { socket } = useSocket();
  
  const [timeLeft, setTimeLeft] = useState(300);
  const [isClosing, setIsClosing] = useState(false); // Controls the exit animation
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  // --- CLEANUP & EXIT FUNCTION ---
  const endSession = () => {
    setIsClosing(true); // Trigger the fade-out animation
    
    // Stop all media tracks immediately so the camera light turns off
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null; 
    }

    if (socket) {
        socket.emit("leave-room", "guest-lobby"); 
    }

    // Wait for the animation to finish (600ms) before changing the page
    setTimeout(() => {
        router.push('/meeting-ended'); // Update this route to wherever you want them to go
    }, 600);
  };

  // 1. COUNTDOWN TIMER LOGIC
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
    // Replaced h-screen with h-[100dvh] for perfect mobile Safari rendering
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: isClosing ? 0 : 1, scale: isClosing ? 0.95 : 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="flex flex-col h-[100dvh] bg-black text-green-500 font-mono relative overflow-hidden selection:bg-green-500/30"
    >
      
      {/* Sleeker Background Matrix Effect */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[url('https://upload.wikimedia.org/wikipedia/commons/1/17/Matrix_digital_rain_screensaver.png')] bg-cover mix-blend-screen" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

      {/* Floating Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="flex items-center justify-between m-4 p-4 rounded-2xl border border-green-900/50 bg-black/60 backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.1)] z-10"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
             <ShieldAlert className="w-5 h-5 animate-pulse text-red-500" />
          </div>
          <span className="font-bold tracking-widest uppercase text-white hidden sm:block">Incognito</span>
        </div>
        
        <div className={`flex items-center gap-2 text-2xl font-bold bg-black/50 px-4 py-2 rounded-xl border ${timeLeft < 60 ? 'text-red-500 border-red-500/30 animate-pulse' : 'text-green-500 border-green-500/30'}`}>
          <Timer className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>

        <Button 
            variant="destructive" 
            onClick={endSession} 
            className="hover:bg-red-600 bg-red-500/20 text-red-500 border border-red-500/50 z-50 rounded-xl transition-all hover:scale-105 active:scale-95 font-bold tracking-wide"
        >
          <XCircle className="w-4 h-4 mr-2" /> End
        </Button>
      </motion.header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 gap-8 z-10 overflow-y-auto">
        
        {/* The Video Container */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 150 }}
          className="relative w-full max-w-3xl aspect-video bg-neutral-950 rounded-3xl border border-green-500/30 overflow-hidden shadow-[0_0_40px_rgba(34,197,94,0.15)] group"
        >
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-500 ${!isCamOn && 'opacity-0'}`} />
            
            {!isCamOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
                    <VideoOff className="w-16 h-16 text-green-900 mb-4" />
                    <span className="text-green-700 tracking-widest font-bold animate-pulse">CAMERA DISABLED</span>
                </div>
            )}

            {/* Floating Glass Control Dock */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 p-2 bg-black/50 backdrop-blur-md rounded-2xl border border-green-500/20 opacity-90 hover:opacity-100 transition-opacity">
                <Button 
                    size="lg"
                    className={`rounded-xl transition-all active:scale-95 ${isMicOn ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    onClick={toggleMic}
                >
                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
                <Button 
                    size="lg"
                    className={`rounded-xl transition-all active:scale-95 ${isCamOn ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    onClick={toggleCam}
                >
                    {isCamOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
            </div>
        </motion.div>

        {/* The Terminal Panel */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
          className="w-full max-w-md"
        >
            <div className="w-full border border-green-900/50 bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
                {/* Terminal Header */}
                <div className="bg-green-950/30 px-4 py-3 border-b border-green-900/50 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-500" />
                    <span className="text-xs font-bold tracking-widest text-green-400">SESSION_LOG.EXE</span>
                </div>
                
                {/* Terminal Body */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <p className="text-xs text-green-600 flex items-center gap-2">
                            <span className="text-green-500">&gt;</span> STATUS: <span className="text-white font-bold bg-green-900/50 px-2 py-0.5 rounded">ENCRYPTED</span>
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-2">
                            <span className="text-green-500">&gt;</span> SOCKET_ID: <span className="text-gray-300">{socket?.id || 'ESTABLISHING_CONNECTION...'}</span>
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-2">
                            <span className="text-green-500">&gt;</span> TTL: <span className="text-gray-300">{timeLeft} SECONDS</span>
                        </p>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-green-900/0 via-green-900 to-green-900/0 my-4" />
                    
                    <p className="text-[10px] text-green-800 leading-relaxed uppercase">
                        Warning: This is a volatile session. All traces, packets, and media streams will be permanently wiped upon termination. Do not refresh the page.
                    </p>
                </div>
            </div>
        </motion.div>

      </div>
    </motion.div>
  );
}