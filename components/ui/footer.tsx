"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MapPin, Phone, Mail, Linkedin, Github, Youtube, CheckCircle2 } from "lucide-react";

const menuLinks = [
  { label: 'Home', href: '/' },
  { label: 'About us', href: '/info/about' },
  { label: 'Features', href: '/info/features' }, 
  { label: 'FAQ', href: '/info/faq' },           
  { label: 'Pricing', href: '/info/pricing' },   
  { label: 'Blog', href: '/info/blog' },
  { label: 'Contact', href: '/info/contact' },
];

const utilityLinks = [
  { label: 'System Status', href: '/info/status' }, 
  { label: 'Password protected', href: '/info/protected' },
  { label: 'Changelog', href: '/info/changelog' },
  { label: 'Licenses', href: '/info/licenses' },
  { label: 'Style guide', href: '/info/style-guide' },
];

const XIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const socialLinks = [
  { Icon: XIcon, href: 'https://x.com', label: 'X' },
  { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { Icon: Github, href: 'https://github.com', label: 'GitHub' },
  { Icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
];

export default function Footer() {
  const pathname = usePathname();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [email, setEmail] = useState("");
  
  // State for the Home Button Popup
  const [showHomePopup, setShowHomePopup] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubscribed(true);
    }
  };

  // Logic to intercept the Home click
  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault(); 
      setShowHomePopup(true);
      setTimeout(() => setShowHomePopup(false), 4000); // Auto-hide after 4 seconds
    }
  };

  // Logic to scroll to top when the popup is clicked
  const scrollToTop = () => {
    const scrollContainer = document.getElementById("main-scroll-container");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setShowHomePopup(false); 
  };

  return (
    <footer className="w-full border-t border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-xl pt-20 pb-10 relative z-10 transition-colors duration-500">
      <div className="container mx-auto px-6 lg:px-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Logo & Newsletter */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-1 group w-fit">
              <span className="text-[26px] font-extrabold text-zinc-900 dark:text-white tracking-tight transition-colors">
                Vaarta<span className="text-indigo-600 dark:text-indigo-500">.</span> V
              </span>
            </Link>
            <p className="text-zinc-600 dark:text-gray-400 text-sm leading-relaxed transition-colors">
              Join a fostering company which is big enough to support, small enough to care. Redefining video communications.
            </p>
            
            <div className="mt-2">
              <p className="text-zinc-900 dark:text-white font-semibold mb-3 text-sm transition-colors">Join our newsletter</p>
              
              {isSubscribed ? (
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 py-3 px-4 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Thanks for subscribing!</span>
                </div>
              ) : (
                <form className="relative flex items-center" onSubmit={handleSubscribe}>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address" 
                    className="w-full bg-zinc-50 dark:bg-neutral-900/50 border border-zinc-200 dark:border-white/10 rounded-full py-3 pl-5 pr-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                  />
                  <button type="submit" className="absolute right-1 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Menu with Interactive Home Button */}
         <div>
            <h4 className="text-zinc-900 dark:text-white font-bold mb-6 transition-colors">Menu</h4>
            <ul className="flex flex-col gap-4 text-sm text-zinc-600 dark:text-gray-400">
              {menuLinks.map((link) => (
                // FIX: Removed the conditional 'w-fit' so all items align perfectly
                <li key={link.label} className="relative">
                  {link.label === 'Home' ? (
                    <>
                      <Link 
                        href="/" 
                        onClick={handleHomeClick} 
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block"
                      >
                        {link.label}
                      </Link>

                      {/* THE SPRING & FLOATING POPUP */}
                      <AnimatePresence>
                        {showHomePopup && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            // FIX: Animate Y through an array to make it float up and down
                            animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ 
                              opacity: { duration: 0.2 },
                              scale: { type: "spring", stiffness: 400, damping: 25 },
                              // FIX: Loop the Y animation infinitely for the floating effect
                              y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } 
                            }}
                            onClick={scrollToTop}
                            className="absolute left-0 bottom-[130%] mb-1 w-[180px] text-center bg-indigo-600 text-white text-xs font-medium p-3 rounded-xl cursor-pointer shadow-xl border border-indigo-500 hover:bg-indigo-500 transition-colors z-[100]"
                          >
                            We are already at Home. Scroll to Top?                            
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link href={link.href} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-block">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Utility Pages */}
          <div>
            <h4 className="text-zinc-900 dark:text-white font-bold mb-6 transition-colors">Utility Pages</h4>
            <ul className="flex flex-col gap-4 text-sm text-zinc-600 dark:text-gray-400">
              {utilityLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-zinc-900 dark:text-white font-bold mb-6 transition-colors">Contact Us</h4>
            <ul className="flex flex-col gap-5 text-sm text-zinc-600 dark:text-gray-400">
              <li className="flex items-start gap-3 group">
                <Phone className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors" />
                <a href="tel:+918005550103" className="group-hover:text-zinc-900 dark:group-hover:text-white transition-colors cursor-pointer">
                  +91 (8XX)-9XXX-45X
                </a>
              </li>
              <li className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors" />
                <a 
                  href="https://maps.google.com/?q=Lucknow,+UP,+India" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group-hover:text-zinc-900 dark:group-hover:text-white transition-colors cursor-pointer"
                >
                  Lucknow, Uttar Pradesh, India - 226001
                </a>
              </li>
              <li className="flex items-start gap-3 group">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors" />
                <a href="mailto:hello@vaartav.com" className="group-hover:text-zinc-900 dark:group-hover:text-white transition-colors cursor-pointer">
                  hello@vaartav.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-zinc-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
          <p className="text-sm text-zinc-500 dark:text-gray-500">
            © {new Date().getFullYear()} Copyright Vaarta. V | Designed with precision by Avikal. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            {socialLinks.map(({ Icon, href, label }) => (
              <a 
                key={label} 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label={label}
                className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-zinc-500 dark:text-gray-400 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white dark:hover:text-white hover:border-indigo-500 hover:-translate-y-1 transition-all duration-300 shadow-sm dark:shadow-lg"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}