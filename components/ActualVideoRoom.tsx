"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Crown, Users, X, ShieldAlert, UserX, MicOff as MicOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type RemoteUser = { stream?: MediaStream; name?: string; role?: string; };
interface ActualVideoRoomProps { roomCode: string; role: "HOST" | "PARTICIPANT" | "GUEST" | null; user?: { name?: string | null; email?: string | null; image?: string | null } | null; }

type OfferData = { caller: string; offer: RTCSessionDescriptionInit; callerName: string; callerRole: string; roomId: string; };
type AnswerData = { caller: string; answer: RTCSessionDescriptionInit; callerName: string; callerRole: string; roomId: string; };
type IceCandidateData = { 
  target: string;
  caller: string; 
  candidate: RTCIceCandidateInit; 
  roomId: string; 
};
type CommandMessage = { type: "MUTE_ALL" | "KICK"; targetId?: string; };

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

const VideoPlayer = ({ stream, isLocal, name, userRole }: { stream: MediaStream | null, isLocal: boolean, name: string, userRole: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      // FIX: Force the browser to play the incoming stream to bypass strict Autoplay policies
      videoRef.current.play().catch((error) => {
         console.warn("Browser autoplay policy prevented video from starting automatically:", error);
      });
    }
  }, [stream]);

  return (
    <div className="relative bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 aspect-video shadow-2xl group">
      <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg z-10">
        <span className="text-sm font-medium text-white">{name} {isLocal && "(You)"}</span>
        {userRole === "HOST" && <Crown className="w-4 h-4 text-amber-400 ml-1" />}
      </div>
    </div>
  );
};

