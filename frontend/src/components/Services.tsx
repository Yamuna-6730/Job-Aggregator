"use client";

import { ArrowUpRight, Search, FileText, Bell, TrendingUp, Send, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { NeoCard } from "./NeoCard";

const services = [
    {
        title: "Voice Job Search",
        highlight: "Voice-first",
        desc: "Search jobs by speaking naturally in your own language.",
        icon: Search,
        bgColor: "bg-white",
        titleBg: "bg-[#B9FF66]",
        theme: "light"
    },
    {
        title: "Multilingual Support",
        highlight: "Inclusive AI",
        desc: "Understands regional languages and translates intent automatically.",
        icon: FileText,
        bgColor: "bg-[#B9FF66]",
        titleBg: "bg-white",
        theme: "light"
    },
    {
        title: "Real-time Alerts",
        highlight: "Notifications",
        desc: "Get notified instantly for new matches.",
        icon: Bell,
        bgColor: "bg-[#191A23]",
        titleBg: "bg-white",
        theme: "dark"
    },
    {
        title: "Intent Understanding",
        highlight: "AI Parsing",
        desc: "Automatically extracts role, experience, location & job type.",
        icon: TrendingUp,
        bgColor: "bg-white",
        titleBg: "bg-[#B9FF66]",
        theme: "light"
    },
    {
        title: "Unified Job Listings",
        highlight: "Aggregation",
        desc: "Find jobs from LinkedIn, Naukri, Indeed & more in one place.",
        icon: Send,
        bgColor: "bg-[#B9FF66]",
        titleBg: "bg-white",
        theme: "light"
    },
    {
        title: "Simplified Results",
        highlight: "Accessibility",
        desc: "Clean job summaries with direct apply links—no clutter.",
        icon: UserCheck,
        bgColor: "bg-[#191A23]",
        titleBg: "bg-[#B9FF66]",
        theme: "dark"
    }
];

export default function Services() {
    return (
        <section id="features" className="py-20 max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-16">
                <h2 className="section-title">Services</h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {services.map((service, idx) => {
                    let cardColor: "white" | "lime" | "black" = "white";
                    if (service.bgColor.includes("#B9FF66")) cardColor = "lime";
                    if (service.bgColor.includes("#191A23")) cardColor = "black";

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <NeoCard color={cardColor} className="h-full flex justify-between items-center p-12">
                                <div className="flex flex-col gap-6 justify-between h-full z-10">
                                    <div className="space-y-2">
                                        <span className={`px-2 py-1 rounded-md text-xl font-bold ${service.titleBg} text-black inline-block`}>
                                            {service.highlight}
                                        </span>
                                        <h3 className="text-2xl font-bold">{service.title.replace(service.highlight, "").trim()}</h3>
                                    </div>

                                    <a href="#" className={`flex items-center gap-3 text-lg font-medium hover:underline ${service.theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                        <div className={`p-2 rounded-full ${service.theme === 'dark' ? 'bg-white text-black' : 'bg-black text-[#B9FF66]'}`}>
                                            <ArrowUpRight size={20} />
                                        </div>
                                        Learn more
                                    </a>
                                </div>

                                <div className="hidden md:block">
                                    <service.icon size={120} strokeWidth={1} className="opacity-80" />
                                </div>
                            </NeoCard>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
