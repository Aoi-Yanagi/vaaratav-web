"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Timer, X, Mic, MicOff, Video as VideoIcon, VideoOff, ShieldCheck, Activity, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/components/providers/SocketProvider";
import { motion, AnimatePresence } from "framer-motion";

// 1. The main Page component that extracts the URL parameter
export default function GuestChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.roomId;
  
  return <GuestChat roomId={roomId} />;
}

// 2. The Secure Guest Chat component
function GuestChat({ roomId }: { roomId: string }) {
  const router = useRouter();
  const { socket } = useSocket();
  
  // --- UI & Meeting State ---
  const [timeLeft, setTimeLeft] = useState(300);
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // --- Media & WebRTC State ---
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [hasRemoteUser, setHasRemoteUser] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // --- CLEANUP & EXIT FUNCTION ---
  const endSession = () => {
    setIsClosing(true);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null; 
    }
    if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (socket) socket.emit("leave-room", roomId); 

    setTimeout(() => {
        router.push('/'); 
    }, 600);
  };

  const handleReportAbuse = () => {
    if (socket) {
        socket.emit("report-abuse", { roomId, reason: "Inappropriate behavior" });
    }
    endSession();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  // 2. GET MEDIA & JOIN SECURE ROOM
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
        if (videoRef.current) videoRef.current.srcObject = localStream;
        
        setIsMediaReady(true); // Triggers the WebRTC useEffect

        if (socket) {
            socket.emit("join-room", roomId, "guest-user", "Anonymous Guest");
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
  }, [socket, roomId]); 

  // 3. WEBRTC SIGNALING LOGIC (The "Brain")
  useEffect(() => {
    if (!socket || !isMediaReady) return;

    const createPeerConnection = () => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      // Add our local video/audio tracks to the connection
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current!));
      }

      // Send connection data to the other user
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      // Receive the other user's video/audio track
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setHasRemoteUser(true);
        }
      };

      peerConnectionRef.current = pc;
      return pc;
    };

    // When a new person joins, create an offer
    socket.on("user-connected", async () => {
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    });

    // When we receive an offer, answer it
    socket.on("offer", async (data) => {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    });

    // Finalize the connection handshake
    socket.on("answer", async (data) => {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on("ice-candidate", async (data) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("ICE error", e);
        }
      }
    });

    // Handle user leaving
    socket.on("user-disconnected", () => {
      setHasRemoteUser(false);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    return () => {
      socket.off("user-connected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-disconnected");
    };
  }, [socket, isMediaReady, roomId]);

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
      {/* Background Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      {/* Floating Header Pill */}
      <motion.header 
        initial={{ y: -40, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring", bounce: 0.4 }}
        className="flex items-center justify-between w-full max-w-6xl mt-6 px-4 z-20"
      >
        <div className="flex items-center gap-3 px-5 py-2.5 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full shadow-lg">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <span className="text-sm font-medium tracking-wide text-zinc-200 hidden sm:block">Secure Guest Session</span>
        </div>
        
        <div className={`flex items-center gap-2 text-lg font-semibold px-5 py-2.5 rounded-full border backdrop-blur-xl shadow-lg transition-colors duration-500 ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-zinc-200'}`}>
          <Timer className={`w-5 h-5 ${timeLeft < 60 ? 'animate-pulse' : ''}`} />
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                onClick={copyLink} 
                className="hidden sm:flex group px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full transition-all duration-300"
            >
                {copied ? <span className="font-medium text-emerald-400">Copied!</span> : <span className="font-medium">Copy Invite Link</span>}
            </Button>

            <Button 
                variant="ghost" 
                onClick={handleReportAbuse} 
                className="group px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-full transition-all duration-300"
                title="Report user and leave"
            >
                <AlertTriangle className="w-4 h-4" /> 
            </Button>

            <Button 
                variant="ghost" 
                onClick={endSession} 
                className="group px-4 py-2.5 bg-white/5 hover:bg-zinc-800 border border-white/10 text-zinc-300 rounded-full transition-all duration-300"
            >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> 
            </Button>
        </div>
      </motion.header>

      {/* --- TWO-COLUMN VIDEO GRID --- */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl p-4 sm:p-6 z-10">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            
            {/* 1. Local Video Window */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: isClosing ? 0.9 : 1 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.3 }}
              className="relative w-full aspect-video bg-zinc-900/50 backdrop-blur-sm rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl group"
            >
                {/* Muted must be true so you don't hear yourself! */}
                <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-700 ${!isCamOn ? 'opacity-0' : 'opacity-100'}`} />
                
                <AnimatePresence>
                    {!isCamOn && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md">
                            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 shadow-xl mb-4">
                                <VideoOff className="w-6 h-6 text-zinc-500" />
                            </div>
                            <span className="text-zinc-400 text-sm font-medium">Camera is turned off</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">
                    You
                </div>
            </motion.div>

            {/* 2. Remote Video Window */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: isClosing ? 0.9 : 1 }}
              transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.3 }}
              className="relative w-full aspect-video bg-zinc-900/50 backdrop-blur-sm rounded-[2rem] border border-cyan-500/20 overflow-hidden shadow-2xl group"
            >
                {/* Remote video is NOT muted, so you can hear them */}
                <video ref={remoteVideoRef} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-700 ${!hasRemoteUser ? 'opacity-0' : 'opacity-100'}`} />
                
                <AnimatePresence>
                    {!hasRemoteUser && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/90 backdrop-blur-md">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                            <span className="text-zinc-400 text-sm font-medium">Waiting for someone to join...</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {hasRemoteUser && (
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 text-cyan-400">
                        Guest User
                    </div>
                )}
            </motion.div>

        </div>

        {/* Fixed Control Dock at the bottom center */}
        <div className="mt-8 flex items-center gap-4 p-2 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl">
            <Button 
                size="icon"
                className={`w-14 h-14 rounded-xl transition-all duration-300 active:scale-90 ${isMicOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
                onClick={toggleMic}
            >
                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
            <Button 
                size="icon"
                className={`w-14 h-14 rounded-xl transition-all duration-300 active:scale-90 ${isCamOn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}
                onClick={toggleCam}
            >
                {isCamOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
        </div>

      </div>
    </motion.div>
  );
}