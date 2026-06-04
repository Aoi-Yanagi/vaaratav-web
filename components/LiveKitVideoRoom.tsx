"use client";

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
  useChat,
  LayoutContextProvider,
  useCreateLayoutContext,
  usePinnedTracks,
  VideoTrack,
  ParticipantName,
  TrackMutedIndicator,
  useParticipantContext
} from "@livekit/components-react";
import "@livekit/components-styles";
import { RoomEvent, Track, DataPacket_Kind, RemoteParticipant } from "livekit-client";

// Required Icons
import { 
  Sparkles, Ban, Copy, Download, PhoneOff 
} from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
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
  RoomSidebar,
  MinimalChatMessage,
  REACTION_MAP,
  Reaction
} from "./meeting/RoomModules";

interface LiveKitVideoRoomProps {
  roomCode: string;
  token: string;
  isHost?: boolean;
}

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
  const context = useContext(RoomAdminContext);
  
  let isHost = false;
  
  // 1. Check LiveKit native permissions safely without 'any'
  const perms = participant.permissions as unknown as { roomAdmin?: boolean };
  if (perms?.roomAdmin) isHost = true;
  
  // 2. Fallback: Force Host badge if they are the local host
  if (participant.isLocal && context?.isHost) isHost = true;

  const isMod = context?.moderators?.has(participant.identity);

  if (isHost) return <span className="ml-1.5 px-1.5 py-0.5 bg-indigo-500/90 text-white text-[10px] rounded font-bold uppercase tracking-wider shadow-sm">Host</span>;
  if (isMod) return <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-500/90 text-white text-[10px] rounded font-bold uppercase tracking-wider shadow-sm">Mod</span>;
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
      connect={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      options={{ adaptiveStream: true, dynacast: true }}
      data-lk-theme="default"
      className="relative w-full h-[100dvh] overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500"
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

  // Layout Context (Unlocks Native Pinning & Fullscreen)
  const layoutContext = useCreateLayoutContext();
  const pinnedTracks = usePinnedTracks(layoutContext);
  const screenShareTracks = tracks.filter(t => t.source === Track.Source.ScreenShare);
  const focusTrack = pinnedTracks.length > 0 ? pinnedTracks[0] : screenShareTracks.length > 0 ? screenShareTracks[0] : null;

  // States
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const transcriptVault = useRef<{ speaker: string, text: string }[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [blurEnabled, setBlurEnabled] = useState(false);

  // Communication States
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "people">("chat");
  const [chatInput, setChatInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Control Hiding Logic
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerControlVisibility = useCallback(() => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    // Only set the hide-timer if the sidebar is closed
    if (!isSidebarOpen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3000);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const initTimer = setTimeout(() => triggerControlVisibility(), 0);
    
    window.addEventListener('mousemove', triggerControlVisibility);
    window.addEventListener('touchstart', triggerControlVisibility);
    window.addEventListener('keydown', triggerControlVisibility);
    window.addEventListener('click', triggerControlVisibility);
    
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener('mousemove', triggerControlVisibility);
      window.removeEventListener('touchstart', triggerControlVisibility);
      window.removeEventListener('keydown', triggerControlVisibility);
      window.removeEventListener('click', triggerControlVisibility);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [triggerControlVisibility]);

  // Robust Chat via LiveKit Hook
  const { send: sendChatMessage, chatMessages } = useChat();

  const handleSendMessage = (msg: string) => {
    if (sendChatMessage) sendChatMessage(msg);
  };

  // Ref-based sidebar opening
  const previousMessagesLength = useRef(0);
  useEffect(() => {
    if (chatMessages.length > previousMessagesLength.current) {
       const latestMessage = chatMessages[chatMessages.length - 1];
       if (latestMessage.from?.identity !== localParticipant.identity && !isSidebarOpen) {
          requestAnimationFrame(() => {
            setSidebarOpen(true);
            setActiveTab("chat");
          });
       }
    }
    previousMessagesLength.current = chatMessages.length;
  }, [chatMessages, isSidebarOpen, localParticipant.identity]);

  // Authority & Meeting Lifecycle States
  const [moderators, setModerators] = useState<Set<string>>(new Set());
  const [endReason, setEndReason] = useState<"ended" | "kicked" | "banned" | null>(null);
  const [showEndModal, setShowEndModal] = useState(false);

  const isActualHost: boolean = initialIsHost === true || checkIsHost(localParticipant.permissions) === true;
  const isModerator = moderators.has(localParticipant.identity);
  const isHostPresent = isActualHost || participants.some(p => checkIsHost(p.permissions) === true);

  // Aggressive deduplication and fallback logic for the People Sidebar
  const uniqueParticipants = Array.from(new Map(participants.map(p => {
      p.name = p.name || p.identity || "Unknown User";
      return [p.identity, p];
  })).values());

  // --- DATA CHANNEL LISTENER ---
  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant, kind?: DataPacket_Kind, topic?: string) => {
      const decoder = new TextDecoder();
      
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
        
        if (cmd.action === "END_MEETING") { setEndReason("ended"); room.disconnect(); }
        if (cmd.action === "GRANT_MOD" && cmd.targetIdentity) setModerators(prev => new Set(prev).add(cmd.targetIdentity!));
        if (cmd.action === "REVOKE_MOD" && cmd.targetIdentity) setModerators(prev => { const s = new Set(prev); s.delete(cmd.targetIdentity!); return s; });

        if (cmd.targetIdentity === localParticipant.identity) {
          if (cmd.action === "MUTE") localParticipant.setMicrophoneEnabled(false);
          if (cmd.action === "KICK") { setEndReason("kicked"); room.disconnect(); }
          if (cmd.action === "BAN") { localStorage.setItem(`banned_${roomCode}`, "true"); setEndReason("banned"); room.disconnect(); }
        }
      }
    };
    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, localParticipant, roomCode]);


  // Actions
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    room.localParticipant.publishData(new TextEncoder().encode(localParticipant.name || "User"), { reliable: false, topic: "typing" });
  };

  const executeCommand = (targetIdentity: string, action: CommandPayload["action"]) => {
    const payload: CommandPayload = { action, targetIdentity };
    room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(payload)), { reliable: true, topic: "commands" });
  };

  // Pure programmatic pseudo-random for reaction tracking
  const reactionCounter = useRef(0);
  const handleAddReaction = useCallback((reactionData: { id: string; reactionId: string; name: string }) => {
     reactionCounter.current += 1;
     const startX = (reactionCounter.current % 60) - 30;
     const endX = startX + ((reactionCounter.current % 40) - 20);
     
     setReactions(prev => [...prev, { ...reactionData, startX, endX }]);
     setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionData.id)), 3000);
  }, []);

  const handleGenerateSummary = async () => {
    if (transcriptVault.current.length === 0) { alert("No words have been spoken yet!"); return; }
    setIsSummarizing(true);
    setSummaryResult(null);
    try {
        const response = await fetch('/api/summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript: transcriptVault.current }) });
        const data = await response.json();
        if (data.summary) setSummaryResult(data.summary);
        else alert("Error: " + data.error);
    } catch (error) { console.error("Failed to fetch summary:", error); } 
    finally { setIsSummarizing(false); }
  };

  const handleCopySummary = () => {
      if (summaryResult) {
          navigator.clipboard.writeText(summaryResult).catch(err => console.error("Copy failed", err));
      }
  };

  const handleDownloadNotes = () => {
      if (!summaryResult) return;
      const blob = new Blob([summaryResult], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Meeting_Notes_${roomCode}.txt`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleEndForAll = async () => {
    executeCommand("all", "END_MEETING");
    setEndReason("ended");
    room.disconnect();
    try { await fetch('/api/meetings/end', { method: 'POST', body: JSON.stringify({ meetingCode: roomCode }) }); } catch (e) { console.error(e) }
  };


  // --- LIFECYCLE SCREENS ---
  if (endReason) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-[100dvh] w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-6 z-50 absolute inset-0">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-10 rounded-[2rem] shadow-2xl flex flex-col items-center text-center max-w-md w-full">
           <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", endReason === "ended" ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400")}>
             {endReason === "ended" ? <Sparkles className="w-10 h-10" /> : <Ban className="w-10 h-10" />}
           </div>
           <h1 className="text-3xl font-bold mb-3 tracking-tight">{endReason === "kicked" ? "You were removed" : endReason === "banned" ? "You were banned" : "Meeting Ended"}</h1>
           <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
             {endReason === "kicked" ? "The host or a moderator has removed you from this session." : endReason === "banned" ? "You have been permanently banned from joining this room code." : "This video session has been concluded. Thank you for participating."}
           </p>
           <Button onClick={() => router.push('/dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 text-lg font-semibold shadow-lg">Return to Dashboard</Button>
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
      <div className="w-full h-full text-zinc-900 dark:text-zinc-100 font-sans relative z-10">
          
        {/* Floating Lottie Bubbles Layer */}
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
                            <Lottie animationData={REACTION_MAP[r.reactionId as keyof typeof REACTION_MAP]} loop={true} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        <div className="absolute inset-x-4 top-4 bottom-[110px] sm:inset-x-8 sm:top-6 sm:bottom-[110px] mx-auto max-w-7xl z-10 flex flex-col">
          <div className="w-full h-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm rounded-[2rem] border border-zinc-200 dark:border-white/10 shadow-xl dark:shadow-2xl p-2 sm:p-4 flex flex-col">
             
             {/* 🚨 FIX: Explicit VideoTrack rendering + Google Meet styling 🚨 */}
             <LayoutContextProvider value={layoutContext}>
               <div className="flex-1 w-full relative bg-black rounded-[1.5rem] overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-black">
                     {focusTrack ? (
                        <div className="flex flex-col sm:flex-row w-full h-full gap-2 p-2 relative bg-black">
                          {/* Main Pinned/Screen Share Area (Google Meet Style - Contained) */}
                          <div className="flex-1 w-full h-full relative rounded-xl overflow-hidden shadow-2xl bg-[#111] border border-white/5">
                            <ParticipantTile trackRef={focusTrack} className="w-full h-full absolute inset-0 bg-[#111]">
                               <VideoTrack className="absolute inset-0 w-full h-full object-contain" />
                               <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium shadow-lg z-20 flex items-center gap-2">
                                  <ParticipantMicIndicator />
                                  <ParticipantName />
                                  <ParticipantRoleBadge />
                               </div>
                               <ParticipantContextOverlay />
                            </ParticipantTile>
                          </div>
                          
                          {/* Carousel Side Area for other Participants */}
                          <div className="w-full sm:w-1/4 sm:max-w-[280px] h-32 sm:h-full flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto sm:pr-1 pb-2 sm:pb-0">
                            {tracks.filter(t => t.participant.identity !== focusTrack.participant.identity || t.source !== focusTrack.source).map((t) => (
                               <div key={`${t.participant.identity}-${t.source}`} className="w-40 sm:w-full aspect-video rounded-xl overflow-hidden shadow-lg bg-[#111] shrink-0 relative border border-white/5">
                                  <ParticipantTile trackRef={t} className="w-full h-full absolute inset-0 bg-[#111]">
                                     <VideoTrack className="absolute inset-0 w-full h-full object-cover" />
                                     <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white text-[10px] font-medium shadow-lg z-20 flex items-center gap-1.5">
                                        <ParticipantMicIndicator />
                                        <ParticipantName />
                                     </div>
                                     <ParticipantContextOverlay />
                                  </ParticipantTile>
                               </div>
                            ))}
                          </div>
                        </div>
                     ) : (
                        <div className="w-full h-full p-2 bg-black">
                           <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
                             {/* Traditional Google Meet Grid styling */}
                             <ParticipantTile className="relative w-full h-full overflow-hidden rounded-xl bg-[#111] shadow-lg border border-white/5">
                                <VideoTrack className="absolute inset-0 w-full h-full object-contain" />
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium shadow-lg z-20 flex items-center gap-2">
                                   <ParticipantMicIndicator />
                                   <ParticipantName />
                                   <ParticipantRoleBadge />
                                </div>
                                <ParticipantContextOverlay />
                             </ParticipantTile>
                           </GridLayout>
                        </div>
                     )}
                  </div>
                  <RoomAudioRenderer />
               </div>
             </LayoutContextProvider>

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

        {/* SIDEBAR INTEGRATION */}
        <RoomSidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            uniqueParticipants={uniqueParticipants} 
            chatMessages={chatMessages as MinimalChatMessage[]} 
            sendChatMessage={handleSendMessage} 
            chatInput={chatInput} 
            setChatInput={setChatInput} 
            handleTyping={handleTyping} 
            typingString={typingString}        
        />

        {/* AI Summary Modal */}
        <AnimatePresence>
          {summaryResult && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="absolute inset-0 z-[110] flex items-center justify-center p-4 sm:p-8 pointer-events-auto">
                  <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-[2rem] transition-colors" onClick={() => setSummaryResult(null)} />
                  <div className="relative w-full max-w-2xl max-h-full overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col gap-4 transition-colors">
                      <div className="flex justify-between items-start">
                          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-500 flex items-center gap-2"><Sparkles className="w-5 h-5" /> AI Meeting Notes</h2>
                          <button onClick={() => setSummaryResult(null)} className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-full"><PhoneOff className="w-4 h-4 text-zinc-500" /></button>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{summaryResult}</div>
                      <div className="flex justify-end gap-3 border-t border-zinc-200 dark:border-white/10 pt-4 shrink-0 mt-4">
                          <Button onClick={handleCopySummary} variant="outline" className="h-10 px-4 rounded-xl border-zinc-200 dark:border-zinc-800"><Copy className="w-4 h-4 mr-2" /> Copy</Button>
                          <Button onClick={handleDownloadNotes} className="h-10 px-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"><Download className="w-4 h-4 mr-2" /> Download</Button>
                      </div>
                  </div>
              </motion.div>
          )}
        </AnimatePresence>
               
        {/* FADING MODULAR CONTROLS */}
        <div className={cn("transition-opacity duration-500 z-[100] fixed inset-0 pointer-events-none", isControlsVisible ? "opacity-100" : "opacity-0")}>
           <div className="pointer-events-auto">
             <ReactionEngine onReaction={handleAddReaction} visible={true} />
             <FloatingControlBar 
                 visible={true} isGuest={false} 
                 captionsEnabled={captionsEnabled} onToggleCaptions={() => setCaptionsEnabled(!captionsEnabled)}
                 onGenerateSummary={handleGenerateSummary} isSummarizing={isSummarizing}
                 blurEnabled={blurEnabled} onToggleBlur={() => setBlurEnabled(!blurEnabled)}
                 onToggleChat={() => setSidebarOpen(prev => !prev)} isChatOpen={isSidebarOpen}
                 onLeave={() => {
                   if (isActualHost) {
                     setShowEndModal(true);
                   } else {
                     setEndReason("ended");
                     room.disconnect();
                   }
                 }}
             />
           </div>
        </div>

      </div>
    </RoomAdminContext.Provider>
  );
}