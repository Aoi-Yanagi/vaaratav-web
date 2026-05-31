"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Home, RefreshCw, Star } from "lucide-react";

export default function MeetingEnded() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-4 text-center">
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-md w-full"
      >
        <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-neutral-800">
          <span className="text-3xl">👋</span>
        </div>
        
        <h1 className="text-4xl font-bold">You left the meeting</h1>
        <p className="text-gray-400">
          Have a nice day! If this was a mistake, you can rejoin below.
        </p>

        {/* Feedback (Optional) */}
        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} className="w-6 h-6 text-neutral-700 hover:text-yellow-500 cursor-pointer transition-colors" />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/" className="w-full sm:w-auto">
             <Button variant="outline" className="w-full gap-2 border-neutral-700 h-12">
               <Home className="w-4 h-4" /> Return Home
             </Button>
          </Link>
          <Button className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 h-12">
            <RefreshCw className="w-4 h-4" /> Rejoin Meeting
          </Button>
        </div>
      </motion.div>

    </div>
  );
}