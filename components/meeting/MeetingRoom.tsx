"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Mic, MicOff, Video, VideoOff, 
  PhoneOff, MessageSquare, MonitorUp, Send, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSocket } from "@/components/providers/SocketProvider";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" }
  ]
};

export default function MeetingRoom({ roomId = "test-room" }: { roomId?: string }) {
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  // --- UI & Media State ---
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // --- Chat State ---
  const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [remoteUser, setRemoteUser] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null); 

  // 1. Initialize Media & Join (UNCHANGED)
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        if (socket && isConnected && socket.id) {
          socket.emit("join-room", roomId, socket.id, "User-" + socket.id.slice(0, 4));
        }
      } catch (err) {
        console.error("Error accessing media:", err);
      }
    };

    startMedia();

    return () => {
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
    };
  }, [socket, isConnected, roomId]);

  // 2. WebRTC & Socket Chat Logic (UNCHANGED)
  useEffect(() => {
    if (!socket) return;

    const createPeerConnection = () => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("ice-candidate", { roomId, candidate: event.candidate });
      };

      pc.ontrack = (event) => {
        setTimeout(() => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        }, 50);
      };

      peerConnectionRef.current = pc;
      return pc;
    };

    socket.on("user-connected", async (userId) => {
      setRemoteUser(userId);
      const pc = createPeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { roomId, offer });
    });

    socket.on("offer", async (data) => {
      setRemoteUser("Host User"); 
      const pc = createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { roomId, answer });
    });

    socket.on("answer", async (data) => {
      if (peerConnectionRef.current) await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on("ice-candidate", async (data) => {
      if (peerConnectionRef.current) await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
    });

    socket.on("receive-message", (messageData) => {
      setMessages(prev => [...prev, messageData]);
      setSidebarOpen(true);
    });

    socket.on("user-disconnected", () => {
      setRemoteUser(null); 
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    return () => {
      socket.off("user-connected");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("receive-message");
      socket.off("user-disconnected");
    };
  }, [socket, roomId]);

  // 3. Chat Send Function
  const sendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!chatInput.trim() || !socket) return;

    const messageData = {
      sender: "User-" + (socket.id ? socket.id.slice(0, 4) : "Me"),
      text: chatInput.trim()
    };
    
    setMessages((prev) => [...prev, messageData]);
    socket.emit("send-message", roomId, messageData);
    setChatInput("");
  };

  // 4. Media Toggles
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenVideoTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenVideoTrack);
        }

        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);

        screenVideoTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error("Error sharing screen", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
    
    if (localStreamRef.current) {
      const cameraVideoTrack = localStreamRef.current.getVideoTracks()[0];
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(cameraVideoTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        setIsCamOn(videoTrack.enabled);
    }
  };

  const leaveMeeting = () => {
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach((track) => track.stop());
    if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach((track) => track.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    router.push('/meeting-ended');
  };

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* --- VIDEO GRID --- */}
      <div className={cn("flex-1 p-6 flex flex-col md:flex-row items-center justify-center gap-6 transition-all duration-500", isSidebarOpen && "pr-[340px]")}>
        
        {/* Local Video */}
        <motion.div 
          layout
          className={cn(
            "relative bg-neutral-900 rounded-3xl overflow-hidden border transition-all duration-300 shadow-2xl",
            isScreenSharing ? "border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]" : "border-white/10",
            remoteUser ? "w-full md:w-1/2 aspect-video" : "w-full max-w-5xl aspect-video"
          )}
        >
           <video ref={localVideoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover", !isScreenSharing && "transform scale-x-[-1]")} />
           
           <div className="absolute bottom-4 left-4 flex items-center gap-2">
             <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">
               You {isScreenSharing && <span className="text-indigo-400 ml-1">(Presenting)</span>}
             </div>
             {!isMicOn && (
               <div className="bg-red-500/80 backdrop-blur-md p-1.5 rounded-lg text-white">
                 <MicOff className="w-4 h-4" />
               </div>
             )}
           </div>

           {!isCamOn && !isScreenSharing && (
             <div className="absolute inset-0 bg-neutral-900 flex flex-col items-center justify-center">
               <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                 <VideoOff className="w-8 h-8 text-gray-500" />
               </div>
               <p className="text-gray-400 font-medium">Camera is off</p>
             </div>
           )}
        </motion.div>

        {/* Remote Video */}
        <AnimatePresence>
          {remoteUser && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
                className="relative bg-neutral-900 rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.15)] w-full md:w-1/2 aspect-video"
              >
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10">
                  Remote Guest
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- CHAT SIDEBAR (Framer Motion Upgraded) --- */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute right-0 top-0 h-full w-80 bg-neutral-900/95 backdrop-blur-2xl border-l border-white/10 flex flex-col z-40 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" /> In-Call Chat
              </h3>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
               {messages.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
                   <MessageSquare className="w-8 h-8 opacity-20" />
                   <p className="text-sm">No messages yet. Say hi!</p>
                 </div>
               ) : (
                 messages.map((msg, i) => {
                   const isMe = msg.sender === ("User-" + socket?.id?.slice(0, 4));
                   return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={cn("flex flex-col gap-1 max-w-[85%]", isMe ? "ml-auto items-end" : "items-start")}
                    >
                      <span className="text-[11px] text-gray-500 font-medium px-1">{isMe ? "You" : msg.sender}</span>
                      <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md", isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-neutral-800 text-gray-200 border border-white/5 rounded-tl-sm")}>
                        {msg.text}
                      </div>
                    </motion.div>
                   )
                 })
               )}
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/20">
               <div className="relative flex items-center">
                 <Input 
                   placeholder="Type a message..." 
                   className="bg-neutral-950/50 border-white/10 text-white placeholder:text-gray-500 rounded-full pr-12 focus-visible:ring-indigo-500"
                   value={chatInput}
                   onChange={(e) => setChatInput(e.target.value)}
                 />
                 <button 
                   type="submit" 
                   disabled={!chatInput.trim()}
                   className="absolute right-1 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-gray-500 text-white rounded-full transition-colors"
                 >
                   <Send className="w-4 h-4" />
                 </button>
               </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GLASSMORPHIC CONTROLS --- */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-neutral-900/80 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl shadow-black z-50"
      >
        <button 
          onClick={toggleMic}
          className={cn("p-4 rounded-full transition-all duration-300", isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-500 hover:bg-red-500/30")}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button 
          onClick={toggleCam}
          className={cn("p-4 rounded-full transition-all duration-300", isCamOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/20 text-red-500 hover:bg-red-500/30")}
        >
          {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        <div className="h-8 w-px bg-white/10 mx-1" />

        <button 
          onClick={toggleScreenShare}
          className={cn("p-4 rounded-full transition-all duration-300", isScreenSharing ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-white/10 text-white hover:bg-white/20 hover:text-cyan-400")}
        >
          <MonitorUp className="w-5 h-5" />
        </button>

        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className={cn("p-4 rounded-full transition-all duration-300 relative", isSidebarOpen ? "bg-cyan-500/20 text-cyan-400" : "bg-white/10 text-white hover:bg-white/20")}
        >
          <MessageSquare className="w-5 h-5" />
          {/* Notification Dot (Optional) */}
          {messages.length > 0 && !isSidebarOpen && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-neutral-900" />}
        </button>

        <div className="h-8 w-px bg-white/10 mx-1" />

        <button 
          onClick={leaveMeeting}
          className="ml-2 px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-red-600/20"
        >
          <PhoneOff className="w-4 h-4" /> End Call
        </button>
      </motion.div>

    </div>
  );
}