"use client";

import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSession, signIn } from "next-auth/react";

export default function GlobalNavigation() {
 const { data: session, status } = useSession();
  
  // 1. Safe, standard React state
  const [animType, setAnimType] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // 2. We use a tiny timeout to push the random generation out of the synchronous render cycle.
    // This perfectly bypasses the "cascading render" error AND the "impure function" error!
    const timer = setTimeout(() => {
      setAnimType(Math.floor(Math.random() * 4));
      setIsClient(true);
    }, 10); // 10 milliseconds is invisible to the human eye

    // Cleanup the timer just in case the component unmounts instantly
    return () => clearTimeout(timer);
  }, []);

  // Wait for Clerk AND the client to load
  if (status === "loading" || !isClient) return null;

  // --- LOGO ANIMATION LOGIC ---
  const logoText = "Vaarta. V".split("");

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  // 3. Just a normal, pure switch statement reading from our state!
  const getLetterVariants = (): Variants => {
    switch (animType) {
      case 0: return { hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300 } } }; 
      case 1: return { hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300 } } }; 
      case 2: return { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300 } } }; 
      case 3: return { hidden: { opacity: 0, rotateX: -90 }, visible: { opacity: 1, rotateX: 0, transition: { duration: 0.4 } } }; 
      default: return { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    }
  };

  // ... (keep the rest of your return statement below exactly as is)
  // ... (Keep your existing return statement with the nav exactly as it is!)
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-black/30 backdrop-blur-xl border-b border-white/5 px-6 py-4 transition-all duration-300">
      <div className="container mx-auto flex items-center justify-between">
        
        {/* --- DYNAMIC LOGO SECTION --- */}
        <Link href="/" className="flex items-center gap-1 group">
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="visible"
            className="flex text-[26px] font-extrabold"
          >
            {logoText.map((letter, index) => (
              <motion.span 
                key={index} 
                variants={getLetterVariants()}
                className={`inline-block ${letter === "." ? "text-indigo-500" : "text-white"}`}
                style={{ width: letter === " " ? "0.3em" : "auto" }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </Link>

        {/* --- MIDDLE NAVIGATION --- */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
           {['Features', 'About', 'Pricing'].map((item) => (
             <Link key={item} href={`#${item.toLowerCase()}`} className="relative text-sm font-medium text-gray-400 hover:text-white transition-colors group">
               {item}
               <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-indigo-500 transition-all duration-300 group-hover:w-full rounded-full" />
             </Link>
           ))}
        </div>

        {/* --- ACTIONS SECTION --- */}
        <div className="flex items-center gap-5">
          
          {!!session && (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all px-4 py-2">
                Log In
              </Link>
              
              <Link href="/signup">
                <button className="relative px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full group overflow-hidden shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all hover:-translate-y-0.5">
                  <span className="relative z-10">Sign Up</span>
                  <div className="absolute inset-0 h-full w-full scale-0 rounded-full group-hover:scale-125 group-hover:bg-indigo-500/50 transition-all duration-300 ease-out z-0" />
                </button>
              </Link>
            </>
          )}

          {!!session && (
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="relative p-[2px] rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-lg shadow-indigo-500/20"
            >
              <div className="bg-black p-1 rounded-full flex items-center justify-center">
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </nav>
  );
};
