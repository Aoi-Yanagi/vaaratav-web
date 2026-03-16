"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Timer, XCircle, Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/components/providers/SocketProvider";

export default function GuestChat() {
  const router = useRouter();
  const { socket } = useSocket();
  
  // Timer State 
  const [timeLeft, setTimeLeft] = useState(300);
  
  // Media State
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // UI Toggle State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  // --- CLEANUP FUNCTION ---
  const endSession = () => {
    // Stop all media tracks immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null; // Clear it out completely
    }

    if (socket) {
        socket.emit("leave-room", "guest-lobby"); 
    }

    router.push('/meeting-ended');
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

  // 2. GET MEDIA (With React 18 Strict Mode Safeguard)
  useEffect(() => {
    let isMounted = true; // Safeguard flag

    const startMedia = async () => {
      try {
        const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        
        // CRITICAL FIX: If component unmounted while waiting for the user to click "Allow", 
        // kill the stream immediately so it doesn't become a ghost process.
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

    // Cleanup on unmount (or back button)
    return () => {
      isMounted = false; // Mark component as dead
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
    <div className="flex flex-col h-screen bg-black text-green-500 font-mono relative overflow-hidden">
      
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://upload.wikimedia.org/wikipedia/commons/1/17/Matrix_digital_rain_screensaver.png')] bg-cover" />

      <header className="flex items-center justify-between p-4 border-b border-green-900/50 bg-black/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 animate-pulse text-red-500" />
          <span className="font-bold tracking-widest uppercase text-white">Incognito Mode</span>
        </div>
        
        <div className={`flex items-center gap-2 text-2xl font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
          <Timer className="w-6 h-6" />
          {formatTime(timeLeft)}
        </div>

        <Button 
            variant="ghost" 
            size="icon" 
            onClick={endSession} 
            className="hover:bg-red-900/20 hover:text-red-500 text-gray-400 z-50 relative cursor-pointer"
        >
          <XCircle className="w-6 h-6" />
        </Button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-6 z-10">
        
        <div className="relative w-full max-w-lg aspect-video bg-neutral-900 rounded-lg border border-green-900 overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!isCamOn && 'hidden'}`} />
            
            {!isCamOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <span className="text-green-700 animate-pulse">NO SIGNAL</span>
                </div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <Button 
                    size="icon" 
                    className="rounded-full bg-green-900/80 hover:bg-green-800 text-white border border-green-500"
                    onClick={toggleMic}
                >
                    {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <Button 
                    size="icon" 
                    className="rounded-full bg-green-900/80 hover:bg-green-800 text-white border border-green-500"
                    onClick={toggleCam}
                >
                    {isCamOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
            </div>
        </div>

        <div className="w-full max-w-md space-y-4">
            <div className="p-4 border border-green-800 bg-black/50 rounded-lg">
                <h3 className="text-green-400 font-bold mb-2"> SESSION_INFO</h3>
                <p className="text-xs text-green-700">ID: {socket?.id || 'CONNECTING...'}</p>
                <p className="text-xs text-green-700">STATUS: ENCRYPTED</p>
                <p className="text-xs text-green-700">TTL: {timeLeft} SECONDS</p>
            </div>
            <div className="text-center text-xs text-green-900">
                * Connection will be terminated automatically.
            </div>
        </div>
      </div>
    </div>
  );
}