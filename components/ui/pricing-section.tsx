"use client";

import { motion, Variants } from "framer-motion";
import PricingCard from "./pricing-card";

// Pricing Data
const pricingTiers = [
  {
    tier: "Vaarta.V Free",
    price: "₹0",
    description: "Ideal for quick guest syncs and basic team use.",
    features: ["1-Click Guest Chat", "Up to 10 Participants", "5-Min Guest Limit", "Basic Room Encryption", "Host 2 Meetings/mo", "No Recordings"],
    color: "cyan", // Accent color
    buttonText: "Start for Free",
  },
  {
    tier: "Vaarta.V Pro",
    price: "₹899",
    highlight: "MOST POPULAR", // Highlighted tier
    description: "Host unlimited meetings and unlock advanced controls.",
    features: ["Everything in Free, plus:", "Host Unlimited Meetings", "Up to 100 Participants", "Cloud Recordings (1GB)", "Auto-Transcription", "Full Meeting Controls"],
    color: "indigo", // Accent color
    buttonText: "Go Pro Now",
  },
  {
    tier: "Vaarta.V Business",
    price: "Custom",
    description: "Enterprise-grade tools for large-scale communications.",
    features: ["Everything in Pro, plus:", "Host up to 500 Participants", "Dedicated SSO Integration", "Advanced Security (SSO/E2EE)", "24/7 Priority Support", "White-Labeling Options"],
    color: "indigo", // Accent color
    buttonText: "Talk to Sales",
  },
];

export default function PricingSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 } // Delays cards to create separation effect
    }
  };

  // --- 5. THE COMPLEX STACK TO SEPARATION ANIMATION ---
  const cardVariants: Variants = {
    hidden: (index: number) => ({
      opacity: 0,
      // Stack logic: Cards calculate their position to overlap at the center.
      // Card 0 (Free): index=0 -> starts 100% away (next to Pro).
      // Card 1 (Pro): index=1 -> starts at 0% (center).
      // Card 2 (Enterprise): index=2 -> starts -100% away (next to Pro).
      x: `${(index - 1) * -100}%`,
      y: 50,
    }),
    visible: { 
      opacity: 1, 
      x: "0%", 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 20, 
        duration: 0.8 // Duration for opening up
      } 
    }
  };

  return (
    <section className="py-24 px-4 w-full max-w-7xl mx-auto z-10 relative" id="pricing">
      
      {/* --- SECTION HEADER --- */}
      <div className="text-center mb-20 max-w-2xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
        >
          Choose Your Plan <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-500">
            For Infinite Growth
          </span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-lg md:text-xl leading-relaxed"
        >
          Whether you are an independent creator or a large enterprise, VaartaV has the perfect video calling solution tailored to your needs. Scale seamlessly.
        </motion.p>
      </div>

      {/* --- PRICING GRID WITH ANIMATION --- */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }} // Animate when scrolled into view
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto relative z-10"
      >
        {pricingTiers.map((tier, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            custom={index} // Pass index as dynamic parameter for complex logic
            className="flex h-full w-full"
          >
            <PricingCard {...tier} />
          </motion.div>
        ))}
      </motion.div>

    </section>
  );
}