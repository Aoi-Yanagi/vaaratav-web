"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles, AlertCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";

const returningMessages = [
  "Welcome back to the future of meetings.",
  "Your digital room is ready and waiting.",
  "Glad to see you again. Let's get to work.",
  "Ready to host your next big idea?",
];

function LoginContent() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [message, setMessage] = useState("Welcome back.");
  
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessage(returningMessages[Math.floor(Math.random() * returningMessages.length)]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsGoogleLoading(false); 
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    
    const res = await signIn("email", { 
      email, 
      redirect: false,
      callbackUrl: "/dashboard" 
    });

    if (res?.ok && !res.error) {
      setEmailSent(true);
    } else {
      alert("Something went wrong. Please check your email configuration.");
    }
    setIsEmailLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-white/80 dark:bg-neutral-900/60 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-[2rem] p-8 shadow-2xl relative z-10 transition-colors">
      <Link href="/" className="absolute top-6 left-6 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center text-sm font-medium group">
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Home
      </Link>

      <div className="text-center mt-12 mb-10">
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 dark:border-indigo-500/30"
        >
          <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </motion.div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-3 transition-colors">Sign In</h1>
        
        <motion.p 
          key={message} initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: 0.4, duration: 0.5 }}
          className="text-indigo-600/80 dark:text-indigo-200/80 text-sm font-medium"
        >
          {message}
        </motion.p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg flex items-center justify-center mb-4">
            <AlertCircle className="w-4 h-4 mr-2" />
            Authentication failed. Please try again.
          </div>
        )}

        {/* Google Sign In */}
        <Button 
          onClick={handleGoogleSignIn} disabled={isGoogleLoading || isEmailLoading}
          className="w-full h-14 bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-[1.02] active:scale-95 font-bold rounded-xl text-base transition-all duration-200 shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] mb-4"
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

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-[#1a1a1a] px-4 text-zinc-500 font-medium">Or continue with email</span>
          </div>
        </div>

        {/* Email Sign In */}
        {emailSent ? (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-center">
            <Mail className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">Check your inbox!</h3>
            <p className="text-sm text-indigo-600/80 dark:text-indigo-400/80">
              We sent a secure login link to <br/> <span className="font-semibold text-indigo-700 dark:text-indigo-300">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
            <Button 
              type="submit" 
              disabled={isEmailLoading || isGoogleLoading}
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-base font-bold transition-all shadow-lg"
            >
              {isEmailLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Send Magic Link"}
            </Button>
          </form>
        )}
      </motion.div>

      <p className="text-center text-zinc-500 text-sm mt-8">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium underline underline-offset-4 decoration-zinc-900/20 dark:decoration-white/20">
          Create one now
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"
      />
      <Suspense fallback={<div className="text-zinc-900 dark:text-white">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}