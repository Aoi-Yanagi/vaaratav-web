"use client";

import { Home, Video, PlusSquare, Calendar, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

export function Sidebar(){
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const sidebarLinks = [
    { imgURL: Home, route: '/', label: 'Home' },
    { imgURL: Video, route: '/upcoming', label: 'Upcoming' },
    { imgURL: Calendar, route: '/previous', label: 'Previous' },
    { imgURL: PlusSquare, route: '/recordings', label: 'Recordings' },
  ];

  // --- ANIMATIONS ---
  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  const menuVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
    exit: {
      opacity: 0,
      transition: { staggerChildren: 0.05, staggerDirection: -1 }, // Reverses the animation on close!
    },
  };

  // Makes them scale down and move up towards the button when closed
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.6 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, y: -20, scale: 0.6, transition: { duration: 0.2 } },
  };

  return (
    <>
      {/* 1. THE FLOATING HAMBURGER BUTTON */}
      <div className="fixed top-24 left-6 z-[60]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/30 transition-transform active:scale-95"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.div>
        </button>
      </div>

      {/* 2. THE OVERLAY & ICONS */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* The Full Screen Fade Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)} // Clicking anywhere outside closes it
            />

            {/* The Popping Icons */}
            <motion.div
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-40 left-6 z-[60] flex flex-col gap-4"
            >
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.route;
                const Icon = link.imgURL;
                
                return (
                  <motion.div key={link.label} variants={itemVariants}>
                    <Link
                      href={link.route}
                      onClick={() => setIsOpen(false)} // Close menu when a link is clicked
                      className={`flex items-center gap-4 p-2 pr-6 rounded-full w-fit group border transition-all shadow-xl ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20' 
                          : 'bg-neutral-900 border-neutral-700 text-gray-300 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10 transition-colors'}`}>
                        <Icon size={20} />
                      </div>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

