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
    color: "cyan", 
    buttonText: "Start for Free",
  },
  {
    tier: "Vaarta.V Pro",
    price: "₹899",
    highlight: "MOST POPULAR", 
    description: "Host unlimited meetings and unlock advanced controls.",
    features: ["Everything in Free, plus:", "Host Unlimited Meetings", "Up to 100 Participants", "Cloud Recordings (1GB)", "Auto-Transcription", "Full Meeting Controls"],
    color: "indigo", 
    buttonText: "Go Pro Now",
  },
  {
    tier: "Vaarta.V Business",
    price: "Custom",
    description: "Enterprise-grade tools for large-scale communications.",
    features: ["Everything in Pro, plus:", "Host up to 500 Participants", "Dedicated SSO Integration", "Advanced Security (SSO/E2EE)", "24/7 Priority Support", "White-Labeling Options"],
    color: "indigo", 
    buttonText: "Talk to Sales",
  },
];

export default function PricingSection() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 } 
    }
  };

  const cardVariants: Variants = {
    hidden: (index: number) => ({
      opacity: 0,
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
        duration: 0.8 
      } 
    }
  };

  return (
    <section className="py-24 px-4 w-full max-w-7xl mx-auto z-10 relative" id="pricing">
      
      <div className="text-center mb-20 max-w-2xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-zinc-900 dark:text-white transition-colors"
        >
          Choose Your Plan <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-600 dark:from-indigo-400 dark:via-cyan-400 dark:to-indigo-500">
            For Infinite Growth
          </span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-zinc-600 dark:text-gray-400 text-lg md:text-xl leading-relaxed transition-colors"
        >
          Whether you are an independent creator or a large enterprise, VaartaV has the perfect video calling solution tailored to your needs. Scale seamlessly.
        </motion.p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }} 
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto relative z-10"
      >
        {pricingTiers.map((tier, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            custom={index} 
            className="flex h-full w-full"
          >
            <PricingCard {...tier} />
          </motion.div>
        ))}
      </motion.div>

    </section>
  );
}