"use client";

import GlobalNavigation from "@/components/ui/global-navigation";
import Sidebar from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Hero3D from "@/components/3d/HeroGeometric";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Keyboard, Video, Zap, Lock, Shield, VideoIcon, ZapIcon, Globe } from "lucide-react";
import { useState } from "react"; 
import { useRouter } from "next/navigation";
import FeaturesGrid from "@/components/ui/features-grid";
import FaqSection from "@/components/ui/faq-section";
import PricingSection from "@/components/ui/pricing-section";
import Footer from "@/components/ui/footer";
import ScrollToTop from "@/components/ui/scroll-to-top";
import WelcomeScreen from "@/components/ui/welcome-screen";
import { useSession } from "next-auth/react";

export default function Home() {
  const router = useRouter();
  
  // 1. Hook into NextAuth to check the real login status
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";

  const [meetingCode, setMeetingCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const startNewMeeting = async () => {
    // 2. If they are not logged in, send them to the login page immediately
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await fetch("/api/meetings/create", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.meetingCode) {
        router.push(`/meeting/${data.meetingCode}`);
      } else {
        console.error("Failed to generate meeting code:", data.error);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Network error:", error);
      setIsCreating(false);
    }
  };

  const joinMeeting = () => {
    if (meetingCode.trim()) {
      router.push(`/meeting/${meetingCode}`);
    }
  };

  const startGuestSession = () => {
    const uniqueRoomId = Math.random().toString(36).substring(2, 8).toLowerCase();
    router.push(`/guest-chat/${uniqueRoomId}`);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.20, delayChildren: 0.35 } }
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
    <>
      <AnimatePresence mode="wait">
        {showWelcome && (
          <WelcomeScreen key="welcome" onComplete={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      {!showWelcome && (
        <motion.main 
          initial={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative min-h-[100dvh] bg-[#050505] text-white selection:bg-indigo-500/30 overflow-hidden"
        >
          <GlobalNavigation />

          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] opacity-40 blur-[120px] rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 pointer-events-none z-0" />

          <div className="flex h-[100dvh] pt-16"> 
            <div className="hidden md:block">
                {isLoggedIn && <Sidebar />}
            </div>

            <div id="main-scroll-container" className="flex-1 relative overflow-y-auto w-full flex flex-col items-center">
              <div className="absolute inset-0 z-0">
                  <Hero3D />
              </div>

              <div className="relative pt-24 pb-20 px-4 container mx-auto flex flex-col items-center text-center z-10 w-full max-w-6xl">
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-wrap justify-center gap-3 mb-10">
                  {taglines.map((tag, i) => (
                    <motion.div key={i} variants={itemVariants} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-xl">
                      {tag.icon}
                      <span className="text-sm font-medium text-gray-200">{tag.text}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.h1 
                  initial={{ opacity: 0, y: 30 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }} 
                  className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight"
                >
                  Connect with Anyone. <br />
                  <motion.span 
                    animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="bg-[length:200%_auto] bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-200 to-indigo-500 inline-block pb-2"
                  >
                    Amplify Your Reach.
                  </motion.span>
                </motion.h1>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl">
                  Plan, launch, and host high-fidelity video meetings all from one powerful dashboard. Manage your entire communication stack without the chaos.
                </motion.p>

                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, type: "spring" }} className="mt-12 w-full max-w-2xl relative">
                  
                  <div className="relative transition-all duration-500">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-cyan-500/30 rounded-[1.25rem] blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                    
                    <Card className="relative p-3 bg-black/40 border border-white/10 backdrop-blur-2xl flex flex-col sm:flex-row gap-3 shadow-[0_8px_32px_0_rgba(31,38,135,0.2)] rounded-2xl group">
                      
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto relative group/btn">
  <Button 
    size="lg" 
    // 3. Dynamically apply classes: clear indigo if logged in, blurred zinc if logged out
    className={`w-full h-14 text-base font-semibold transition-all duration-300 rounded-xl border ${
      isLoggedIn 
        ? "bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)] border-indigo-400/20 text-white" 
        : "bg-zinc-800/80 text-zinc-400 border-white/5 blur-[1.5px] group-hover/btn:blur-none opacity-80"
    }`} 
    onClick={startNewMeeting} 
    disabled={isCreating}
  >
    {/* 4. Swap the icon to a Lock if they aren't logged in */}
    {isLoggedIn ? (
      <Video className="w-5 h-5 mr-2" />
    ) : (
      <Lock className="w-5 h-5 mr-2" />
    )}
    
    {isCreating ? 'Creating...' : isLoggedIn ? 'New Meeting' : 'Log in to Host'}
  </Button>
</motion.div>

                      <div className="flex-1 flex gap-2">
                        <div className="relative flex-1 group/input">
                          <Keyboard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
                          <Input 
                            placeholder="Enter meeting code" 
                            className="pl-12 h-14 bg-white/5 border-white/5 text-white placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 text-lg rounded-xl transition-all"
                            value={meetingCode}
                            onChange={(e) => setMeetingCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && joinMeeting()}
                          />
                        </div>
                        
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button size="lg" variant="secondary" className="h-14 px-8 font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-xl transition-all" disabled={!meetingCode} onClick={joinMeeting}>
                            Join
                          </Button>
                        </motion.div>
                      </div>
                    </Card>
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-8 mb-32">
                  <div className="flex flex-col items-center gap-3">
                      <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Or try instantly</span>
                      <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white bg-transparent" onClick={startGuestSession}>
                        <Zap className="w-4 h-4 mr-2" /> 
                        Start 5-Min Guest Chat
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
        </motion.main>
      )}
    </>
  );
}