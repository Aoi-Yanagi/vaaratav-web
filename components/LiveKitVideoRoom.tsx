"use client";

import { useEffect, useState, useCallback, useRef, createContext, useContext } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { 
  LiveKitRoom, 
  GridLayout, 
  ParticipantTile,
  RoomAudioRenderer, 
  useDataChannel, 
  useLocalParticipant,
  useParticipants,
  useTracks,
  useRoomContext,
  useParticipantContext
} from "@livekit/components-react";
import "@livekit/components-styles";
import { LocalVideoTrack, RoomEvent, TranscriptionSegment, Participant, Track, DataPacket_Kind, RemoteParticipant } from "livekit-client";
import { 
  Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, PhoneOff, 
  Sparkles, MessageSquare, Send, X, ShieldAlert, MoreVertical, Ban, LogOut, ShieldMinus, ShieldCheck 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { BackgroundProcessor } from '@livekit/track-processors';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Lottie Assets
import heartAnim from "../app/public/lottie/heart.json";
import fireAnim from "../app/public/lottie/fire.json";
import partyAnim from "../app/public/lottie/party.json";

export const REACTION_MAP: Record<string, object> = {
  "heart": heartAnim,
  "fire": fireAnim,
  "party": partyAnim,
};

interface LiveKitVideoRoomProps {
  roomCode: string;
  token: string;
  isHost?: boolean;
}

type Reaction = { id: string; reactionId: string; name: string; startX: number; endX: number };
interface ChatMessage { sender: string; text: string; }
interface CommandPayload { 
  action: "KICK" | "BAN" | "MUTE" | "GRANT_MOD" | "REVOKE_MOD" | "END_MEETING"; 
  targetIdentity?: string; 
}

// FIX 1: Strict boolean return type added. No more 'undefined' tantrums.
const checkIsHost = (permissions: unknown): boolean => {
  return (permissions as { roomAdmin?: boolean })?.roomAdmin === true;
};

const RoomAdminContext = createContext<{
  isHost: boolean;
  isModerator: boolean;
  moderators: Set<string>;
  executeCommand: (targetId: string, action: CommandPayload["action"]) => void;
} | null>(null);

// --- MAIN AUTHENTICATED ROOM COMPONENT ---
export function LiveKitVideoRoom({ roomCode, token, isHost }: LiveKitVideoRoomProps) {
  const router = useRouter();

  if (typeof window !== "undefined" && localStorage.getItem(`banned_${roomCode}`)) {
    router.push('/dashboard');
    return null;
  }

  return (
    <LiveKitRoom
      video={true} 
      audio={true} 
      connect={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      options={{ adaptiveStream: true, dynacast: true }}
      data-lk-theme="default"
      className="w-full h-[100dvh] overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500"
    >
      <RoomUI roomCode={roomCode} initialIsHost={isHost} />
    </LiveKitRoom>
  );
}

// --- MAIN UI COMPONENT ---
function RoomUI({ roomCode, initialIsHost }: { roomCode: string, initialIsHost?: boolean }) {
  const room = useRoomContext();
  const router = useRouter();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // UI & Feature States
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showMobileControls, setShowMobileControls] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const transcriptVault = useRef<{ speaker: string, text: string }[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [blurEnabled, setBlurEnabled] = useState(false);

  // Communication States
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "people">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Authority & Meeting Lifecycle States
  const [moderators, setModerators] = useState<Set<string>>(new Set());
  const [endReason, setEndReason] = useState<"ended" | "kicked" | "banned" | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null); 

  // FIX 1 CONTINUED: Enforcing absolute boolean typing
  const isActualHost: boolean = initialIsHost === true || checkIsHost(localParticipant.permissions) === true;
  
  const isModerator = moderators.has(localParticipant.identity);
  const isHostPresent = isActualHost || participants.some(p => checkIsHost(p.permissions) === true);

  // --- DATA CHANNEL LISTENER ---
  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind, topic?: string) => {
      const decoder = new TextDecoder();
      
      if (topic === "chat") {
        const msg = JSON.parse(decoder.decode(payload)) as ChatMessage;
        setMessages(prev => [...prev, msg]);
        if (!isSidebarOpen) setSidebarOpen(true);
      }
      
      if (topic === "typing") {
        const name = decoder.decode(payload);
        setTypingUsers(prev => {
          const newSet = new Set(prev).add(name);
          setTimeout(() => setTypingUsers(curr => { const temp = new Set(curr); temp.delete(name); return temp; }), 3000);
          return newSet;
        });
      }

      if (topic === "commands") {
        const cmd = JSON.parse(decoder.decode(payload)) as CommandPayload;
        
        if (cmd.action === "END_MEETING") {
           setEndReason("ended");
           room.disconnect();
        }
        if (cmd.action === "GRANT_MOD" && cmd.targetIdentity) {
           setModerators(prev => new Set(prev).add(cmd.targetIdentity!));
        }
        if (cmd.action === "REVOKE_MOD" && cmd.targetIdentity) {
           setModerators(prev => { const s = new Set(prev); s.delete(cmd.targetIdentity!); return s; });
        }

        if (cmd.targetIdentity === localParticipant.identity) {
          if (cmd.action === "MUTE") localParticipant.setMicrophoneEnabled(false);
          if (cmd.action === "KICK") {
            setEndReason("kicked");
            room.disconnect();
          }
          if (cmd.action === "BAN") {
            localStorage.setItem(`banned_${roomCode}`, "true"); 
            setEndReason("banned");
            room.disconnect();
          }
        }
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, localParticipant, isSidebarOpen, roomCode]);

  useEffect(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  // FIX 3: Re-enabled the mobile controls listener to actively use the setShowMobileControls hook!
  useEffect(() => {
    const handleScreenTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'video') return;
      if (target.closest('#custom-control-bar') || target.closest('#reaction-engine') || target.closest('#sidebar-panel')) return;
      if (window.innerWidth < 640) {
        setShowMobileControls(prev => !prev);
      }
    };
    window.addEventListener('pointerup', handleScreenTap);
    return () => window.removeEventListener('pointerup', handleScreenTap);
  }, []);

  // --- ACTIONS ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg: ChatMessage = { sender: localParticipant.name || "User", text: chatInput };
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true, topic: "chat" });
    setMessages(prev => [...prev, msg]);
    setChatInput("");
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    room.localParticipant.publishData(new TextEncoder().encode(localParticipant.name || "User"), { reliable: false, topic: "typing" });
  };

  const executeCommand = (targetIdentity: string, action: CommandPayload["action"]) => {
    const payload: CommandPayload = { action, targetIdentity };
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true, topic: "commands" });
  };

  const addReactionToScreen = useCallback((reactionData: {id: string, reactionId: string, name: string}) => {
    const startX = Math.floor(Math.random() * 60) - 30;
    const endX = startX + (Math.floor(Math.random() * 40) - 20);
    setReactions(prev => [...prev, { ...reactionData, startX, endX }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionData.id)), 3000);
  }, []);

  const handleGenerateSummary = async () => {
    if (transcriptVault.current.length === 0) {
        alert("No words have been spoken yet!");
        return;
    }
    setIsSummarizing(true);
    setSummaryResult(null);
    try {
        const response = await fetch('/api/summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptVault.current }),
        });
        const data = await response.json();
        if (data.summary) setSummaryResult(data.summary);
        else alert("Error: " + data.error);
    } catch (error) { console.error("Failed to fetch summary:", error); } 
    finally { setIsSummarizing(false); }
  };

  const handleLeaveClick = () => {
    if (isActualHost) setShowEndModal(true);
    else {
      setEndReason("ended");
      room.disconnect();
    }
  };

  const handleEndForAll = async () => {
    executeCommand("all", "END_MEETING");
    setEndReason("ended");
    room.disconnect();
    
    try {
      await fetch('/api/meetings/end', { method: 'POST', body: JSON.stringify({ meetingCode: roomCode }) });
    } catch (e) { console.error(e) }
  };

  // --- LIFECYCLE SCREENS ---
  if (endReason) {
    return (
      <div className="flex h-[100dvh] w-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-10 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-md w-full">
           <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", endReason === "ended" ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400")}>
             {endReason === "ended" ? <Sparkles className="w-10 h-10" /> : <Ban className="w-10 h-10" />}
           </div>
           <h1 className="text-3xl font-bold mb-3 tracking-tight">
             {endReason === "kicked" ? "You were removed" : endReason === "banned" ? "You were banned" : "Meeting Ended"}
           </h1>
           <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
             {endReason === "kicked" ? "The host or a moderator has removed you from this session." 
             : endReason === "banned" ? "You have been permanently banned from joining this room code." 
             : "This video session has been concluded. Thank you for participating."}
           </p>
           <Button onClick={() => router.push('/dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 text-lg font-semibold shadow-lg">
             Return to Dashboard
           </Button>
        </motion.div>
      </div>
    );
  }

  if (!isHostPresent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 z-50 text-zinc-900 dark:text-white h-full w-full">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-2xl font-bold mb-2">Waiting for the Host...</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">The meeting will begin once the host arrives.</p>
        <Button onClick={() => router.push('/dashboard')} variant="outline" className="rounded-full px-8 h-12 border-zinc-200 dark:border-zinc-800">Cancel & Leave</Button>
      </div>
    );
  }

  const typingArray = Array.from(typingUsers).filter(n => n !== localParticipant.name);
  let typingString = "";
  if (typingArray.length === 1) typingString = `${typingArray[0]} is typing...`;
  else if (typingArray.length > 1) typingString = `${typingArray[0]} and ${typingArray.length - 1} others are typing...`;

  return (
    <RoomAdminContext.Provider value={{ isHost: isActualHost, isModerator, moderators, executeCommand }}>
      <div className="flex flex-col items-center w-full h-full text-zinc-900 dark:text-zinc-100 font-sans relative">
          
        {/* Floating Lottie Bubbles Layer */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 pointer-events-none z-[90]">
            <AnimatePresence>
                {reactions.map((r) => (
                    <motion.div
                        key={r.id}
                        initial={{ scale: 0, y: 0, x: r.startX, rotate: -20, opacity: 0 }}
                        animate={{ scale: 1.5, y: -300, x: r.endX, rotate: [0, 15, -10, 10, 0], opacity: [0, 1, 1, 0] }}
                        transition={{ duration: 3, scale: { type: "spring", stiffness: 300, damping: 10 }, ease: "easeOut" }}
                        className="absolute bottom-10 flex flex-col items-center"
                    >
                        <div className="bg-white/80 dark:bg-black/60 backdrop-blur-sm text-zinc-900 dark:text-white text-[10px] px-2 py-0.5 rounded-full mb-1 shadow-lg border border-zinc-200 dark:border-white/10 whitespace-nowrap transition-colors">
                            {r.name}
                        </div>
                        <div className="w-24 h-24 drop-shadow-2xl">
                            <Lottie animationData={REACTION_MAP[r.reactionId]} loop={true} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Video Grid Container */}
        <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto p-4 sm:p-6 z-10 min-h-0 pb-32 sm:pb-24 mt-6">
          <div className="flex-1 flex w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-[2rem] border border-zinc-200 dark:border-white/10 overflow-hidden shadow-xl dark:shadow-2xl relative transition-colors">
             
             {/* FIX: Changed this wrapper to relative and the inner grid to absolute to prevent height collapsing */}
             <div className="flex-1 w-full h-full relative">
                <div className="absolute inset-2">
                  <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
                    <ParticipantTile>
                       <ParticipantContextOverlay />
                    </ParticipantTile>
                  </GridLayout>
                </div>
                <RoomAudioRenderer />
             </div>

             <CaptionsOverlay enabled={captionsEnabled} />
             <TranscriptAccumulator vaultRef={transcriptVault} />
          </div>
        </div>

        {/* Host End Meeting Modal */}
        <AnimatePresence>
          {showEndModal && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                 <h2 className="text-2xl font-bold mb-2">End Meeting?</h2>
                 <p className="text-zinc-500 dark:text-zinc-400 mb-6">As the host, you can leave the room running for others, or end it permanently for everyone.</p>
                 <div className="flex flex-col gap-3">
                   <Button onClick={handleEndForAll} className="w-full bg-red-600 hover:bg-red-700 text-white h-12 rounded-xl text-md font-bold">End Meeting for All</Button>
                   <Button onClick={() => { setEndReason("ended"); room.disconnect(); }} variant="outline" className="w-full h-12 rounded-xl text-md border-zinc-200 dark:border-zinc-800">Just Leave Meeting</Button>
                   <Button onClick={() => setShowEndModal(false)} variant="ghost" className="w-full h-12 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5">Cancel</Button>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SLIDE-IN CHAT & PEOPLE SIDEBAR */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              id="sidebar-panel"
              initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-2xl border-l border-zinc-200 dark:border-white/10 flex flex-col z-[100] shadow-[-20px_0_50px_rgba(0,0,0,0.1)] dark:shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex border-b border-zinc-200 dark:border-white/10 relative">
                <button onClick={() => setActiveTab("chat")} className={cn("flex-1 py-4 font-bold text-sm", activeTab === "chat" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500" : "text-zinc-500")}>Chat</button>
                <button onClick={() => setActiveTab("people")} className={cn("flex-1 py-4 font-bold text-sm", activeTab === "people" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500" : "text-zinc-500")}>People ({participants.length})</button>
                <button onClick={() => setSidebarOpen(false)} className="absolute right-2 top-3 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-500"><X className="w-4 h-4"/></button>
              </div>
              
              {activeTab === "chat" && (
                <>
                  <div className="flex-1 p-5 overflow-y-auto space-y-4">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender === localParticipant.name;
                      return (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={cn("flex flex-col gap-1 max-w-[85%]", isMe ? "ml-auto items-end" : "items-start")}>
                          <span className="text-[11px] text-zinc-500 font-medium px-1">{isMe ? "You" : msg.sender}</span>
                          <div className={cn("px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md", isMe ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-zinc-100 dark:bg-neutral-800 text-zinc-900 dark:text-gray-200 border border-zinc-200 dark:border-white/5 rounded-tl-sm")}>
                            {msg.text}
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={scrollRef} />
                  </div>
                  
                  <div className="p-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-black/20">
                    {typingString && <div className="text-[11px] text-indigo-500 dark:text-indigo-400 italic mb-2 px-2">{typingString}</div>}
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                      <Input placeholder="Type a message..." value={chatInput} onChange={handleTyping} className="bg-white dark:bg-neutral-950/50 border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-full pr-12 focus-visible:ring-indigo-500" />
                      <button type="submit" disabled={!chatInput.trim()} className="absolute right-1 p-2 bg-indigo-600 disabled:bg-zinc-300 dark:disabled:bg-neutral-800 text-white rounded-full transition-colors"><Send className="w-4 h-4" /></button>
                    </form>
                  </div>
                </>
              )}

              {activeTab === "people" && (
                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  {participants.map((p) => {
                    const pIsAdmin = checkIsHost(p.permissions) === true;
                    const pIsMod = moderators.has(p.identity);
                    const hasAuthority = !p.isLocal && (isActualHost || (isModerator && !pIsMod && !pIsAdmin));
                    const isExpanded = expandedParticipant === p.identity;

                    return (
                      <div key={p.identity} className="bg-zinc-50 dark:bg-neutral-800/50 rounded-xl border border-zinc-200 dark:border-white/5 overflow-hidden transition-all">
                        <div 
                          className={cn("flex items-center justify-between p-3", hasAuthority && "cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5")} 
                          onClick={() => hasAuthority && setExpandedParticipant(isExpanded ? null : p.identity)}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                              {p.name} {p.isLocal && <span className="text-xs font-normal text-zinc-400">(You)</span>}
                            </span>
                            <div className="flex gap-2 mt-0.5">
                               {pIsAdmin && <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> Host</span>}
                               {pIsMod && !pIsAdmin && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Mod</span>}
                            </div>
                          </div>
                          {hasAuthority && <MoreVertical className="w-4 h-4 text-zinc-400" />}
                        </div>
                        
                        <AnimatePresence>
                           {isExpanded && hasAuthority && (
                             <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-zinc-200 dark:border-white/5 bg-zinc-100/50 dark:bg-black/20 flex flex-col">
                                <button onClick={() => executeCommand(p.identity, "MUTE")} className="flex items-center gap-2 px-4 py-2 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/5"><MicOff className="w-3 h-3"/> Force Mute</button>
                                {isActualHost && !pIsMod && <button onClick={() => executeCommand(p.identity, "GRANT_MOD")} className="flex items-center gap-2 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-zinc-200 dark:hover:bg-white/5"><ShieldAlert className="w-3 h-3"/> Make Moderator</button>}
                                {isActualHost && pIsMod && <button onClick={() => executeCommand(p.identity, "REVOKE_MOD")} className="flex items-center gap-2 px-4 py-2 text-xs text-orange-600 dark:text-orange-400 hover:bg-zinc-200 dark:hover:bg-white/5"><ShieldMinus className="w-3 h-3"/> Remove Mod</button>}
                                <button onClick={() => executeCommand(p.identity, "KICK")} className="flex items-center gap-2 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><LogOut className="w-3 h-3"/> Kick User</button>
                                <button onClick={() => executeCommand(p.identity, "BAN")} className="flex items-center gap-2 px-4 py-2 text-xs text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold"><Ban className="w-3 h-3"/> Ban Permanently</button>
                             </motion.div>
                           )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Summary Modal */}
        <AnimatePresence>
          {summaryResult && (
              <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 pointer-events-auto"
              >
                  <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-[2rem] transition-colors" onClick={() => setSummaryResult(null)} />
                  
                  <div className="relative w-full max-w-2xl max-h-full overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col gap-4 transition-colors">
                      <div className="flex justify-between items-start">
                          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500 dark:from-cyan-400 dark:to-indigo-400 flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-cyan-500 dark:text-cyan-400" /> AI Meeting Notes
                          </h2>
                          <button onClick={() => setSummaryResult(null)} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors">
                              <PhoneOff className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                          </button>
                      </div>
                      
                      <div className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap transition-colors">
                          {summaryResult}
                      </div>
                  </div>
              </motion.div>
          )}
        </AnimatePresence>
               
        {/* Modular Systems */}
        <ReactionEngine onReaction={addReactionToScreen} visible={showMobileControls} />
        
        <FloatingControlBar 
            visible={showMobileControls} 
            isGuest={false} 
            captionsEnabled={captionsEnabled}
            onToggleCaptions={() => setCaptionsEnabled(!captionsEnabled)}
            onGenerateSummary={handleGenerateSummary}
            isSummarizing={isSummarizing}
            blurEnabled={blurEnabled}
            onToggleBlur={() => setBlurEnabled(!blurEnabled)}
            onToggleChat={() => setSidebarOpen(!isSidebarOpen)}
            isChatOpen={isSidebarOpen}
            onLeave={handleLeaveClick}
        />
      </div>
    </RoomAdminContext.Provider>
  );
}

// --- NEW MODULAR: 3-DOT CONTEXT MENU ON VIDEO TILE ---
export function ParticipantContextOverlay() {
  const p = useParticipantContext();
  const context = useContext(RoomAdminContext);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!context) return null;
  const { isHost, isModerator, moderators, executeCommand } = context;

  const pIsHost = checkIsHost(p.permissions) === true;
  const pIsMod = moderators.has(p.identity);
  
  const hasAuthority = !p.isLocal && (isHost || (isModerator && !pIsMod && !pIsHost));

  if (!hasAuthority) return null;

  return (
    <div className="absolute top-3 right-3 z-50">
       <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 bg-black/50 hover:bg-black/80 rounded-lg backdrop-blur-md transition-colors text-white shadow-lg border border-white/10">
         <MoreVertical className="w-4 h-4" />
       </button>
       
       <AnimatePresence>
         {menuOpen && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }}
             className="absolute top-full right-0 mt-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 min-w-[180px]"
           >
              <button onClick={() => { executeCommand(p.identity, "MUTE"); setMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md w-full text-left">
                <MicOff className="w-3.5 h-3.5"/> Force Mute
              </button>
              
              {isHost && !pIsMod && (
                <button onClick={() => { executeCommand(p.identity, "GRANT_MOD"); setMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md w-full text-left">
                  <ShieldAlert className="w-3.5 h-3.5"/> Make Moderator
                </button>
              )}
              {isHost && pIsMod && (
                <button onClick={() => { executeCommand(p.identity, "REVOKE_MOD"); setMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md w-full text-left">
                  <ShieldMinus className="w-3.5 h-3.5"/> Remove Mod
                </button>
              )}

              <div className="h-px bg-zinc-200 dark:bg-white/10 my-1 w-full" />
              
              <button onClick={() => { executeCommand(p.identity, "KICK"); setMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md w-full text-left">
                <LogOut className="w-3.5 h-3.5"/> Kick User
              </button>
              <button onClick={() => { executeCommand(p.identity, "BAN"); setMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md w-full text-left">
                <Ban className="w-3.5 h-3.5"/> Ban Permanently
              </button>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}

// --- MODULAR: LIVE AI CAPTIONS OVERLAY ---
export function CaptionsOverlay({ enabled }: { enabled: boolean }) {
  const room = useRoomContext();
  const [captionText, setCaptionText] = useState("Waiting for speech...");

  useEffect(() => {
    if (!room || !enabled) return;
    const handleTranscription = (segments: TranscriptionSegment[], participant?: Participant) => {
      if (!participant) return;
      const fullPhrase = segments.map((s) => s.text).join(" ");
      if (fullPhrase.trim().length > 0) {
        const identity = participant.name || participant.identity;
        setCaptionText(`${identity}: "${fullPhrase}"`);
      }
    };
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => { room.off(RoomEvent.TranscriptionReceived, handleTranscription); };
  }, [room, enabled]);

 useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => setCaptionText("Waiting for speech..."), 0);
      return () => clearTimeout(timer);
    }
  }, [enabled]);

  return (
    <AnimatePresence>
      {enabled && (
        <motion.div 
            initial={{ opacity: 0, y: 15, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 15, x: "-50%" }}
            className="absolute bottom-6 left-1/2 w-11/12 max-w-2xl text-center z-[50] pointer-events-none"
        >
            <span className="bg-white/90 dark:bg-black/85 backdrop-blur-xl text-zinc-900 dark:text-white text-sm sm:text-base font-medium px-6 py-3.5 rounded-2xl leading-relaxed shadow-lg dark:shadow-2xl border border-zinc-200 dark:border-white/10 inline-block max-w-full break-words transition-colors">
               <Sparkles className="w-4 h-4 inline text-cyan-500 dark:text-cyan-400 mr-2 -mt-1 animate-pulse" />
               {captionText}
            </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- MODULAR: BACKGROUND TRANSCRIPT VAULT ---
export function TranscriptAccumulator({ vaultRef }: { vaultRef: React.MutableRefObject<{ speaker: string, text: string }[]> }) {
  const room = useRoomContext();
  useEffect(() => {
    if (!room) return;
    const handleTranscription = (segments: TranscriptionSegment[], participant?: Participant) => {
      if (!participant) return;
      const fullPhrase = segments.map((s) => s.text).join(" ");
      if (fullPhrase.trim().length > 0) {
        const identity = participant.name || participant.identity;
        vaultRef.current.push({ speaker: identity, text: fullPhrase });
      }
    };
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => { room.off(RoomEvent.TranscriptionReceived, handleTranscription); };
  }, [room, vaultRef]);
  return null;
}

// --- MODULAR: CUSTOM FLOATING CONTROL BAR ---
interface FloatingControlBarProps {
  visible: boolean;
  isGuest?: boolean;
  captionsEnabled?: boolean;
  onToggleCaptions?: () => void;
  onGenerateSummary?: () => void;
  isSummarizing?: boolean;
  blurEnabled?: boolean;
  onToggleBlur?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  onLeave: () => void;
}

export function FloatingControlBar({ 
    visible, isGuest = false, captionsEnabled = false, onToggleCaptions,
    onGenerateSummary, isSummarizing = false, blurEnabled = false, onToggleBlur, onToggleChat, isChatOpen = false, onLeave
}: FloatingControlBarProps) {
  
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, cameraTrack } = useLocalParticipant();
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const processorRef = useRef<ReturnType<typeof BackgroundProcessor> | null>(null);

  useEffect(() => {
    if (!cameraTrack?.track) return;
    const track = cameraTrack.track as LocalVideoTrack;
    const applyBlur = async () => {
      try {
        if (blurEnabled) {
          if (!processorRef.current) processorRef.current = BackgroundProcessor({ mode: 'background-blur', blurRadius: 15 });
          await track.setProcessor(processorRef.current);
        } else {
          if (processorRef.current) await track.stopProcessor();
        }
      } catch (e) { console.error("Failed to toggle background blur", e); }
    };
    applyBlur();
  }, [blurEnabled, cameraTrack]);

  const toggleMic = () => localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
  const toggleCam = () => localParticipant?.setCameraEnabled(!isCameraEnabled);
  const toggleScreen = () => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          id="custom-control-bar"
          initial={{ opacity: 0, scale: 0.9, y: "-50%" }}
          animate={{ opacity: 1, scale: 1, y: "-50%" }}
          exit={{ opacity: 0, scale: 0.9, y: "-50%" }}
          className="fixed z-[100] top-1/2 left-4 flex flex-col items-center gap-3 p-2 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-2xl opacity-30 hover:opacity-100 transition-all duration-300"
        >
          <button onClick={toggleMic} className={`p-3.5 rounded-xl transition-all active:scale-90 ${isMicrophoneEnabled ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-700 dark:text-white' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white'}`}>
            {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button onClick={toggleCam} className={`p-3.5 rounded-xl transition-all active:scale-90 ${isCameraEnabled ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-700 dark:text-white' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white'}`}>
            {isCameraEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button onClick={toggleScreen} className={`p-3.5 rounded-xl transition-all active:scale-90 hidden sm:block ${isScreenShareEnabled ? 'bg-indigo-600 dark:bg-indigo-500 text-white' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-zinc-700 dark:text-white'}`}>
            <MonitorUp className="w-5 h-5" />
          </button>

          <div className="w-6 h-px bg-zinc-200 dark:bg-white/10 my-1 transition-colors" />

          <button onClick={onToggleChat} className={`p-3.5 rounded-xl transition-all active:scale-90 ${isChatOpen ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-indigo-600 dark:text-indigo-400'}`}>
             <MessageSquare className="w-5 h-5" />
          </button>

          <div className="relative">
            <button onClick={() => setAiMenuOpen(!aiMenuOpen)} className={`p-3.5 rounded-xl transition-all active:scale-90 ${aiMenuOpen ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 text-cyan-600 dark:text-cyan-400'}`}>
                <Sparkles className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {aiMenuOpen && (
                   <motion.div 
                        initial={{ opacity: 0, scale: 0.8, x: -20, y: "-50%" }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: "-50%" }}
                        exit={{ opacity: 0, scale: 0.8, x: -20, y: "-50%" }}
                        className="absolute top-1/2 left-full ml-4 flex flex-col gap-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-3 rounded-2xl shadow-xl dark:shadow-2xl min-w-[220px] transition-colors"
                    >
                        {isGuest ? (
                            <div className="flex flex-col gap-3 p-1">
                                <span className="text-[11px] font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400">
                                    Unlock AI Power
                                </span>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-1 transition-colors">
                                    Live captions, meeting summaries, and auto-blur are reserved for authenticated users.
                                </p>
                                <button onClick={() => window.location.href = '/'} className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors active:scale-95">
                                    Log In or Sign Up
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 pt-1 pb-2 transition-colors">Active AI Tools</span>
                                
                                <button onClick={onToggleCaptions} className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left">
                                    <span>Live Captions</span>
                                    <div className={`w-8 h-4 rounded-full transition-colors relative ${captionsEnabled ? 'bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${captionsEnabled ? 'left-4.5 right-0.5' : 'left-0.5'}`} />
                                    </div>
                                </button>

                                <button onClick={onGenerateSummary} disabled={isSummarizing} className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left">
                                    <span>Meeting Summary</span>
                                    {isSummarizing ? (
                                        <Loader2 className="w-4 h-4 text-cyan-500 dark:text-cyan-400 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                                    )}
                                </button>
                                <button onClick={onToggleBlur} className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left">
                                    <span>Auto-Blur</span>
                                    <div className={`w-8 h-4 rounded-full transition-colors relative ${blurEnabled ? 'bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${blurEnabled ? 'left-4.5 right-0.5' : 'left-0.5'}`} />
                                    </div>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <div className="w-6 h-px bg-zinc-200 dark:bg-white/10 my-1 transition-colors" />

          <button onClick={onLeave} className="p-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white transition-all active:scale-90">
            <PhoneOff className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- MODULAR: REACTION ENGINE ---
interface ReactionEngineProps { 
  onReaction: (reactionData: { id: string; reactionId: string; name: string }) => void;
  visible: boolean;
}

export function ReactionEngine({ onReaction, visible }: ReactionEngineProps) {
  const { localParticipant } = useLocalParticipant();
  
  useDataChannel("reactions", (msg) => {
    const data = JSON.parse(new TextDecoder().decode(msg.payload));
    if (data.type === "REACTION") {
      onReaction({ id: data.id, reactionId: data.reactionId, name: data.senderName }); 
    }
  });

  const sendReaction = async (reactionId: string) => {
    const id = crypto.randomUUID();
    const senderName = localParticipant?.name || "Guest";
    const payload = new TextEncoder().encode(JSON.stringify({ type: "REACTION", reactionId, senderName, id }));
    
    if (localParticipant) {
        try {
            await localParticipant.publishData(payload, { reliable: true, topic: "reactions" });
        } catch (error) {
            console.error("Failed to broadcast reaction:", error);
        }
    }
    
    onReaction({ id, reactionId, name: senderName });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          id="reaction-engine"
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          className="fixed z-[100] bottom-6 left-1/2 flex flex-row gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-2 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl dark:shadow-2xl transition-colors"
        >
            {Object.keys(REACTION_MAP).map((reactionKey) => (
                <button 
                  key={reactionKey} 
                  onClick={() => sendReaction(reactionKey)} 
                  className="w-12 h-12 hover:scale-125 transition-transform cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center p-1"
                >
                    <Lottie 
                        animationData={REACTION_MAP[reactionKey]} 
                        loop={true} 
                        style={{ width: "100%", height: "100%" }} 
                    />
                </button>
            ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}