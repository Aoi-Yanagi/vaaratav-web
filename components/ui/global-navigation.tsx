"use client";

import Link from "next/link";
import Image from "next/image"; // <-- Next.js Optimized Image component
import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User as UserIcon, Settings } from "lucide-react";

export default function GlobalNavigation() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if the user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="absolute top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">V</span>
        </div>
        VaartaV
      </Link>
      
      <div className="flex items-center gap-4">
        {session ? (
          <div className="relative flex items-center" ref={dropdownRef}>
            
            {/* The Avatar Button */}
            <div 
              className="relative cursor-pointer transition-transform hover:scale-105"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Image
                src={session.user?.image || "https://github.com/ghost.png"}
                alt="User Avatar"
                width={40} //strict sizing for performance
                height={40}
                className="rounded-full border-2 border-indigo-500/50 hover:border-indigo-400 transition-all shadow-lg object-cover"
              />
            </div>

            {/* The Glassmorphic Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-14 right-0 w-56 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-white/10 mb-1 bg-white/5">
                    <p className="text-sm font-bold text-white truncate">{session.user?.name}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{session.user?.email}</p>
                  </div>

                  {/* Menu Options */}
                  <div className="flex flex-col">
                    <button 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
                    >
                      <UserIcon className="w-4 h-4" /> Profile
                    </button>
                    <button 
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors w-full text-left"
                    >
                      <Settings className="w-4 h-4" /> Settings
                    </button>
                    
                    <div className="h-px w-full bg-white/10 my-1" />
                    
                    <button 
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        ) : (
          <div className="flex gap-3">
            <Button variant="ghost" className="text-gray-300 hover:text-white font-semibold" onClick={() => signIn("github")}>
                Log In
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-500 rounded-full px-6 font-bold" onClick={() => signIn("github")}>
                Get Started
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}