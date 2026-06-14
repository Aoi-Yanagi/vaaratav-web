"use client";

import { useRouter, useParams, notFound } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, HelpCircle, Tag, Shield, Palette, List, Info, Mail, LayoutTemplate, Lock, Activity, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalNavigation from "@/components/ui/global-navigation";

const pageContent: Record<string, { title: string; icon: LucideIcon; content: string }> = {
  // --- MAIN MENU OPTION DESCRIPTIONS ---
  about: {
    title: "About Vaarta.V",
    icon: Info,
    content: "Vaarta.V was born from a simple belief: genuine human connection shouldn't require clunky software. We are a passionate team dedicated to redefining video communications. We are big enough to provide enterprise-grade reliability, yet small enough to care about every pixel of your experience. Welcome to the next generation of frictionless, no-app video meetings."
  },
  features: {
    title: "Next-Gen Features",
    icon: LayoutTemplate,
    content: "Experience crystal-clear HD video, studio-quality audio, and ultra-low latency powered by LiveKit. Vaarta.V boasts bank-grade security, seamless screen sharing, interactive AI-powered summaries, and dynamic UI layouts. Best of all? It runs entirely within your browser with zero downloads required. Just click, connect, and collaborate."
  },
  faq: {
    title: "Frequently Asked Questions",
    icon: HelpCircle,
    content: "We believe in total transparency. Whether you are wondering about our End-to-End Encryption (E2EE), maximum room capacities, or how our browser-first technology achieves zero-latency streams, we have compiled all the answers you need to get the absolute most out of your Vaarta.V experience."
  },
  pricing: {
    title: "Transparent Pricing",
    icon: Tag,
    content: "Powerful communication should be accessible to everyone. We offer fiercely competitive, flat-rate pricing with zero hidden fees. From our generous free tier built for quick catch-ups, to our robust enterprise solutions boasting unlimited duration and custom branding—you only pay for the power you truly need."
  },
  blog: {
    title: "The Vaarta.V Blog",
    icon: FileText,
    content: "Dive into our latest thoughts on the future of remote work, deep-dives into WebRTC engineering, and tips on fostering digital culture. Our engineering and product teams regularly share behind-the-scenes insights into how we are building the fastest video platform on the web."
  },
  contact: {
    title: "Get in Touch",
    icon: Mail,
    content: "We would absolutely love to hear from you. Whether you are an enterprise looking for a custom deployment, a developer with feedback, or just someone who wants to say hello—our team is always on standby. Drop us a line, and a real human will get back to you shortly."
  },

  // --- UTILITY OPTION DESCRIPTIONS ---
  status: {
    title: "System Status",
    icon: Activity,
    content: "Unwavering reliability is our core promise. All Vaarta.V systems, routing servers, and AI integration services are currently fully operational. We maintain a 99.99% uptime SLA to ensure your critical conversations never drop."
  },
  protected: {
    title: "Password Protected",
    icon: Lock,
    content: "Your privacy is non-negotiable. This specific room or resource has been secured with AES-256 bit encryption and requires a host-approved passcode to enter. Please authenticate to continue to your secure environment."
  },
  changelog: {
    title: "Changelog & Updates",
    icon: List,
    content: "We ship fast and we iterate constantly. Explore our timeline of continuous improvements, new AI feature rollouts, and performance optimizations. We are relentlessly upgrading Vaarta.V based on the feedback of users like you."
  },
  licenses: {
    title: "Licenses & Legal",
    icon: Shield,
    content: "We stand on the shoulders of open-source giants. Here you will find our comprehensive legal documentation, terms of service, privacy policies, and attributions to the brilliant open-source libraries that help make Vaarta.V possible."
  },
  "style-guide": {
    title: "Design & Style Guide",
    icon: Palette,
    content: "Designed with precision by Avikal. This style guide serves as the visual heartbeat of Vaarta.V, detailing our typography scale (Outfit), interactive motion principles, and the dark-mode optimized color palette that makes our UI feel so seamless."
  }
};
export default function DynamicInfoPage() {
  const router = useRouter();
  
  const params = useParams();
  const slug = params?.slug as string;

  const data = pageContent[slug];
  if (!data) return notFound();

  const Icon = data.icon;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-50 dark:bg-black transition-colors duration-500 overflow-hidden">
      <GlobalNavigation />
      
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 pt-28 pb-20">
        <div className="max-w-2xl w-full">
          
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-white/5 transition-all -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ type: "spring", stiffness: 200 }}
            className="bg-white/80 dark:bg-neutral-900/60 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-10 md:p-14 rounded-[2rem] shadow-2xl"
          >
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-200 dark:border-indigo-500/20 shadow-lg shadow-indigo-500/5">
              <Icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4">
              {data.title}
            </h1>
            
            <div className="h-1 w-20 bg-indigo-600 rounded-full mb-8" />

            <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-10">
              {data.content}
            </p>

            <div className="p-4 bg-zinc-50 dark:bg-black/50 border border-zinc-200 dark:border-white/5 rounded-xl flex items-center gap-3 text-sm text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
              This page is currently under development. [Owner & Founder: Avikal Tripathi]
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}