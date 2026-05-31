"use client";

import { motion } from "framer-motion";

export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  // Material Design 3 standard easing curve (Emphasized Decelerate)
  // FIX: Added `as const` to tell TypeScript this is a strict tuple of 4 numbers
  const materialEase = [0.05, 0.7, 0.1, 1] as const;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-black overflow-hidden"
      // Material-style lift and fade exit
      exit={{ 
        opacity: 0, 
        y: -50,
        filter: "blur(10px)", 
        transition: { duration: 0.6, ease: materialEase } 
      }}
    >
      {/* Expanding Ripple Background (Material You style) */}
      <motion.div
        initial={{ scale: 0, opacity: 1 }}
        animate={{ scale: 15, opacity: 0 }}
        transition={{ duration: 1.5, ease: materialEase }}
        className="absolute w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full pointer-events-none"
      />

      <div className="overflow-hidden pb-4 relative z-10 flex flex-col items-center">
        {/* Logo Mark Reveal */}
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: materialEase }}
          className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl mb-6 shadow-indigo-500/20"
        >
          <span className="text-white font-extrabold text-3xl tracking-tighter">V</span>
        </motion.div>

        {/* Text Reveal */}
        <motion.h1
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: materialEase }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white"
        >
          VaartaV.
        </motion.h1>

        {/* Material-style morphing progress indicator */}
        <motion.div
           initial={{ width: 0, opacity: 0 }}
           animate={{ width: 120, opacity: 1 }}
           transition={{ duration: 0.8, delay: 0.3, ease: materialEase }}
           className="h-1.5 bg-indigo-600 mt-8 rounded-full overflow-hidden"
        >
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1, delay: 0.5, ease: "linear", repeat: Infinity }}
            className="w-full h-full bg-white/40"
          />
        </motion.div>
      </div>

      {/* Invisible trigger to unmount the component after the sequence finishes */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.2 }}
        onAnimationComplete={onComplete}
      />
    </motion.div>
  );
}