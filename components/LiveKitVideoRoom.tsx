"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import React from "react";
import { 
  LiveKitRoom, 
  VideoConference, 
  RoomAudioRenderer, 
  useDataChannel, 
  useLocalParticipant,
  useRoomContext
} from "@livekit/components-react";
import "@livekit/components-styles";
import { LocalVideoTrack, RoomEvent, TranscriptionSegment, Participant } from "livekit-client";
import { Loader2, Mic, MicOff, Video as VideoIcon, VideoOff, MonitorUp, PhoneOff, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "lottie-react";
import { BackgroundProcessor } from '@livekit/track-processors';

// Modern ES6 Static Imports for Lottie JSON Files
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
  user?: { name?: string | null };
}

type Reaction = { id: string; reactionId: string; name: string; startX: number; endX: number };

// --- MAIN AUTHENTICATED ROOM COMPONENT ---
export function LiveKitVideoRoom({ roomCode, user }: LiveKitVideoRoomProps) {
  const [token, setToken] = useState("");
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showMobileControls, setShowMobileControls] = useState(true);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const [myName] = useState(() => user?.name || `Host-${Math.floor(Math.random() * 1000)}`);
  //The Transcript Vault (Persists across renders without causing UI lag)
  const transcriptVault = React.useRef<{ speaker: string, text: string }[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [blurEnabled, setBlurEnabled] = useState(false);
  // NEW: The Function that calls our API
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
        if (data.summary) {
            setSummaryResult(data.summary);
        } else {
            alert("Error: " + data.error);
        }
    } catch (error) {
        console.error("Failed to fetch summary:", error);
    } finally {
        setIsSummarizing(false);
    }
  };

  // Hydration Guard: Blocks initialization until the client DOM layout is stable
  useEffect(() => {
    // FIX: Wrapped in a timeout callback to satisfy strict synchronous render rules
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const addReactionToScreen = useCallback((reactionData: {id: string, reactionId: string, name: string}) => {
    const startX = Math.floor(Math.random() * 60) - 30;
    const endX = startX + (Math.floor(Math.random() * 40) - 20);
    setReactions(prev => [...prev, { ...reactionData, startX, endX }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== reactionData.id)), 3000);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    const fetchToken = async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${roomCode}&username=${myName}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error("Failed to fetch LiveKit token", e);
      }
    };
    fetchToken();
  }, [roomCode, myName, isMounted]);
  
  useEffect(() => {
    const handleScreenTap = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'video') return;
      if (target.closest('#custom-control-bar') || target.closest('#reaction-engine')) return;
      if (window.innerWidth < 640) {
        setShowMobileControls(prev => !prev);
      }
    };
    window.addEventListener('pointerup', handleScreenTap);
    return () => window.removeEventListener('pointerup', handleScreenTap);
  }, []);

  if (!isMounted || token === "") {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] bg-zinc-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-400 font-medium">Establishing secure media tunnel...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={true} 
      audio={true} 
      connect={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      options={{ adaptiveStream: true, dynacast: true }}
      onDisconnected={() => (window.location.href = "/")}
      data-lk-theme="default"
      className="w-full h-[100dvh] overflow-hidden bg-zinc-950"
    >
      <div className="flex flex-col items-center w-full h-full text-zinc-100 font-sans relative">
        
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
                        <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full mb-1 shadow-lg border border-white/10 whitespace-nowrap">
                            {r.name}
                        </div>
                        <div className="w-24 h-24 drop-shadow-2xl">
                            <Lottie animationData={REACTION_MAP[r.reactionId]} loop={true} />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Bulletproof Layout-Sizing Grid Container */}
        <div className="flex-1 flex flex-col w-full max-w-7xl mx-auto p-4 sm:p-6 z-10 min-h-0 pb-32 sm:pb-24 mt-6">
          <div className="flex-1 flex flex-col w-full bg-zinc-900/50 backdrop-blur-sm rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative">
             
             {/* Switched to a pure flex arrangement to prevent any 0px layout collapse */}
             <div className="flex-1 w-full h-full flex flex-col relative">
                <VideoConference className="w-full h-full flex-1" />
                <RoomAudioRenderer />
             </div>

             {/* Live Caption Core Subscription Layer */}
             <CaptionsOverlay enabled={captionsEnabled} />
             <TranscriptAccumulator vaultRef={transcriptVault} />

          </div>
        </div>
        <AnimatePresence>
                {summaryResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 pointer-events-auto"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[2rem]" onClick={() => setSummaryResult(null)} />
                        
                        <div className="relative w-full max-w-2xl max-h-full overflow-y-auto bg-zinc-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-cyan-400" /> AI Meeting Notes
                                </h2>
                                <button onClick={() => setSummaryResult(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                    <PhoneOff className="w-4 h-4 text-zinc-400" />
                                </button>
                            </div>
                            
                            <div className="text-zinc-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
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
        />
      </div>
    </LiveKitRoom>
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
      
      // Stitch together current phrase segments
      const fullPhrase = segments.map((s) => s.text).join(" ");
      
      if (fullPhrase.trim().length > 0) {
        const identity = participant.name || participant.identity;
        setCaptionText(`${identity}: "${fullPhrase}"`);
      }
    };

    // Attach native LiveKit data track transcription handler
    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    
    return () => {
      room.off(RoomEvent.TranscriptionReceived, handleTranscription);
    };
  }, [room, enabled]);

  // Reset text prompt whenever captions are toggled back on
 useEffect(() => {
    if (enabled) {
      // FIX: Wrapped in a timeout callback to prevent synchronous effect cascade
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
            <span className="bg-black/85 backdrop-blur-xl text-white text-sm sm:text-base font-medium px-6 py-3.5 rounded-2xl leading-relaxed shadow-2xl border border-white/10 inline-block max-w-full break-words">
               <Sparkles className="w-4 h-4 inline text-cyan-400 mr-2 -mt-1 animate-pulse" />
               {captionText}
            </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
// --- MODULAR: BACKGROUND TRANSCRIPT VAULT ---
// This silently collects all spoken words for the AI Summary later
export function TranscriptAccumulator({ 
  vaultRef 
}: { 
  vaultRef: React.MutableRefObject<{ speaker: string, text: string }[]> 
}) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const handleTranscription = (segments: TranscriptionSegment[], participant?: Participant) => {
      if (!participant) return;
      const fullPhrase = segments.map((s) => s.text).join(" ");
      
      if (fullPhrase.trim().length > 0) {
        const identity = participant.name || participant.identity;
        // Save the sentence to our vault!
        vaultRef.current.push({ speaker: identity, text: fullPhrase });
      }
    };

    room.on(RoomEvent.TranscriptionReceived, handleTranscription);
    return () => { room.off(RoomEvent.TranscriptionReceived, handleTranscription); };
  }, [room, vaultRef]);

  return null; // This component is invisible!
}

