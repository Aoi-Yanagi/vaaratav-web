"use client";

import { Home, Video, PlusSquare, Calendar, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

export default function Sidebar(){
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  
  const sidebarLinks = [
    { imgURL: Home, route: '/', label: 'Home' },
    { imgURL: Video, route: '/upcoming', label: 'Upcoming' },
    { imgURL: Calendar, route: '/previous', label: 'Previous' },
    { imgURL: PlusSquare, route: '/recordings', label: 'Recordings' },
  ];

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
      transition: { staggerChildren: 0.05, staggerDirection: -1 }, 
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: -20, scale: 0.6 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, y: -20, scale: 0.6, transition: { duration: 0.2 } },
  };

  return (
    <>
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

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-50 transition-colors"
              onClick={() => setIsOpen(false)} 
            />

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
                      onClick={() => setIsOpen(false)} 
                      className={`flex items-center gap-4 p-2 pr-6 rounded-full w-fit group border transition-all shadow-xl ${
                        isActive 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20' 
                          : 'bg-white dark:bg-neutral-900 border-zinc-200 dark:border-neutral-700 text-zinc-600 dark:text-gray-300 hover:bg-zinc-50 dark:hover:bg-neutral-800 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${isActive ? 'bg-white/20' : 'bg-zinc-100 dark:bg-white/5 group-hover:bg-zinc-200 dark:group-hover:bg-white/10 transition-colors'}`}>
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