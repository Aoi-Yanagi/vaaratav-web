"use client";

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import { 
  useParticipantContext, 
  useRoomContext, 
  useLocalParticipant, 
  useDataChannel 
} from "@livekit/components-react";
import { RoomEvent, TranscriptionSegment, Participant, LocalVideoTrack } from "livekit-client";
import { 
  Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, PhoneOff, 
  Sparkles, MessageSquare, MoreVertical, Ban, LogOut, ShieldMinus, ShieldAlert 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { BackgroundProcessor } from '@livekit/track-processors';

// Lottie Assets
import heartAnim from "../../app/public/lottie/heart.json";
import fireAnim from "../../app/public/lottie/fire.json";
import partyAnim from "../../app/public/lottie/party.json";

export const REACTION_MAP: Record<string, object> = {
  "heart": heartAnim,
  "fire": fireAnim,
  "party": partyAnim,
};

// --- SHARED TYPES & CONTEXT ---
export interface CommandPayload { 
  action: "KICK" | "BAN" | "MUTE" | "GRANT_MOD" | "REVOKE_MOD" | "END_MEETING"; 
  targetIdentity?: string; 
}

export const checkIsHost = (permissions: unknown): boolean => {
  return (permissions as { roomAdmin?: boolean })?.roomAdmin === true;
};

export const RoomAdminContext = createContext<{
  isHost: boolean;
  isModerator: boolean;
  moderators: Set<string>;
  executeCommand: (targetId: string, action: CommandPayload["action"]) => void;
} | null>(null);


// --- 1. 3-DOT CONTEXT MENU ON VIDEO TILE ---
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


// --- 2. LIVE AI CAPTIONS OVERLAY ---
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
            initial={{ opacity: 0, y: 15, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 15, x: "-50%" }}
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


// --- 3. BACKGROUND TRANSCRIPT VAULT ---
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


// --- 4. CUSTOM FLOATING CONTROL BAR ---
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
          initial={{ opacity: 0, scale: 0.9, y: "-50%" }} animate={{ opacity: 1, scale: 1, y: "-50%" }} exit={{ opacity: 0, scale: 0.9, y: "-50%" }}
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
                        initial={{ opacity: 0, scale: 0.8, x: -20, y: "-50%" }} animate={{ opacity: 1, scale: 1, x: 0, y: "-50%" }} exit={{ opacity: 0, scale: 0.8, x: -20, y: "-50%" }}
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


// --- 5. REACTION ENGINE ---
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
          initial={{ opacity: 0, y: 20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 20, x: "-50%" }}
          className="fixed z-[100] bottom-6 left-1/2 flex flex-row gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl p-2 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-xl dark:shadow-2xl transition-colors"
        >
            {Object.keys(REACTION_MAP).map((reactionKey) => (
                <button 
                  key={reactionKey} 
                  onClick={() => sendReaction(reactionKey)} 
                  className="w-12 h-12 hover:scale-125 transition-transform cursor-pointer rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 flex items-center justify-center p-1"
                >
                    <Lottie animationData={REACTION_MAP[reactionKey]} loop={true} style={{ width: "100%", height: "100%" }} />
                </button>
            ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}