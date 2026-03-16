"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 1. Grab the specific div that is scrolling
    const scrollContainer = document.getElementById("main-scroll-container");
    if (!scrollContainer) return;

    const toggleVisibility = () => {
      // 2. Read .scrollTop from the div, not the window!
      if (scrollContainer.scrollTop > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // 3. Attach the event listener directly to that div
    scrollContainer.addEventListener("scroll", toggleVisibility);
    return () => scrollContainer.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    const scrollContainer = document.getElementById("main-scroll-container");
    if (scrollContainer) {
      // Smoothly scroll that specific div back to the top
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-10 right-10 z-[100]"
        >
          <button
            onClick={scrollToTop}
            className="p-3 bg-indigo-600 hover:bg-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all duration-300 hover:-translate-y-1 group"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-6 h-6 group-hover:animate-bounce" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}