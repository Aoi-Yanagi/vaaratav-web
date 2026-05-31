"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Camera, Loader2, X, Check } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // FIX: Imported cn utility

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { data: session, update } = useSession();
  
  const [name, setName] = useState(session?.user?.name || "");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [imagePreview, setImagePreview] = useState<string | null>(session?.user?.image || null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to extract initials
  const getInitials = (nameString?: string | null, emailString?: string | null) => {
    if (nameString) return nameString.substring(0, 2).toUpperCase();
    if (emailString) return emailString.substring(0, 2).toUpperCase();
    return "U";
  };

  // Convert uploaded image to Base64 String so we can store it in the database immediately
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("Image must be smaller than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, image: imagePreview }), // Sending new data
      });

      const data = await res.json();

      if (res.ok) {
        // Update NextAuth session in the browser seamlessly
        await update({ name, email, image: imagePreview });
        setSuccessMessage(true);
        setTimeout(() => {
          setSuccessMessage(false);
          onClose();
        }, 2000);
      } else {
        setErrorMessage(data.error || "Failed to update profile");
      }
    } catch (error) {
      setErrorMessage("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 20 }} 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-8 rounded-[2rem] w-full max-w-md shadow-2xl relative overflow-hidden transition-colors"
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-6">
              {/* Profile Image Uploader */}
              <div 
                className="relative group cursor-pointer mb-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-lg flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-2xl font-bold">
                  {imagePreview ? (
                    <Image src={imagePreview} alt="Profile" width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <span>{getInitials(name, email)}</span>
                  )}
                </div>
                
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                   <Camera className="w-6 h-6 text-white mb-1" />
                   <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              </div>
              
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Your Profile</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mt-1">Manage your account details.</p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium text-center border border-red-200 dark:border-red-500/20">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              
              {/* Name Input */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
                  <User className="w-4 h-4" /> Display Name
                </label>
                <input 
                  type="text" required placeholder="Enter your name"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={name} onChange={(e) => setName(e.target.value)} 
                />
              </div>

              {/* Editable Email Input */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Account Email
                </label>
                <input 
                  type="email" required placeholder="name@example.com"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                />
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isSubmitting || successMessage} className={cn("w-full h-12 rounded-xl text-md font-bold transition-all shadow-lg", successMessage ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white")}>
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : successMessage ? <span className="flex items-center gap-2"><Check className="w-5 h-5"/> Profile Saved!</span> : "Save Changes"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}