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
    // 1. THE OUTER BOX (The padding dictates the border thickness)
    <div className="relative w-full h-full rounded-3xl p-[2px] overflow-hidden group hover:-translate-y-2 transition-transform duration-300 shadow-2xl shadow-black/50">
      
    
      {/* inset-[-100%] makes it massive so the corners never clip while spinning */}
      {/* 2. THE SPINNING PIE (The Glow) */}
     <div 
        className={`absolute inset-[-100%] animate-spin transition-opacity duration-500 z-0 ${
          isHighlighted 
            // 1. PRO TIER (Triple Laser: Grey, Indigo, Cyan) - Always On
            ? 'bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#9ca3af_15%,transparent_33%,#6366f1_50%,transparent_66%,#22d3ee_85%,transparent_100%)] opacity-100' 
            
            : tier === "Vaarta.V Business"
            // 2. BUSINESS TIER (Dual Laser: Red & Grey) - Always On
            ? 'bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,#ef4444_25%,transparent_50%,#9ca3af_75%,transparent_100%)] opacity-100'
            
            // 3. FREE TIER (Single Grey Laser) - Only On Hover
            : 'bg-[conic-gradient(from_90deg_at_50%_50%,transparent_50%,#525252_100%)] opacity-0 group-hover:opacity-100' 
        }`} 
        style={{ animationDuration: '11s' }} 
      />
      
      {/* 3. THE INNER LID (The actual card content) */}
      <div className="relative flex flex-col h-full w-full rounded-[22px] bg-neutral-950 p-8 pb-12 z-10">
        
        {/* THE TIER HEADER */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-xl font-extrabold text-white mb-1 flex items-center gap-2">
              {isHighlighted && <Video className="w-5 h-5 text-indigo-400" />}
              {tier}
            </h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          {isHighlighted && (
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {highlight}
            </span>
          )}
        </div>

        {/* THE PRICE */}
        <div className="mb-10 text-left">
          <span className="text-6xl font-extrabold text-white leading-tight">
            {price}
          </span>
          <span className="text-base text-gray-500 font-semibold ml-1"> / month</span>
        </div>

        {/* THE FEATURES LIST */}
        <div className="flex-grow">
          <p className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-6">What's included:</p>
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isHighlighted ? 'text-indigo-400' : 'text-cyan-400'}`} />
                <span className="text-sm md:text-base">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CALL TO ACTION BUTTON */}
        <div className="mt-12 pt-8 border-t border-white/5">
          <Button
            size="lg"
            className={`w-full h-14 text-base font-semibold rounded-2xl transition-all duration-300 ${
              isHighlighted 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
            }`}
          >
            {buttonText}
          </Button>
        </div>

      </div>
    </div>
  );
}