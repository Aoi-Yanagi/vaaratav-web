"use client";

import { motion } from "framer-motion";

interface BorderGlowProps {
  color?: string; // e.g. "from-indigo-400"
}

export default function BorderGlow({ color = "from-indigo-500 via-cyan-400 to-indigo-500" }: BorderGlowProps) {
  return (
    <div className="absolute inset-[-2px] -z-10 rounded-3xl overflow-hidden pointer-events-none">
      {/* 1. THE GRADIENT PATH */}
      {/* A massive gradient rectangle that will move around */}
      <div className={`absolute -inset-[300px] blur-[3px] opacity-70`}>
        <div className={`h-full w-full bg-gradient-to-r ${color} shadow-[0_0_15px_6px_rgba(99,102,241,0.5)]`} />
      </div>

      {/* 2. THE SVG MASK & MASK ANIMATION */}
      {/* This invisible mask controls where the gradient is visible */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100" // Define a coordinate system
        preserveAspectRatio="none" // Stretch the mask to fit the container
      >
        <defs>
          <linearGradient id="glow-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          
          <mask id="glow-mask">
            {/* The white part of the mask shows the gradient */}
            <motion.rect
              x="-2"
              y="-2"
              width="104"
              height="104"
              rx="6" // Match the card's rounded corner radius (approx)
              fill="none"
              stroke="url(#glow-gradient)"
              strokeWidth="4"
              strokeDasharray="50 300" // Length of the glow segment, total path length
              
              // This provides the movement!
              animate={{
                strokeDashoffset: [0, -350], // Moves the dashed line around the entire path
              }}
              transition={{
                duration: 6,
                ease: "linear",
                repeat: Infinity,
              }}
            />
          </mask>
        </defs>
        
        {/* The rectangle that finally gets masked */}
        <rect width="100%" height="100%" fill="none" mask="url(#glow-mask)" />
      </svg>
    </div>
  );
}