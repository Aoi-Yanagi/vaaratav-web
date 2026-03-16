"use client";

import Navbar from "@/components/ui/nav-top";
import Sidebar from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Hero3D from "@/components/3d/HeroGeometric"; // Keeping your awesome 3D background!
import { motion, Variants } from "framer-motion"; // <-- Added Variants here!
import { Keyboard, Video, Zap, Lock, Shield, VideoIcon, ZapIcon, Globe } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import FeaturesGrid from "@/components/ui/features-grid";
import FaqSection from "@/components/ui/faq-section";
import PricingSection from "@/components/ui/pricing-section";
import Footer from "@/components/ui/footer";
import ScrollToTop from "@/components/ui/scroll-to-top";

export default function Home() {
  const router = useRouter();
  const [meetingCode, setMeetingCode] = useState("");
  
  const { userId, isLoaded } = useAuth();
  const isLoggedIn = !!userId; 

  const startNewMeeting = () => {
    const randomId = Math.random().toString(36).substring(2, 8);
    router.push(`/meeting/${randomId}`);
  };

  const joinMeeting = () => {
    if (meetingCode.trim()) {
      router.push(`/meeting/${meetingCode}`);
    }
  };

  // --- ANIMATION MAGIC (With fixed TypeScript Variants) ---
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.20, delayChildren: 0.35 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300 } }
  };

  const taglines = [
    { text: "Crystal Clear Video", icon: <VideoIcon className="w-4 h-4 text-cyan-400" /> },
    { text: "Bank-Grade Security", icon: <Shield className="w-4 h-4 text-indigo-400" /> },
    { text: "Zero Latency", icon: <ZapIcon className="w-4 h-4 text-purple-400" /> },
    { text: "No Downloads Required", icon: <Globe className="w-4 h-4 text-blue-400" /> },
  ];

  return (
    <main className="relative min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-hidden">
      <Navbar />

      {/* --- THE MASSIVE GLOWING BACKGROUND EFFECT --- */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-40 blur-[120px] rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 pointer-events-none z-0" />

      {/* This splits the screen so the Sidebar sits on the left */}
      <div className="flex h-screen pt-16"> 
        
        {isLoggedIn && <Sidebar />}

        <div id="main-scroll-container" className="flex-1 relative overflow-y-auto w-full flex flex-col items-center">
          
          {/* Your custom 3D background behind the content */}
          <div className="absolute inset-0 z-0">
             <Hero3D />
          </div>

          <div className="relative pt-24 pb-20 px-4 container mx-auto flex flex-col items-center text-center z-10 w-full max-w-6xl">
            
            {/* --- 4 ANIMATED TAGLINES REVEAL --- */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-wrap justify-center gap-3 mb-10"
            >
              {taglines.map((tag, i) => (
                <motion.div 
                  key={i} 
                  variants={itemVariants}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl"
                >
                  {tag.icon}
                  <span className="text-sm font-medium text-gray-200">{tag.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* --- MAIN HERO TITLE --- */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight"
            >
              Connect with Anyone. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-500">
                Amplify Your Reach.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl"
            >
              Plan, launch, and host high-fidelity video meetings all from one powerful dashboard. Manage your entire communication stack without the chaos.
            </motion.p>

            {/* --- THE MEETING CARD CONTROLS --- */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, type: "spring" }}
              className="mt-12 w-full max-w-2xl relative"
            >
              <div className={`relative transition-all duration-500 ${!isLoggedIn ? 'opacity-50 grayscale blur-[2px] pointer-events-none select-none' : ''}`}>
                 <Card className="p-3 bg-white/5 border-white/10 backdrop-blur-xl flex flex-col sm:flex-row gap-3 shadow-2xl shadow-indigo-900/20 rounded-2xl">
                    <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 h-14 text-base font-semibold transition-all rounded-xl" onClick={startNewMeeting}>
                      <Video className="w-5 h-5 mr-2" />
                      New Meeting
                    </Button>
                    <div className="flex-1 flex gap-2">
                      <div className="relative flex-1">
                        <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          placeholder="Enter meeting code" 
                          className="pl-12 h-14 bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-indigo-500 text-lg rounded-xl"
                          value={meetingCode}
                          onChange={(e) => setMeetingCode(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
                        />
                      </div>
                      <Button size="lg" variant="secondary" className="h-14 px-8 font-semibold bg-white text-black hover:bg-gray-200 rounded-xl" disabled={!meetingCode} onClick={joinMeeting}>
                        Join
                      </Button>
                    </div>
                  </Card>
              </div>

              {/* LOCK OVERLAY */}
              {!isLoggedIn && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                    <div className="bg-black/70 backdrop-blur-md border border-indigo-500/30 p-5 rounded-2xl flex items-center gap-4 shadow-2xl">
                        <div className="p-3 bg-indigo-500/20 rounded-full">
                            <Lock className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-base font-bold text-white">Login Required</p>
                            <p className="text-sm text-gray-300">Sign in to host unlimited meetings</p>
                        </div>
                        <Link href="/login">
                          <Button className="ml-4 bg-indigo-600 hover:bg-indigo-500 rounded-full px-6 transition-transform hover:scale-105">
                              Get Started
                          </Button>
                        </Link>
                    </div>
                </div>
              )}
            </motion.div>

            {/* --- GUEST CHAT OPTION --- */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-8 mb-32" // <-- Added mb-32 here to give space before features
            >
              <div className="flex flex-col items-center gap-3">
                 <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Or try instantly</span>
                 <Button 
                    variant="outline" 
                    className={`...`}
                    onClick={() => router.push('/guest-chat')}
                  >
                    <Zap className="w-4 h-4 mr-2" /> 
                    Start 5-Min Guest Chat (No Login)
                  </Button>
              </div>
            </motion.div>
            <FeaturesGrid />
            <PricingSection />
            <FaqSection />
            <Footer />
            <ScrollToTop />
          </div>
        </div>
      </div>
    </main>
  );
}