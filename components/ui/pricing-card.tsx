"use client";

import { CheckCircle2, Video } from "lucide-react";
import { Button } from "./button";

interface PricingCardProps {
  tier: string;
  price: string;
  highlight?: string;
  description: string;
  features: string[];
  color: string;
  buttonText: string;
}

export default function PricingCard({ tier, price, highlight, description, features, color, buttonText }: PricingCardProps) {
  const isHighlighted = !!highlight;

  return (
    <div className="relative w-full h-full rounded-3xl p-[2px] overflow-hidden group hover:-translate-y-2 transition-transform duration-300 shadow-xl dark:shadow-2xl dark:shadow-black/50">
      
      <div 
        className={`absolute inset-[-100%] animate-spin transition-opacity duration-500 z-0 ${
          isHighlighted 
            ? 'bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#e5e7eb_15%,transparent_33%,#6366f1_50%,transparent_66%,#22d3ee_85%,transparent_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#9ca3af_15%,transparent_33%,#6366f1_50%,transparent_66%,#22d3ee_85%,transparent_100%)] opacity-100' 
            : tier === "Vaarta.V Business"
            ? 'bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#ef4444_25%,transparent_50%,#e5e7eb_75%,transparent_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#ef4444_25%,transparent_50%,#9ca3af_75%,transparent_100%)] opacity-100'
            : 'bg-[conic-gradient(from_90deg_at_50%_50%,transparent_50%,#d4d4d8_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,transparent_50%,#525252_100%)] opacity-0 group-hover:opacity-100' 
        }`} 
        style={{ animationDuration: '11s' }} 
      />
      
      <div className="relative flex flex-col h-full w-full rounded-[22px] bg-white dark:bg-neutral-950 p-8 pb-12 z-10 transition-colors duration-300">
        
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white mb-1 flex items-center gap-2 transition-colors">
              {isHighlighted && <Video className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />}
              {tier}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-gray-400 transition-colors">{description}</p>
          </div>
          {isHighlighted && (
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-colors">
              {highlight}
            </span>
          )}
        </div>

        <div className="mb-10 text-left">
          <span className="text-6xl font-extrabold text-zinc-900 dark:text-white leading-tight transition-colors">
            {price}
          </span>
          <span className="text-base text-zinc-500 dark:text-gray-500 font-semibold ml-1 transition-colors"> / month</span>
        </div>

        <div className="flex-grow">
          <p className="text-sm font-semibold text-zinc-400 dark:text-white/70 uppercase tracking-widest mb-6 transition-colors">What's included:</p>
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-zinc-600 dark:text-gray-300 transition-colors">
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isHighlighted ? 'text-indigo-500 dark:text-indigo-400' : 'text-cyan-500 dark:text-cyan-400'}`} />
                <span className="text-sm md:text-base">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-100 dark:border-white/5 transition-colors">
          <Button
            size="lg"
            className={`w-full h-14 text-base font-semibold rounded-2xl transition-all duration-300 ${
              isHighlighted 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] dark:shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-gray-300'
            }`}
          >
            {buttonText}
          </Button>
        </div>

      </div>
    </div>
  );
}