"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/components/providers/SocketProvider";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Crown, Users, X, ShieldAlert, UserX, MicOff as MicOffIcon, Smile, MonitorUp, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type RemoteUser = { stream?: MediaStream; name?: string; role?: string; };
interface ActualVideoRoomProps { roomCode: string; role: "HOST" | "PARTICIPANT" | "GUEST" | null; user?: { name?: string | null; email?: string | null; image?: string | null } | null; }

type OfferData = { target: string; caller: string; offer: RTCSessionDescriptionInit; callerName: string; callerRole: string; roomId: string; };
type AnswerData = { target: string; caller: string; answer: RTCSessionDescriptionInit; callerName: string; callerRole: string; roomId: string; };
type IceCandidateData = { target: string; caller: string; candidate: RTCIceCandidateInit; roomId: string; };

type CommandMessage = 
  | { type: "MUTE_ALL" | "KICK"; targetId?: string; }
  | { type: "REACTION"; emoji: string; senderName: string; id: string; }
  | { type: "SCREEN_SHARE_START" | "SCREEN_SHARE_STOP"; senderId: string; };

type Reaction = { id: string; emoji: string; name: string; startX: number; endX: number };

const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };
const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "🔥", "💯"];

const VideoPlayer = ({ stream, isLocal, name, userRole, isSpotlight = false }: { stream: MediaStream | null, isLocal: boolean, name: string, userRole: string, isSpotlight?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn("Autoplay prevented:", e));
    }
  }, [stream]);

  return (
    <div className={`relative bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group transition-all duration-500 ${isSpotlight ? 'w-full h-full' : 'aspect-video w-full'}`}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted={isLocal} 
        className={`w-full h-full object-cover ${isLocal && !isSpotlight ? 'scale-x-[-1]' : ''}`} 
      />
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
  const hasJoinedRef = useRef(false); 
  
  const [remoteUsers, setRemoteUsers] = useState<{ [id: string]: RemoteUser }>({});
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [presenterId, setPresenterId] = useState<string | null>(null); 
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  
  const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
  const pendingCandidates = useRef<{ [id: string]: RTCIceCandidateInit[] }>({});
  
  const myName = user?.name || "Guest User";
  const firstName = myName.split(" ")[0]; 

  // --- REACTION ENGINE ---
  const addReactionToScreen = useCallback((reactionData: {id: string, emoji: string, name: string}) => {
    const startX = Math.floor(Math.random() * 60) - 30;
    const endX = startX + (Math.floor(Math.random() * 40) - 20);
    
    setReactions(prev => [...prev, { ...reactionData, startX, endX }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionData.id)), 3000);
  }, []);

  const sendReaction = (emoji: string) => {
   const id = crypto.randomUUID(); 
  
  addReactionToScreen({ id, emoji, name: firstName }); 
  
  if (socket) {
      socket.emit("send-message", roomCode, { type: "REACTION", emoji, senderName: firstName, id });
  }
  setShowReactionMenu(false);
  };

  // 1. GET CAMERA & JOIN ROOM
  useEffect(() => {
    if (!socket || !socket.id || hasJoinedRef.current) return;

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
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
      if (screenTrackRef.current) screenTrackRef.current.stop();
    };
  }, [socket, roomCode, myName]);


 // 2. WEBRTC SIGNALING
  useEffect(() => {
    if (!socket || !socket.id) return;

    // FIX: Removed unused parameters (isInitiator, offer)
    const setupPeerConnection = (userId: string) => {
      const peerConnection = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[userId] = peerConnection;

      const currentStream = isScreenSharing && screenTrackRef.current 
        ? new MediaStream([screenTrackRef.current, localStreamRef.current!.getAudioTracks()[0]])
        : localStreamRef.current;

      if (currentStream) currentStream.getTracks().forEach((track) => peerConnection.addTrack(track, currentStream));

      peerConnection.ontrack = (event) => {
        setRemoteUsers((prev) => ({ ...prev, [userId]: { ...(prev[userId] || {}), stream: event.streams[0] } }));
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) socket.emit("ice-candidate", { target: userId, caller: socket.id, candidate: event.candidate, roomId: roomCode });
      };

      return peerConnection;
    };

    socket.on("user-connected", async (userId: string, userName: string) => {
      setRemoteUsers(prev => ({ ...prev, [userId]: { ...(prev[userId] || {}), name: userName, role: "CONNECTING..." } }));
      
      const pc = setupPeerConnection(userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      socket.emit("offer", { target: userId, caller: socket.id, offer, roomId: roomCode, callerName: myName, callerRole: role || "GUEST" });
      
      if (isScreenSharing && socket.id) {
          socket.emit("send-message", roomCode, { type: "SCREEN_SHARE_START", senderId: socket.id });
      }
    });

    socket.on("offer", async (data: OfferData) => {
      if (data.target !== socket.id) return;
      setRemoteUsers(prev => ({ ...prev, [data.caller]: { ...(prev[data.caller] || {}), name: data.callerName, role: data.callerRole } }));
      
      const pc = setupPeerConnection(data.caller);
      
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      if (pendingCandidates.current[data.caller]) {
          pendingCandidates.current[data.caller].forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(e=>console.log(e)));
          pendingCandidates.current[data.caller] = [];
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socket.emit("answer", { target: data.caller, caller: socket.id, answer, roomId: roomCode, callerName: myName, callerRole: role || "GUEST" });
    });

    socket.on("answer", async (data: AnswerData) => {
      if (data.target !== socket.id) return;
      setRemoteUsers(prev => ({ ...prev, [data.caller]: { ...(prev[data.caller] || {}), name: data.callerName, role: data.callerRole } }));
      
      const pc = peersRef.current[data.caller];
      if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          if (pendingCandidates.current[data.caller]) {
              pendingCandidates.current[data.caller].forEach(c => pc.addIceCandidate(new RTCIceCandidate(c)).catch(e=>console.log(e)));
              pendingCandidates.current[data.caller] = [];
          }
      }
    });

    socket.on("ice-candidate", async (data: IceCandidateData) => {
      if (data.target !== socket.id) return;
      const pc = peersRef.current[data.caller];
      if (pc && pc.remoteDescription) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(e => console.log("ICE Error", e));
      } else {
        if (!pendingCandidates.current[data.caller]) pendingCandidates.current[data.caller] = [];
        pendingCandidates.current[data.caller].push(data.candidate);
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
      if (presenterId === userId) setPresenterId(null);
    });

    return () => {
      socket.off("user-connected"); socket.off("offer"); socket.off("answer"); socket.off("ice-candidate"); socket.off("user-disconnected");
    };
  }, [socket, roomCode, myName, role, isScreenSharing, presenterId]);


  // 3. HOST CONTROLS & ADVANCED LISTENER
  useEffect(() => {
    if (!socket) return;

    const handleCommand = (msg: CommandMessage) => {
      if (msg.type === "REACTION") {
        addReactionToScreen({ id: msg.id, emoji: msg.emoji, name: msg.senderName });
      }
      else if (msg.type === "SCREEN_SHARE_START") {
        setPresenterId(msg.senderId);
      }
      else if (msg.type === "SCREEN_SHARE_STOP") {
        setPresenterId(null);
      }
      else if (msg.type === "MUTE_ALL" && role !== "HOST") {
        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        if (audioTrack && audioTrack.enabled) {
          audioTrack.enabled = false;
          setIsMicOn(false);
        }
      }
      else if (msg.type === "KICK" && msg.targetId === socket.id) {
        if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
        alert("You have been removed from the meeting by the Host.");
        window.location.href = "/";
      }
    };

    socket.on("receive-message", handleCommand);
    return () => { socket.off("receive-message", handleCommand); };
  }, [socket, role, addReactionToScreen]);


  // --- SCREEN SHARE ENGINE ---

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
        stopScreenShare();
        return;
    }
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        Object.values(peersRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack);
        });

        const audioTrack = localStreamRef.current?.getAudioTracks()[0];
        const displayStream = new MediaStream([screenTrack]);
        if (audioTrack) displayStream.addTrack(audioTrack);
        
        setLocalStream(displayStream);
        setIsScreenSharing(true);
        if (socket && socket.id) {
            setPresenterId(socket.id);
            socket.emit("send-message", roomCode, { type: "SCREEN_SHARE_START", senderId: socket.id });
        }

        screenTrack.onended = () => stopScreenShare();
    } catch (err) {
        console.error("Screen share failed or cancelled", err);
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
    }
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
        Object.values(peersRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(camTrack);
        });
        setLocalStream(new MediaStream(localStreamRef.current!.getTracks()));
    }
    setIsScreenSharing(false);
    if (socket && socket.id) {
        setPresenterId(null);
        socket.emit("send-message", roomCode, { type: "SCREEN_SHARE_STOP", senderId: socket.id });
    }
  };
  
  const muteAllUsers = () => { if (socket && role === "HOST") socket.emit("send-message", roomCode, { type: "MUTE_ALL" }); };
  const kickUser = (userId: string) => { if (socket && role === "HOST") socket.emit("send-message", roomCode, { type: "KICK", targetId: userId }); };
  
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

  const handleLeave = () => {
     if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
     if (screenTrackRef.current) screenTrackRef.current.stop();
     window.location.href = '/meeting-ended';
  };

  // LAYOUT HELPERS
  const isPresenting = presenterId !== null;
  const isMePresenting = presenterId === socket?.id;

  return (
    <div className="flex w-full h-full bg-black relative overflow-hidden font-sans">
      
      {/* PRESENTATION BANNER */}
      <AnimatePresence>
        {isMePresenting && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-4 z-40 shadow-2xl border border-indigo-400"
          >
             <span className="flex items-center gap-2 font-medium">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 
               You are presenting to everyone
             </span>
             <div className="w-px h-6 bg-white/20 mx-2" />
             <Button size="sm" onClick={stopScreenShare} className="bg-white text-indigo-600 hover:bg-zinc-200 rounded-full h-8 font-bold">
               Stop Sharing
             </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TELEGRAM STYLE ANIMATED REACTION BUBBLES */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none z-[100]">
          <AnimatePresence>
              {reactions.map((r) => (
                  <motion.div
                      key={r.id}
                      initial={{ scale: 0, y: 0, x: r.startX, rotate: -20, opacity: 0 }}
                      animate={{ 
                        scale: [0, 2, 1.3, 1.5], 
                        y: -300,                 
                        x: r.endX,               
                        rotate: [0, 15, -10, 10, 0], 
                        opacity: [0, 1, 1, 0]    
                      }}
                      transition={{ 
                        duration: 3, 
                        scale: { type: "spring", stiffness: 300, damping: 10 },
                        ease: "easeOut" 
                      }}
                      className="absolute bottom-0 flex flex-col items-center"
                  >
                      <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full mb-1 shadow-lg whitespace-nowrap border border-white/10">
                          {r.name}
                      </div>
                      <div className="text-5xl drop-shadow-2xl">{r.emoji}</div>
                  </motion.div>
              ))}
          </AnimatePresence>
      </div>

      <div className={`flex flex-col w-full transition-all duration-300 ${showParticipants ? 'mr-80' : 'mr-0'}`}>
        
        {/* HEADER BAR */}
        <div className="w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-white font-mono text-sm shadow-lg">
            {roomCode}
          </div>
          <Button variant="outline" onClick={() => setShowParticipants(!showParticipants)} className="bg-white/10 text-white border-white/20 hover:bg-white/20 rounded-xl backdrop-blur-md">
            <Users className="w-4 h-4 mr-2" /> {Object.keys(remoteUsers).length + 1}
          </Button>
        </div>

        {/* --- DYNAMIC LAYOUT ENGINE --- */}
        <div className="flex-1 p-4 pt-10 pb-32 overflow-hidden flex flex-col">
          {isPresenting ? (
            <div className="flex flex-col h-full gap-4 w-full max-w-7xl mx-auto">
              <div className="flex-1 w-full min-h-[50vh] bg-black rounded-[2rem] shadow-2xl relative overflow-hidden border border-white/5">
                 {isMePresenting ? (
                    <VideoPlayer stream={localStream} isLocal={true} name={`${myName}'s Screen`} userRole={role || "GUEST"} isSpotlight={true} />
                 ) : (
                    remoteUsers[presenterId] && <VideoPlayer stream={remoteUsers[presenterId].stream || null} isLocal={false} name={`${remoteUsers[presenterId].name}'s Screen`} userRole={remoteUsers[presenterId].role || "GUEST"} isSpotlight={true} />
                 )}
              </div>
              <div className="h-40 shrink-0 w-full overflow-x-auto flex gap-4 pb-2 snap-x">
                 {!isMePresenting && (
                    <div className="h-full aspect-video shrink-0 snap-center"><VideoPlayer stream={localStream} isLocal={true} name={myName} userRole={role || "GUEST"} /></div>
                 )}
                 {Object.entries(remoteUsers).map(([id, remoteUser]) => {
                    if (id === presenterId) return null; 
                    return <div key={id} className="h-full aspect-video shrink-0 snap-center"><VideoPlayer stream={remoteUser.stream || null} isLocal={false} name={remoteUser.name || "..."} userRole={remoteUser.role || "GUEST"} /></div>
                 })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max w-full max-w-7xl mx-auto overflow-y-auto pr-2">
              <VideoPlayer stream={localStream} isLocal={true} name={myName} userRole={role || "GUEST"} />
              {Object.entries(remoteUsers).map(([id, remoteUser]) => (
                <VideoPlayer key={id} stream={remoteUser.stream || null} isLocal={false} name={remoteUser.name || "Connecting..."} userRole={remoteUser.role || "GUEST"} />
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM CONTROL DOCK */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-[90]">
          
          <Button size="icon" onClick={toggleMic} className={`w-14 h-14 rounded-2xl transition-all ${isMicOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
            {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          
          <Button size="icon" onClick={toggleCam} className={`w-14 h-14 rounded-2xl transition-all ${isCamOn ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
            {isCamOn ? <VideoIcon className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button size="icon" onClick={toggleScreenShare} className={`w-14 h-14 rounded-2xl transition-all hidden sm:flex ${isScreenSharing ? 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
            {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <MonitorUp className="w-6 h-6" />}
          </Button>

          <div className="relative z-[100]">
            <AnimatePresence>
                {showReactionMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="absolute bottom-[120%] left-1/2 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex gap-1 shadow-2xl origin-bottom"
                    >
                        {EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => sendReaction(emoji)}
                                className="text-2xl hover:scale-125 transition-transform p-2 cursor-pointer"
                            >
                                {emoji}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
            <Button size="icon" onClick={() => setShowReactionMenu(!showReactionMenu)} className={`w-14 h-14 rounded-2xl transition-all ${showReactionMenu ? 'bg-indigo-500 text-white' : 'bg-zinc-800 hover:bg-zinc-700 text-white'}`}>
              <Smile className="w-6 h-6" />
            </Button>
          </div>

          <div className="w-px h-8 bg-white/10 mx-2" />
          
          <Button onClick={handleLeave} className="bg-red-500 hover:bg-red-600 text-white rounded-2xl px-6 sm:px-8 h-14 font-bold tracking-wide shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-transform active:scale-95">
            <PhoneOff className="w-5 h-5 sm:mr-2" /> <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showParticipants && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-zinc-950/90 backdrop-blur-3xl border-l border-white/10 shadow-2xl flex flex-col z-[80]"
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