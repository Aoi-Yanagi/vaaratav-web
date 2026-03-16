"use client";

import { motion, Variants } from "framer-motion";
import { Blocks, TrendingUp, CalendarSync, BarChart3, ShieldCheck, Video } from "lucide-react";

const features = [
  {
    title: "Seamless Integrations",
    description: "Connect your favorite calendar and productivity apps instantly. Generate high-performing invites in seconds.",
    icon: <Blocks className="w-6 h-6 text-indigo-400" />,
    colSpan: "lg:col-span-1", // Standard square card
  },
  {
    title: "High-Fidelity Video & Audio",
    description: "Experience crystal clear communication with zero latency, background noise cancellation, and auto-adjusting resolution.",
    icon: <Video className="w-6 h-6 text-cyan-400" />,
    colSpan: "lg:col-span-2", // Wide card
  },
  {
    title: "Smart Scheduling",
    description: "Take the guesswork out of planning. Automated time-zone conversions and custom booking links.",
    icon: <CalendarSync className="w-6 h-6 text-purple-400" />,
    colSpan: "lg:col-span-2", // Wide card
  },
  {
    title: "Data Protection & Privacy",
    description: "We use industry-standard encryption (AES-256) and secure protocols to keep your meetings totally safe.",
    icon: <ShieldCheck className="w-6 h-6 text-indigo-400" />,
    colSpan: "lg:col-span-1", // Standard square card
  },
  {
    title: "Real-Time Analytics",
    description: "Track participation, engagement, and connection quality with beautiful, real-time visual dashboards.",
    icon: <BarChart3 className="w-6 h-6 text-cyan-400" />,
    colSpan: "lg:col-span-3", // Full width card at the bottom
  },
];

export default function FeaturesGrid() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <section className="py-24 px-4 w-full max-w-7xl mx-auto z-10 relative" id="features">
      
      {/* --- SECTION HEADER --- */}
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-4xl md:text-5xl font-bold mb-6"
        >
          Get Better Results with <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-500">
            Stunning Features
          </span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 text-lg"
        >
          Say goodbye to endless hours spent searching for solutions and struggling with clunky interfaces. Welcome to the new standard of video calling.
        </motion.p>
      </div>

      {/* --- BENTO BOX GRID --- */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }} // Triggers animation when scrolled into view
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={cardVariants}
            className={`group relative p-8 rounded-3xl bg-neutral-900/40 border border-white/10 backdrop-blur-md overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] ${feature.colSpan}`}
          >
            {/* Background Hover Gradient (Invisible until hovered) */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              {/* Icon Container with subtle glow */}
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/50">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                {feature.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

    </section>
  );
}