"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { NeoCard } from "./NeoCard";

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    number: string;
}

function AccordionItem({ title, children, isOpen, onToggle, number }: AccordionItemProps) {
    return (
        <NeoCard className={`!p-0 overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-black/5' : ''}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-6 text-left group"
            >
                <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg font-bold border border-black transition-colors ${isOpen ? 'bg-[#B9FF66] text-black' : 'bg-black text-white'}`}>
                        {number}
                    </span>
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                <div className={`p-2 rounded-full border border-black transition-all ${isOpen ? 'bg-black text-[#B9FF66] rotate-180' : 'bg-white text-black'}`}>
                    <ChevronDown size={20} />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-black/10 mx-6 mt-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </NeoCard>
    );
}

export default function Accordion({ items }: { items: { title: string, content: string }[] }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    return (
        <div className="flex flex-col gap-4">
            {items.map((item, idx) => (
                <AccordionItem
                    key={idx}
                    title={item.title}
                    isOpen={activeIndex === idx}
                    onToggle={() => setActiveIndex(activeIndex === idx ? null : idx)}
                    number={`0${idx + 1}`}
                >
                    <p>{item.content}</p>
                </AccordionItem>
            ))}
        </div>
    );
}
