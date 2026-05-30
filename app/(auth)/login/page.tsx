"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const returningMessages = [
  "Welcome back to the future of meetings.",
  "Your digital room is ready and waiting.",
  "Glad to see you again. Let's get to work.",
  "Ready to host your next big idea?",
];

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState("Welcome back.");

  // Hydrate the random message on the client to prevent server mismatch
 useEffect(() => {
    const timer = setTimeout(() => {
      setMessage(returningMessages[Math.floor(Math.random() * returningMessages.length)]);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background animated glow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-neutral-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative z-10"
      >
        <Link href="/" className="absolute top-6 left-6 text-zinc-400 hover:text-white transition-colors flex items-center text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Home
        </Link>

        <div className="text-center mt-12 mb-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/30"
          >
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Sign In</h1>
          
          {/* Randomized smooth talk */}
          <motion.p 
            key={message} // Forces re-animation if message changes
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-indigo-200/80 text-sm font-medium"
          >
            {message}
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <Button 
            onClick={handleGoogleSignIn} 
            disabled={isGoogleLoading}
            className="w-full h-14 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 font-bold rounded-xl text-base transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </Button>
        </motion.div>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-white hover:text-indigo-400 transition-colors font-medium underline underline-offset-4 decoration-white/20">
            Create one now
          </Link>
        </p>
      </motion.div>
    </div>
  );
}