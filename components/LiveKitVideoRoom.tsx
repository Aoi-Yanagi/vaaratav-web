"use client";

// 痩 FIX: Explicitly added useContext to imports
import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { 
  LiveKitRoom, 
  GridLayout, 
  ParticipantTile,
  RoomAudioRenderer, 
  useLocalParticipant,
  useParticipants,
  useTracks,
  useRoomContext,
  VideoTrack,          
  ParticipantName,     
  TrackMutedIndicator,
  useParticipantContext
} from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomEvent, Track, DataPacket_Kind, RemoteParticipant } from "livekit-client";

// 痩 FIX: Kept PhoneOff import active to be used in UI below
import { Sparkles, Send, X, Ban, PhoneOff, Copy, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- IMPORTING THE OPTIMIZED MODULES ---
import { 
  RoomAdminContext, 
  checkIsHost, 
  CommandPayload, 
  ParticipantContextOverlay,
  CaptionsOverlay,
  TranscriptAccumulator,
  FloatingControlBar,
  ReactionEngine,
  REACTION_MAP
} from "./meeting/RoomModules";

interface LiveKitVideoRoomProps {
  roomCode: string;
  token: string;
  isHost?: boolean;
}

type Reaction = { id: string; reactionId: string; name: string; startX: number; endX: number };
interface ChatMessage { sender: string; text: string; }

// --- HELPERS FOR TILES ---
function ParticipantMicIndicator() {
  const participant = useParticipantContext();
  return (
    <TrackMutedIndicator 
      trackRef={{ participant, source: Track.Source.Microphone }} 
      show="muted" 
      className="w-3.5 h-3.5 text-red-500" 
    />
  );
}

function ParticipantRoleBadge() {
  const participant = useParticipantContext();
  const { moderators } = useContext(RoomAdminContext)!;
  
  let isHost = false;
  try {
    if (participant.metadata) {
      const meta = JSON.parse(participant.metadata);
      if (meta.isHost === true) isHost = true;
    }
  } catch {}

  // 痩 FIX: Safe cast to avoid TS "roomAdmin does not exist on ParticipantPermission" error
  const perms = participant.permissions as unknown as { roomAdmin?: boolean };
  if (perms?.roomAdmin) isHost = true;

  const isMod = moderators.has(participant.identity);

  if (isHost) return <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-500/90 text-white text-[9px] rounded font-bold uppercase tracking-wider">Host</span>;
  if (isMod) return <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500/90 text-white text-[9px] rounded font-bold uppercase tracking-wider">Mod</span>;
  return null;
}

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
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      className="h-full w-full"
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

  // States
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showMobileControls, setShowMobileControls] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [blurEnabled, setBlurEnabled] = useState(false);
  
  const transcriptVault = useRef<{ speaker: string, text: string }[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "people">("chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const [moderators, setModerators] = useState<Set<string>>(new Set());
  const [endReason, setEndReason] = useState<"ended" | "kicked" | "banned" | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);

  const isActualHost: boolean = initialIsHost === true || checkIsHost(localParticipant) === true;
  const isModerator = moderators.has(localParticipant.identity);
  
  const isHostPresent = participants.some((p) => {
    try {
      if (!p.metadata) return false;
      const meta = JSON.parse(p.metadata);
      return meta.isHost === true;
    } catch {
      return false;
    }
  });

  // Keep all participants synced with the latest moderator list
  useEffect(() => {
    if (isActualHost) {
        const payload: CommandPayload = { action: "SYNC_MODS", modList: Array.from(moderators) };
        room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true, topic: "commands" });
    }
  }, [participants.length, moderators, isActualHost, room.localParticipant]);

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
        
        if (cmd.action === "SYNC_MODS" && cmd.modList) {
           setModerators(new Set(cmd.modList));
        }
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

  useEffect(() => {
    const handleScreenTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'video') return;
      if (target.closest('#custom-control-bar') || target.closest('#reaction-engine') || target.closest('#sidebar-panel')) return;
      if (window.innerWidth < 640) setShowMobileControls(prev => !prev);
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
    } catch (error) { 
        console.error("Failed to fetch summary:", error); 
    } finally { 
        setIsSummarizing(false); 
    }
  };

  const handleCopySummary = () => {
    if (summaryResult) {
        navigator.clipboard.writeText(summaryResult);
        alert("Summary copied to clipboard!");
    }
  };

  const handleDownloadNotes = () => {
    if (!summaryResult) return;
    const blob = new Blob([summaryResult], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Meeting_Summary_${roomCode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    } catch { 
      console.error("Failed to end meeting on the server."); 
    }
  };

  // --- LIFECYCLE SCREENS ---
  if (endReason) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-[100dvh] w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 z-50 absolute inset-0">
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
      <div className="flex flex-col items-center justify-center flex-1 h-[100dvh] w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white z-50 absolute inset-0">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-2xl font-bold mb-2">Waiting for the Host...</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">The meeting will begin once the host arrives.</p>
        <Button onClick={() => router.push('/dashboard')} variant="outline" className="rounded-full px-8 h-12 border-zinc-200 dark:border-zinc-800">
          Cancel & Leave
        </Button>
      </div>
    );
  }

  const typingArray = Array.from(typingUsers).filter(n => n !== localParticipant.name);
  let typingString = "";
  if (typingArray.length === 1) typingString = `${typingArray[0]} is typing...`;
  else if (typingArray.length > 1) typingString = `${typingArray[0]} and ${typingArray.length - 1} others are typing...`;

  return (
    <RoomAdminContext.Provider value={{ isHost: isActualHost, isModerator, moderators, executeCommand }}>
      <div className="w-full h-full text-zinc-900 dark:text-zinc-100 font-sans relative z-10">
          
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

        <div className="absolute inset-x-4 top-4 bottom-[110px] sm:inset-x-8 sm:top-6 sm:bottom-[110px] mx-auto max-w-7xl z-10 flex flex-col">
          <div className="w-full h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-[2rem] border border-zinc-200 dark:border-white/10 shadow-xl dark:shadow-2xl p-2 sm:p-4 flex flex-col">
             
             <div className="flex-1 w-full relative bg-black rounded-[1.5rem] overflow-hidden shadow-inner">
                <div className="absolute inset-0">
                   <GridLayout tracks={tracks} style={{ width: '100%', height: '100%' }}>
                     <ParticipantTile className="relative w-full h-full overflow-hidden rounded-[1rem] bg-zinc-900 shadow-lg border border-white/5">
                        
                        <VideoTrack className="absolute inset-0 w-full h-full object-cover" />
                        
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium shadow-lg z-20 flex items-center gap-2">
                           <ParticipantMicIndicator />
                           <ParticipantName />
                           <ParticipantRoleBadge />
                        </div>

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
                   
                   {/* 痩 FIX: Using the PhoneOff icon to solve the unused import warning while improving the UI */}
                   <Button onClick={() => { setEndReason("ended"); room.disconnect(); }} variant="outline" className="w-full h-12 rounded-xl text-md border-zinc-200 dark:border-zinc-800">
                      <PhoneOff className="w-4 h-4 mr-2" /> Just Leave Meeting
                   </Button>

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
                <button onClick={() => setActiveTab("people")} className={cn("flex-1 py-4 font-bold text-sm", activeTab === "people" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-500" : "text-zinc-500")}>People</button>
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
                <div className="flex-1 p-5 overflow-y-auto text-zinc-500 text-sm text-center mt-10">
                    Check your participants tab.
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
                  
                  <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col transition-colors">
                      
                      <div className="flex justify-between items-start mb-4 shrink-0">
                          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500 dark:from-cyan-400 dark:to-indigo-400 flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-cyan-500 dark:text-cyan-400" /> AI Meeting Notes
                          </h2>
                          <button onClick={() => setSummaryResult(null)} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full transition-colors">
                              <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                          </button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap transition-colors">
                          {summaryResult}
                      </div>

                      <div className="flex justify-end gap-3 mt-6 border-t border-zinc-200 dark:border-white/10 pt-4 shrink-0">
                          <Button onClick={handleCopySummary} variant="outline" className="h-10 px-4 rounded-xl border-zinc-200 dark:border-zinc-800">
                              <Copy className="w-4 h-4 mr-2" /> Copy Text
                          </Button>
                          <Button onClick={handleDownloadNotes} className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                              <Download className="w-4 h-4 mr-2" /> Download Notes
                          </Button>
                      </div>

                  </div>
              </motion.div>
          )}
        </AnimatePresence>
               
        {/* Modular Systems */}
        <ReactionEngine onReaction={addReactionToScreen} visible={showMobileControls} />
        
       <FloatingControlBar 
          visible={showMobileControls} 
          
          captionsEnabled={captionsEnabled}
          onToggleCaptions={() => setCaptionsEnabled(!captionsEnabled)}
          
          blurEnabled={blurEnabled}
          onToggleBlur={() => setBlurEnabled(!blurEnabled)}
          
          onGenerateSummary={handleGenerateSummary}
          isSummarizing={isSummarizing}
          
          onToggleChat={() => setSidebarOpen(!isSidebarOpen)}
          isChatOpen={isSidebarOpen}
          onLeave={handleLeaveClick}
        />
      </div>
    </RoomAdminContext.Provider>
  );
}