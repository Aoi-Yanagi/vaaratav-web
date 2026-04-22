"use client";

import { motion } from "framer-motion";

export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ 
        y: "-100vh", 
        opacity: 0, 
        transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
      }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black overflow-hidden"
    >
      <div className="relative flex flex-col items-center">
        {/* Cinematic Background Glow */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0.15 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
          className="absolute w-72 h-72 bg-indigo-500 rounded-full blur-[120px] pointer-events-none"
        />

        {/* Artistic Text Reveal */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "0.5em", filter: "blur(10px)" }}
          animate={{ opacity: 1, letterSpacing: "0.2em", filter: "blur(0px)" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-white relative z-10"
        >
          VaartaV
        </motion.h1>

        {/* Progress Line that triggers the exit when finished */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 2.2, ease: "easeInOut", delay: 0.2 }}
          onAnimationComplete={onComplete}
          className="h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent mt-6 w-48 relative z-10"
        />
      </div>
    </motion.div>
  );
}