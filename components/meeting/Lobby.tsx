"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsDialog } from "./SettingsDialog";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Lobby() {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const startPreview = async () => {
      if (isCamOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
          console.log("Media access denied or not available in preview mode.");
        }
      } else {
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
      }
    };
    startPreview();
  }, [isCamOn]);

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white relative flex items-center justify-center p-6 overflow-hidden selection:bg-indigo-500/30 transition-colors duration-500">
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-to-r from-indigo-600/20 via-cyan-600/20 to-purple-600/20 blur-[120px] rounded-full pointer-events-none z-0" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="relative w-full aspect-video bg-white/50 dark:bg-neutral-900/50 rounded-3xl border border-zinc-200 dark:border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl shadow-indigo-500/10 group transition-colors"
        >
          {isCamOn ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100/80 dark:bg-neutral-950/80 transition-colors">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-5xl font-bold shadow-[0_0_30px_rgba(99,102,241,0.4)] mb-6 text-white">
                Y
              </div>
              <p className="text-zinc-500 dark:text-gray-400 font-medium tracking-wide">Camera is off</p>
            </div>
          )}

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 dark:bg-black/60 backdrop-blur-xl px-4 py-3 rounded-full border border-zinc-200 dark:border-white/10 shadow-2xl transition-all duration-300 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={cn("p-3 rounded-full transition-all duration-300", isMicOn ? "bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-800 dark:text-white" : "bg-red-500/20 text-red-500 hover:bg-red-500/30")}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-zinc-300 dark:bg-white/10 mx-1 transition-colors" />
            <button
              onClick={() => setIsCamOn(!isCamOn)}
              className={cn("p-3 rounded-full transition-all duration-300", isCamOn ? "bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 text-zinc-800 dark:text-white" : "bg-red-500/20 text-red-500 hover:bg-red-500/30")}
            >
              {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="absolute top-6 left-6 bg-white/80 dark:bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-xs font-medium border border-zinc-200 dark:border-white/5 flex items-center gap-2 transition-colors">
            {isMicOn ? (
              <>
                <div className="flex gap-0.5 items-center h-3">
                  <motion.div animate={{ height: ["4px", "12px", "4px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-green-500 dark:bg-green-400 rounded-full" />
                  <motion.div animate={{ height: ["8px", "4px", "8px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-green-500 dark:bg-green-400 rounded-full" />
                  <motion.div animate={{ height: ["4px", "10px", "4px"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-green-500 dark:bg-green-400 rounded-full" />
                </div>
                <span className="text-zinc-700 dark:text-gray-200">Audio ready</span>
              </>
            ) : (
              <>
                 <div className="w-2 h-2 rounded-full bg-red-500" />
                 <span className="text-red-500 dark:text-red-400">Mic muted</span>
              </>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4, delay: 0.1 }}
          className="w-full max-w-md mx-auto lg:mx-0 space-y-8"
        >
          <div className="text-center lg:text-left">
             <motion.div 
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
               className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-sm font-medium mb-6 transition-colors"
             >
               <Sparkles className="w-4 h-4" /> Room is ready
             </motion.div>
             <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-3">
               Ready to <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500 dark:from-indigo-400 dark:to-cyan-400">Join?</span>
             </h2>
             <p className="text-zinc-500 dark:text-gray-400 text-lg transition-colors">Check your audio and video settings before entering the meeting.</p>
          </div>

          <div className="space-y-6 bg-white/50 dark:bg-neutral-900/30 p-6 rounded-3xl border border-zinc-200 dark:border-white/5 backdrop-blur-md transition-colors">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-zinc-700 dark:text-gray-300 ml-1 transition-colors">Display Name</Label>
              <Input 
                id="name" 
                placeholder="Enter your name" 
                className="bg-zinc-100/50 dark:bg-black/50 border-zinc-200 dark:border-white/10 h-14 rounded-2xl px-5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-600 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 transition-all text-lg" 
              />
            </div>

            <div className="flex gap-3 pt-2">
               <Button className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-semibold rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)] dark:shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] dark:hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-0.5">
                 Join Meeting
               </Button>
               <div className="h-14 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/10 rounded-2xl flex items-center justify-center px-4 transition-colors cursor-pointer">
                 <SettingsDialog />
               </div>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}