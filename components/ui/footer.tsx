"use client";

import Link from "next/link";
import { Send, MapPin, Phone, Mail, Twitter, Linkedin, Github, Youtube } from "lucide-react";

// --- DATA ARRAYS FOR EASY MANAGEMENT ---

const menuLinks = [
  { label: 'Home', href: '/' },
  { label: 'About us', href: '/about' },
  { label: 'Features', href: '/#features' }, // Scrolls to the Features section
  { label: 'FAQ', href: '/#faq' },           // Scrolls to the FAQ section
  { label: 'Pricing', href: '/#pricing' },   // Scrolls to the Pricing section
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

const utilityLinks = [
  { label: 'Page not found', href: '/404' },
  { label: 'Password protected', href: '/protected' },
  { label: 'Changelog', href: '/changelog' },
  { label: 'Licenses', href: '/licenses' },
  { label: 'Style guide', href: '/style-guide' },
];

const socialLinks = [
  { Icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { Icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { Icon: Github, href: 'https://github.com', label: 'GitHub' },
  { Icon: Youtube, href: 'https://youtube.com', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-black/50 backdrop-blur-xl pt-20 pb-10 relative z-10">
      <div className="container mx-auto px-6 lg:px-10">
        
        {/* TOP SECTION: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
          {/* Column 1: Brand & Newsletter */}
          <div className="flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-1 group w-fit">
              <span className="text-[26px] font-extrabold text-white tracking-tight">
                Vaarta<span className="text-indigo-500">.</span> V
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Join a fostering company which is big enough to support, small enough to care. Redefining video communications.
            </p>
            
            {/* Newsletter Input */}
            <div className="mt-2">
              <p className="text-white font-semibold mb-3 text-sm">Join our newsletter</p>
              <form className="relative flex items-center" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  required
                  placeholder="Email address" 
                  className="w-full bg-neutral-900/50 border border-white/10 rounded-full py-3 pl-5 pr-12 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button type="submit" className="absolute right-1 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Menu</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-400">
              {menuLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Utility Links */}
          <div>
            <h4 className="text-white font-bold mb-6">Utility Pages</h4>
            <ul className="flex flex-col gap-4 text-sm text-gray-400">
              {utilityLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info (Actionable Links) */}
          <div>
            <h4 className="text-white font-bold mb-6">Contact Us</h4>
            <ul className="flex flex-col gap-5 text-sm text-gray-400">
              
              {/* Native Phone Dialer Link */}
              <li className="flex items-start gap-3 group">
                <Phone className="w-5 h-5 text-indigo-400 flex-shrink-0 group-hover:text-indigo-300 transition-colors" />
                <a href="tel:+918005550103" className="group-hover:text-white transition-colors cursor-pointer">
                  +91 (8XX)-9XXX-45X
                </a>
              </li>
              
              {/* Google Maps Link */}
              <li className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 text-indigo-400 flex-shrink-0 group-hover:text-indigo-300 transition-colors" />
                <a 
                  href="https://maps.google.com/?q=Lucknow,+UP,+India" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group-hover:text-white transition-colors cursor-pointer"
                >
                  Lucknow, Uttar Pradesh, India - 226001
                </a>
              </li>
              
              {/* Native Email App Link */}
              <li className="flex items-start gap-3 group">
                <Mail className="w-5 h-5 text-indigo-400 flex-shrink-0 group-hover:text-indigo-300 transition-colors" />
                <a href="mailto:hello@vaartav.com" className="group-hover:text-white transition-colors cursor-pointer">
                  hello@vaartav.com
                </a>
              </li>

            </ul>
          </div>
        </div>

        {/* BOTTOM SECTION: Copyright & Socials */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Copyright Vaarta. V | Designed with precision by Avikal. All rights reserved.
          </p>
          
          {/* External Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ Icon, href, label }) => (
              <a 
                key={label} 
                href={href} 
                target="_blank" // Opens in new tab
                rel="noopener noreferrer" // Security best practice for external links
                aria-label={label}
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 hover:-translate-y-1 transition-all duration-300 shadow-lg"
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