// --- MODULAR: CUSTOM FLOATING CONTROL BAR ---
interface FloatingControlBarProps {
  visible: boolean;
  isGuest?: boolean;
  captionsEnabled?: boolean;
  onToggleCaptions?: () => void;
  onGenerateSummary?: () => void;
  isSummarizing?: boolean;
  // NEW: Auto-Blur Props
  blurEnabled?: boolean;
  onToggleBlur?: () => void;
}

export function FloatingControlBar({ 
    visible, 
    isGuest = false, 
    captionsEnabled = false, 
    onToggleCaptions,
    onGenerateSummary,
    isSummarizing = false,
    blurEnabled = false,
    onToggleBlur
}: FloatingControlBarProps) {
  // NEW: Destructure `cameraTrack` so we can intercept the video feed!
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, cameraTrack } = useLocalParticipant();
  const room = useRoomContext();
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  
  // NEW: Ref to hold the WebAssembly Processor so we don't recreate it every render
  const processorRef = useRef<ReturnType<typeof BackgroundProcessor> | null>(null);

  // Background Blur Effect Pipeline
  useEffect(() => {
    // Only attempt to blur if the camera is actually on and publishing a track
    if (!cameraTrack?.track) return;
    
    // Typecast to bypass strict WebRTC typing in Next.js
    const track = cameraTrack.track as LocalVideoTrack;

    const applyBlur = async () => {
      try {
        if (blurEnabled) {
          if (!processorRef.current) {
            // Initialize the Blur Processor (15 is a strong, cinematic blur)
            processorRef.current = BackgroundProcessor({ mode: 'background-blur', blurRadius: 15 });
          }
          await track.setProcessor(processorRef.current);
        } else {
          if (processorRef.current) {
            // Remove the processor to return to the raw camera feed
            await track.stopProcessor();
          }
        }
      } catch (e) {
        console.error("Failed to toggle background blur", e);
      }
    };

    applyBlur();
  }, [blurEnabled, cameraTrack]);

  const toggleMic = () => localParticipant?.setMicrophoneEnabled(!isMicrophoneEnabled);
  const toggleCam = () => localParticipant?.setCameraEnabled(!isCameraEnabled);
  const toggleScreen = () => localParticipant?.setScreenShareEnabled(!isScreenShareEnabled);
  const leaveRoom = () => room.disconnect();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div 
          id="custom-control-bar"
          initial={{ opacity: 0, scale: 0.9, y: "-50%" }}
          animate={{ opacity: 1, scale: 1, y: "-50%" }}
          exit={{ opacity: 0, scale: 0.9, y: "-50%" }}
          className="fixed z-[100] top-1/2 left-4 flex flex-col items-center gap-3 p-2 bg-zinc-950/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl opacity-30 hover:opacity-100 transition-opacity duration-300"
        >
          <button onClick={toggleMic} className={`p-3.5 rounded-xl transition-all active:scale-90 ${isMicrophoneEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white'}`}>
            {isMicrophoneEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button onClick={toggleCam} className={`p-3.5 rounded-xl transition-all active:scale-90 ${isCameraEnabled ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white'}`}>
            {isCameraEnabled ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button onClick={toggleScreen} className={`p-3.5 rounded-xl transition-all active:scale-90 hidden sm:block ${isScreenShareEnabled ? 'bg-indigo-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
            <MonitorUp className="w-5 h-5" />
          </button>

          <div className="w-6 h-px bg-white/10 my-1" />

          <div className="relative">
            <button onClick={() => setAiMenuOpen(!aiMenuOpen)} className={`p-3.5 rounded-xl transition-all active:scale-90 ${aiMenuOpen ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-white/10 hover:bg-white/20 text-cyan-400'}`}>
                <Sparkles className="w-5 h-5" />
            </button>

            <AnimatePresence>
                {aiMenuOpen && (
                   <motion.div 
                        initial={{ opacity: 0, scale: 0.8, x: -20, y: "-50%" }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: "-50%" }}
                        exit={{ opacity: 0, scale: 0.8, x: -20, y: "-50%" }}
                        className="absolute top-1/2 left-full ml-4 flex flex-col gap-2 bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl min-w-[220px]"
                    >
                        {isGuest ? (
                            <div className="flex flex-col gap-3 p-1">
                                <span className="text-[11px] font-extrabold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                                    Unlock AI Power
                                </span>
                                <p className="text-xs text-zinc-400 leading-relaxed mb-1">
                                    Live captions, meeting summaries, and auto-blur are reserved for authenticated users.
                                </p>
                                <button onClick={() => window.location.href = '/'} className="w-full py-2 bg-white text-black rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors active:scale-95">
                                    Log In or Sign Up
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 pt-1 pb-2">Active AI Tools</span>
                                
                                <button onClick={onToggleCaptions} className="flex items-center justify-between text-sm text-zinc-300 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left">
                                    <span>Live Captions</span>
                                    <div className={`w-8 h-4 rounded-full transition-colors relative ${captionsEnabled ? 'bg-cyan-500' : 'bg-zinc-700'}`}>
                                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${captionsEnabled ? 'left-4.5 right-0.5' : 'left-0.5'}`} />
                                    </div>
                                </button>

                                <button 
        onClick={onGenerateSummary}
        disabled={isSummarizing}
        className="flex items-center justify-between text-sm text-zinc-300 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left"
    >
        <span>Meeting Summary</span>
        {isSummarizing ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
        ) : (
            <Sparkles className="w-4 h-4 text-zinc-500" />
        )}
    </button>
                                <button 
        onClick={onToggleBlur} 
        className="flex items-center justify-between text-sm text-zinc-300 hover:text-white hover:bg-white/10 px-3 py-2.5 rounded-lg transition-colors w-full text-left"
    >
        <span>Auto-Blur</span>
        <div className={`w-8 h-4 rounded-full transition-colors relative ${blurEnabled ? 'bg-cyan-500' : 'bg-zinc-700'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${blurEnabled ? 'left-4.5 right-0.5' : 'left-0.5'}`} />
        </div>
    </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <div className="w-6 h-px bg-white/10 my-1" />

          <button onClick={leaveRoom} className="p-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-500 hover:text-white transition-all active:scale-90">
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
          className="fixed z-[100] bottom-6 left-1/2 flex flex-row gap-2 bg-zinc-900/90 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl"
        >
            {Object.keys(REACTION_MAP).map((reactionKey) => (
                <button 
                  key={reactionKey} 
                  onClick={() => sendReaction(reactionKey)} 
                  className="w-12 h-12 hover:scale-125 transition-transform cursor-pointer rounded-lg hover:bg-white/5 flex items-center justify-center p-1"
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