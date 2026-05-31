"use client";

import { motion } from "framer-motion";

interface BorderGlowProps {
  color?: string;
}

export default function BorderGlow({ 
  // Added a slightly deeper gradient for light mode, and preserved your bright gradient for dark mode
  color = "from-indigo-600 via-cyan-500 to-indigo-600 dark:from-indigo-500 dark:via-cyan-400 dark:to-indigo-500" 
}: BorderGlowProps) {
  return (
    <div className="absolute inset-[-2px] -z-10 rounded-3xl overflow-hidden pointer-events-none transition-colors duration-500">
      {/* 1. THE GRADIENT PATH */}
      {/* Softened opacity for light mode so it doesn't blind the user */}
      <div className={`absolute -inset-[300px] blur-[3px] opacity-40 dark:opacity-70 transition-opacity duration-500`}>
        {/* Adjusted the shadow to be lighter in light mode, stronger in dark mode */}
        <div className={`h-full w-full bg-gradient-to-r ${color} shadow-[0_0_15px_6px_rgba(99,102,241,0.2)] dark:shadow-[0_0_15px_6px_rgba(99,102,241,0.5)] transition-shadow duration-500`} />
      </div>

      {/* 2. THE SVG MASK & MASK ANIMATION */}
      {/* This invisible mask controls where the gradient is visible */}
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100" // Defining a coordinate system
        preserveAspectRatio="none" // Stretching the mask to fit the container
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
              rx="6" // Match the card's rounded corner radius
              fill="none"
              stroke="url(#glow-gradient)"
              strokeWidth="4"
              strokeDasharray="50 300" // Length of the glow segment, total path length
              
              // To provide the movement!
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
        <rect 
          x="0" 
          y="0" 
          width="100" 
          height="100" 
          fill="currentColor" 
          mask="url(#glow-mask)" 
          className="text-white"
        />
      </svg>
    </div>
  );
}