export function ActualVideoRoom({ roomCode, role, user }: ActualVideoRoomProps) {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const hasJoinedRef = useRef(false); // <-- Prevents Strict Mode double-emit
  
  const [remoteUsers, setRemoteUsers] = useState<{ [id: string]: RemoteUser }>({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const myName = user?.name || "Anonymous Guest";

  // 1. GET CAMERA & JOIN ROOM
  useEffect(() => {
    if (!socket || hasJoinedRef.current) return;

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        localStreamRef.current = stream;
        
        socket.emit("join-room", roomCode, socket.id, myName);
        hasJoinedRef.current = true;
      } catch (error) {
        console.error("Error accessing media devices.", error);
      }
    };

    startMedia();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, roomCode, myName]);

 // 2. WEBRTC SIGNALING (The ICE Candidate Fix)
  useEffect(() => {
    if (!socket) return;

    socket.on("user-connected", async (userId: string, userName: string) => {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[userId] = peerConnection;

      setRemoteUsers(prev => ({ ...prev, [userId]: { ...(prev[userId] || {}), name: userName, role: "CONNECTING..." } }));

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStreamRef.current!));
      }

      peerConnection.ontrack = (event) => {
        setRemoteUsers((prev) => ({ ...prev, [userId]: { ...(prev[userId] || {}), stream: event.streams[0] } }));
      };

      // FIX 1: We added caller: socket.id so the receiver knows who sent the ICE candidate!
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { 
            target: userId, 
            caller: socket.id, 
            candidate: event.candidate, 
            roomId: roomCode 
          });
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socket.emit("offer", { target: userId, caller: socket.id, offer, roomId: roomCode, callerName: myName, callerRole: role || "GUEST" });
    });

    socket.on("offer", async (data: OfferData) => {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[data.caller] = peerConnection;

      setRemoteUsers(prev => ({ ...prev, [data.caller]: { ...(prev[data.caller] || {}), name: data.callerName, role: data.callerRole } }));

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => peerConnection.addTrack(track, localStreamRef.current!));
      }

      peerConnection.ontrack = (event) => {
        setRemoteUsers((prev) => ({ ...prev, [data.caller]: { ...(prev[data.caller] || {}), stream: event.streams[0] } }));
      };

      // FIX 2: Added caller: socket.id here too!
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { 
            target: data.caller, 
            caller: socket.id, 
            candidate: event.candidate, 
            roomId: roomCode 
          });
        }
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit("answer", { target: data.caller, caller: socket.id, answer, roomId: roomCode, callerName: myName, callerRole: role || "GUEST" });
    });

    socket.on("answer", async (data: AnswerData) => {
      setRemoteUsers(prev => ({ ...prev, [data.caller]: { ...(prev[data.caller] || {}), name: data.callerName, role: data.callerRole } }));
      
      const peerConnection = peersRef.current[data.caller];
      if (peerConnection) await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    // FIX 3: Added a safety try/catch block. Sometimes ICE candidates arrive a millisecond before the offer finishes processing.
    socket.on("ice-candidate", async (data: IceCandidateData) => {
      const peerConnection = peersRef.current[data.caller];
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.log("Safely caught ICE timing race condition", e);
        }
      }
    });

    socket.on("user-disconnected", (userId: string) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setRemoteUsers((prev) => {
        const newUsers = { ...prev };
        delete newUsers[userId];
        return newUsers;
      });
    });

    return () => {
      socket.off("user-connected"); 
      socket.off("offer"); 
      socket.off("answer"); 
      socket.off("ice-candidate"); 
      socket.off("user-disconnected");
    };
  }, [socket, roomCode, myName, role]);

  // 3. HOST CONTROLS
  useEffect(() => {
    if (!socket) return;

    const handleCommand = (msg: CommandMessage) => {
      if (msg.type === "MUTE_ALL" && role !== "HOST") {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack && audioTrack.enabled) {
          audioTrack.enabled = false;
          setIsMicOn(false);
        }
      }
      if (msg.type === "KICK" && msg.targetId === socket.id) {
        alert("You have been removed from the meeting by the Host.");
        window.location.href = "/";
      }
    };

    socket.on("receive-message", handleCommand);
    return () => { socket.off("receive-message", handleCommand); };
  }, [socket, role]);

  const muteAllUsers = () => {
    if (socket && role === "HOST") socket.emit("send-message", roomCode, { type: "MUTE_ALL" });
  };

  const kickUser = (userId: string) => {
    if (socket && role === "HOST") socket.emit("send-message", roomCode, { type: "KICK", targetId: userId });
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      track.enabled = !track.enabled;
      setIsMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      track.enabled = !track.enabled;
      setIsCamOn(track.enabled);
    }
  };

  return (
    <div className="flex w-full h-full bg-black relative overflow-hidden font-sans">
      <div className={`flex flex-col flex-1 transition-all duration-300 ${showParticipants ? 'mr-80' : 'mr-0'}`}>
        <div className="w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white font-mono text-sm shadow-lg">
            {roomCode}
          </div>
          <Button variant="outline" onClick={() => setShowParticipants(!showParticipants)} className="bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-xl backdrop-blur-md">
            <Users className="w-4 h-4 mr-2" /> 
            {Object.keys(remoteUsers).length + 1}
          </Button>
        </div>

        <div className="flex-1 p-4 pt-16 pb-24 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max max-w-7xl mx-auto">
            <VideoPlayer stream={localStream} isLocal={true} name={myName} userRole={role || "GUEST"} />
            {Object.entries(remoteUsers).map(([id, remoteUser]) => (
              <VideoPlayer key={id} stream={remoteUser.stream || null} isLocal={false} name={remoteUser.name || "Connecting..."} userRole={remoteUser.role || "GUEST"} />
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-20">
          <Button size="icon" onClick={toggleMic} className={`w-14 h-14 rounded-2xl transition-all ${isMicOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          <Button size="icon" onClick={toggleCam} className={`w-14 h-14 rounded-2xl transition-all ${isCamOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
            {isCamOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          <div className="w-px h-8 bg-white/10 mx-2" />
          <Button onClick={() => window.location.href = '/'} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-8 h-14 font-bold tracking-wide shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-transform active:scale-95">
            <PhoneOff className="w-5 h-5 mr-2" /> Leave
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showParticipants && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-zinc-950/90 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col z-30"
          >
            <div className="p-5 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Users className="w-5 h-5 text-indigo-400"/> Participants</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowParticipants(false)} className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {role === "HOST" && (
              <div className="p-4 bg-amber-500/5 border-b border-amber-500/10">
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Host Panel</p>
                <Button onClick={muteAllUsers} className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/30 rounded-xl transition-all active:scale-95">
                  <MicOffIcon className="w-4 h-4 mr-2" /> Mute Everyone
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">{myName} <span className="text-[10px] text-zinc-500">(You)</span></p>
                  <p className="text-xs text-indigo-400 mt-0.5">{role || "GUEST"}</p>
                </div>
                {!isMicOn && <MicOff className="w-4 h-4 text-red-500" />}
              </div>

              {Object.entries(remoteUsers).map(([id, remoteUser]) => (
                <div key={id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group transition-colors hover:bg-white/10">
                  <div className="flex-1 truncate pr-2">
                    <p className="text-sm font-bold text-white truncate">{remoteUser.name || "Connecting..."}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{remoteUser.role || "GUEST"}</p>
                  </div>
                  
                  {role === "HOST" && (
                     <Button size="icon" variant="ghost" onClick={() => kickUser(id)} className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg shrink-0 title='Kick User'">
                       <UserX className="w-4 h-4" />
                     </Button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}