"use client";

import Link from "next/link";
import { Send, MapPin, Phone, Mail, Twitter, Linkedin, Github, Youtube } from "lucide-react";

const menuLinks = [
  { label: 'Home', href: '/' },
  { label: 'About us', href: '/about' },
  { label: 'Features', href: '/#features' }, 
  { label: 'FAQ', href: '/#faq' },           
  { label: 'Pricing', href: '/#pricing' },   
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
    <footer className="w-full border-t border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/50 backdrop-blur-xl pt-20 pb-10 relative z-10 transition-colors duration-500">
      <div className="container mx-auto px-6 lg:px-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
          
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
              <form className="relative flex items-center" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  required
                  placeholder="Email address" 
                  className="w-full bg-zinc-50 dark:bg-neutral-900/50 border border-zinc-200 dark:border-white/10 rounded-full py-3 pl-5 pr-12 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors shadow-sm"
                />
                <button type="submit" className="absolute right-1 p-2 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          <div>
            <h4 className="text-zinc-900 dark:text-white font-bold mb-6 transition-colors">Menu</h4>
            <ul className="flex flex-col gap-4 text-sm text-zinc-600 dark:text-gray-400">
              {menuLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

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