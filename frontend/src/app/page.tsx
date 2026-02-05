"use client";

import { useRouter } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import Services from "@/components/Services";
import LogoTicker from "@/components/LogoTicker";
import { motion } from "framer-motion";

export default function Home() {
    const router = useRouter();

    return (
        <main className="min-h-screen overflow-hidden scroll-smooth">

            {/* Hero Section */}
            <section
                id="home"
                className="max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-40 md:pb-32 flex flex-col md:flex-row items-center gap-12"
            >

                <div className="flex-1 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black leading-[1.1]">
                            Navigating the <br />
                            <span className="bg-[#B9FF66] px-2 rounded-lg inline-block transform -rotate-1 hover:rotate-2 transition-transform cursor-default">
                                digital career
                            </span>{" "}
                            <br />
                            landscape for success
                        </h1>
                    </motion.div>

                    <motion.p
                        className="text-xl text-gray-600 max-w-lg leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        Your AI-powered career companion. We aggregate jobs from LinkedIn, Indeed, and more to give you a personalized recommendation instantly.
                    </motion.p>
                </div>

                <motion.div
                    className="flex-1 w-full relative"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                >
                    <div className="relative z-10 transform md:rotate-1 hover:rotate-0 transition-transform duration-500">
                        <ChatInterface onActivate={() => router.push("/chat")} />
                    </div>
                </motion.div>

            </section>

            <LogoTicker />
            <Services />

            <footer className="bg-[#191A23] text-white py-12 border-t border-black">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#B9FF66] text-black flex items-center justify-center rounded-md font-bold text-xl">
                            <span>J</span>
                        </div>
                        <span className="text-2xl font-bold">JobSage.ai</span>
                    </div>
                    <div className="text-gray-400 text-sm">
                        © 2026 JobSage AI. All rights reserved.
                    </div>
                </div>
            </footer>

        </main>
    );
}