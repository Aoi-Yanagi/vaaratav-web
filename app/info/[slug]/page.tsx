"use client";

import { useRouter, useParams, notFound } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, HelpCircle, Tag, Shield, Palette, List, Info, Mail, LayoutTemplate, Lock, Activity, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalNavigation from "@/components/ui/global-navigation";

const pageContent: Record<string, { title: string; icon: LucideIcon; content: string }> = {
  features: {
    title: "Platform Features",
    icon: LayoutTemplate,
    content: "We are currently compiling a comprehensive list of all our HD video, scheduling, and security features. Check back soon for the full breakdown!"
  },
  faq: {
    title: "Frequently Asked Questions",
    icon: HelpCircle,
    content: "Got questions? We are putting together a detailed FAQ to help you get the most out of your video meetings."
  },
  pricing: {
    title: "Pricing Plans",
    icon: Tag,
    content: "Simple, transparent pricing is on the way. Whether you are an individual or an enterprise, we will have a plan for you."
  },
  licenses: {
    title: "Licenses & Legal",
    icon: Shield,
    content: "Information regarding our software licenses, open-source attributions, and legal documentation will be available here."
  },
  changelog: {
    title: "Changelog",
    icon: List,
    content: "Keep track of all the latest updates, bug fixes, and new features we are pushing to the platform."
  },
  "style-guide": {
    title: "Style Guide",
    icon: Palette,
    content: "Our brand assets, color palettes, and typography guidelines will be hosted here for press and design use."
  },
  about: {
    title: "About Us",
    icon: Info,
    content: "Learn more about our mission to redefine video communications, making them accessible, secure, and lightning-fast."
  },
  blog: {
    title: "VaartaV Blog",
    icon: FileText,
    content: "Our engineering and product teams are writing up some great articles. The blog will be launching shortly!"
  },
  contact: {
    title: "Contact Us",
    icon: Mail,
    content: "Need to reach out? You can email us at hello@vaartav.com or call our support line. A full contact form is coming soon."
  },
  protected: {
    title: "Password Protected",
    icon: Lock,
    content: "This area contains secure documents and requires special authorization. Authentication gateways are being configured."
  },
  status: {
    title: "System Status",
    icon: Activity,
    content: "All servers and video routing systems are fully operational. We will post any maintenance or downtime notices here."
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