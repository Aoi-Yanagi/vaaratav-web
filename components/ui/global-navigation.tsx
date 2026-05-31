"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, LayoutDashboard, Sun, Moon, UserCircle } from "lucide-react"; 
import { useTheme } from "next-themes";
import { UserProfileModal } from "@/components/UserProfileModal";

export default function GlobalNavigation() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0);
    
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close the dropdown if we are interacting with the Dialog portal (which is attached to the body)
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      clearTimeout(mountTimer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const displayName = session?.user?.name || "Guest User";
  const displayEmail = session?.user?.email || "";

  return (
    <nav className="absolute top-0 w-full z-50 bg-white/70 dark:bg-black/20 backdrop-blur-md border-b border-black/5 dark:border-white/10 p-4 flex justify-between items-center transition-colors">
      <Link href="/" className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">V</span>
        </div>
        Vaarta. V
      </Link>
      
      <div className="flex items-center gap-4">
        {mounted && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-600 hover:text-zinc-900 dark:text-gray-300 dark:hover:text-white rounded-full"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        )}

        {session ? (
          <div className="relative flex items-center" ref={dropdownRef}>
            <div 
              className="relative cursor-pointer transition-transform hover:scale-105"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-zinc-200 dark:border-white/10"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white/10 shadow-lg">
                  {displayName !== "Guest User" ? displayName.charAt(0).toUpperCase() : displayEmail.charAt(0).toUpperCase() || "U"}
                </div>
              )}
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-14 right-0 w-64 bg-white dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-white/10 mb-1 bg-zinc-50 dark:bg-white/5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{displayName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{displayEmail}</p>
                  </div>

                  <div className="flex flex-col">
                    <Link 
                      href="/dashboard"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors w-full text-left"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>

                    {/* NEW PROFILE SETTINGS TRIGGER */}
                    <UserProfileModal currentName={displayName}>
                      <button className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors w-full text-left">
                        <UserCircle className="w-4 h-4" /> Profile Settings
                      </button>
                    </UserProfileModal>
                    
                    <div className="h-px w-full bg-zinc-200 dark:bg-white/10 my-1" />
                    
                    <button 
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left"
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
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-600 hover:text-zinc-900 dark:text-gray-300 dark:hover:text-white font-semibold">
                  Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-6 font-bold">
                  Get Started
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}