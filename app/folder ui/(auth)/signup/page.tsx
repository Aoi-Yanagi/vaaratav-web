"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation"; // <-- NEW IMPORT
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Video, Zap, Shield, AlertCircle } from "lucide-react"; // <-- Added AlertCircle
import { motion } from "framer-motion";

const newFeatures = [
  { icon: Video, text: "Instant HD Video Rooms" },
  { icon: Zap, text: "No app downloads required" },
  { icon: Shield, text: "Secure & private connections" },
];

const welcomeMessages = [
  "Say goodbye to clunky apps.",
  "Join the next generation of online meetings.",
  "Start hosting secure, fast meetings today.",
];

// 1. Separate the main logic into a Content component
function SignupContent() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState("Experience seamless video.");
  
  // 2. Hook to read URL parameters
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage(welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error("Signup error:", err);
    } finally {
      setIsGoogleLoading(false); // Reset loading if it fails locally
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg bg-neutral-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative z-10 flex flex-col md:flex-row gap-8"
    >
      <Link href="/" className="absolute top-6 left-6 text-zinc-400 hover:text-white transition-colors flex items-center text-sm font-medium group z-20">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      {/* Left Side: App Features */}
      <div className="hidden md:flex flex-col justify-center flex-1 border-r border-white/10 pr-8 mt-8">
        <h2 className="text-xl font-bold text-white mb-6">Why VaartaV?</h2>
        <div className="space-y-6">
          {newFeatures.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="flex items-center gap-3 text-zinc-300"
              >
                <div className="bg-white/5 p-2 rounded-lg">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Right Side: Action Area */}
      <div className="flex-1 flex flex-col justify-center mt-12 md:mt-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Join Us</h1>
          <motion.p 
            key={message}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-teal-200/80 text-sm font-medium"
          >
            {message}
          </motion.p>
        </div>

        {/* NEW: Error Message Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg flex items-center justify-center mb-4">
            <AlertCircle className="w-4 h-4 mr-2" />
            Signup failed. Please try again.
          </div>
        )}

        <Button 
          onClick={handleGoogleSignUp} 
          disabled={isGoogleLoading}
          className="w-full h-14 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 font-bold rounded-xl text-base transition-all duration-200"
        >
          {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          Sign up with Google
        </Button>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Already registered?{" "}
          <Link href="/login" className="text-white hover:text-teal-400 transition-colors font-medium underline underline-offset-4 decoration-white/20">
            Log in here
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

// 3. Main Page wrapper providing the required Suspense boundary
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Signup gets an Emerald/Teal glow to differentiate from Login */}
      <motion.div 
        initial={{ opacity: 0, scale: 1.2 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-teal-600/10 rounded-full blur-[120px] pointer-events-none"
      />

      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <SignupContent />
      </Suspense>
    </div>
  );
}