"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { question: "Do I need to download any software to use VaartaV?", answer: "Not at all. VaartaV runs entirely in your web browser..." },
  { question: "How secure are my video calls?", answer: "We take your privacy seriously. All video and audio streams are protected using bank-grade AES-256 end-to-end encryption..." },
  { question: "How does the 'Guest Chat' feature work?", answer: "Guest Chat allows anyone to instantly spin up a secure, 5-minute video room..." },
  { question: "Can I record my meetings?", answer: "Yes! Registered users can record their meetings with a single click..." },
  { question: "Is there a limit on how many people can join?", answer: "Our standard free tier supports up to 10 participants per room..." },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 px-4 w-full max-w-4xl mx-auto z-10 relative" id="faq">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold mb-4 text-zinc-900 dark:text-white transition-colors"
        >
          Frequently Asked <br className="md:hidden" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-cyan-500 to-indigo-600 dark:from-indigo-400 dark:via-cyan-400 dark:to-indigo-500">
            Questions
          </span>
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-zinc-600 dark:text-gray-400 text-lg transition-colors"
        >
          Everything you need to know before getting started.
        </motion.p>
      </div>

      <div className="flex flex-col gap-4">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;

          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden transition-colors duration-300 ${isOpen ? 'bg-zinc-50 dark:bg-white/10' : 'bg-white dark:bg-neutral-900/40 hover:bg-zinc-100 dark:hover:bg-neutral-900/80 backdrop-blur-md'}`}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className="text-lg font-semibold text-zinc-900 dark:text-gray-200 pr-8 transition-colors">
                  {faq.question}
                </span>
                
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-gray-400'}`}>
                  <motion.div
                    initial={false}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </motion.div>
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 text-zinc-600 dark:text-gray-400 leading-relaxed border-t border-zinc-200 dark:border-white/5 pt-4 mx-6 mt-[-10px] transition-colors">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}