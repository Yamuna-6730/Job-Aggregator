"use client";

import Services from "@/components/Services";
import { Zap, Shield, Globe, Cpu, Database, Lock, Activity } from "lucide-react";
import { NeoCard } from "@/components/NeoCard";
import { motion } from "framer-motion";

export default function Features() {
    return (
        <main className="min-h-screen pt-32 pb-20 relative overflow-hidden text-black">
            {/* Ambient Background Elements - Adjusted for Light Mode */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 mb-32 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        className="space-y-10"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-sm text-indigo-600 font-medium mb-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            Live System Status
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight text-gray-900">
                            Features that <br />
                            <span className="relative inline-block">
                                <span className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20"></span>
                                <span className="relative text-white bg-black px-6 py-2 rounded-2xl transform -rotate-2 inline-block shadow-[8px_8px_0px_#B9FF66]">
                                    empower
                                </span>
                            </span> <br />
                            your search.
                        </h1>
                        <p className="text-xl text-gray-600 max-w-lg leading-relaxed font-medium">
                            We don't just graze the surface. We dive deep, analyze structure, and recommend with precision. Explore the full suite of our agentic capabilities.
                        </p>

                        <div className="flex gap-4 pt-4">
                            <NeoCard className="px-6 py-3 bg-white hover:bg-gray-50 transition-colors cursor-pointer" color="white">
                                <span className="text-sm font-mono text-black font-bold">Fast_execution</span>
                            </NeoCard>
                            <NeoCard className="px-6 py-3 bg-[#B9FF66] hover:bg-[#a3ff40] transition-colors cursor-pointer" color="lime">
                                <span className="text-sm font-mono text-black font-bold">Secure_core</span>
                            </NeoCard>
                        </div>
                    </motion.div>

                    {/* Hero Visual - Enhanced "Live Agent" Terminal */}
                    <div className="relative">
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#B9FF66]/20 rounded-full blur-[80px] animate-pulse" />

                        {/* Floating decorative elements */}
                        <div className="absolute -left-12 top-20 z-20 animate-float" style={{ animationDelay: '1s' }}>
                            <NeoCard className="p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <Database className="w-6 h-6 text-black mb-2" />
                                <div className="h-1 w-12 bg-gray-200 rounded mb-1"></div>
                                <div className="h-1 w-8 bg-gray-200 rounded"></div>
                            </NeoCard>
                        </div>

                        <div className="absolute -right-6 bottom-12 z-20 animate-float" style={{ animationDelay: '2s' }}>
                            <NeoCard className="p-4 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                <Activity className="w-6 h-6 text-black mb-2" />
                                <div className="flex gap-1">
                                    <div className="h-4 w-1 bg-emerald-500 rounded-full"></div>
                                    <div className="h-6 w-1 bg-emerald-500 rounded-full"></div>
                                    <div className="h-3 w-1 bg-emerald-500 rounded-full"></div>
                                </div>
                            </NeoCard>
                        </div>

                        <NeoCard className="relative transform rotate-1 hover:rotate-0 transition-all duration-500 bg-[#0A0A0F] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden group text-white" color="black">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-4 px-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                <span className="ml-4 text-xs text-gray-400 font-mono flex-1 text-center">agent_v2.0.exe — zsh — 80x24</span>
                            </div>

                            <div className="space-y-4 font-mono text-sm leading-relaxed p-2">
                                <div className="flex gap-2 group-hover:translate-x-1 transition-transform">
                                    <span className="text-[#B9FF66]">$</span>
                                    <span className="text-gray-100">init_search --target="Software Engineer" --mode=deep</span>
                                </div>
                                <div className="pl-4 text-gray-400 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                                        <span>Parsing sources... [LinkedIn, Indeed, Glassdoor]</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span>Filtering for "Remote" & "React"</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                        <span>Structuring unstructured HTML...</span>
                                    </div>
                                </div>
                                <div className="pl-4 pt-2 border-l-2 border-[#B9FF66]/30 ml-1">
                                    <span className="text-[#B9FF66] block mb-1">{">"} Analysis Complete</span>
                                    <span className="text-black bg-[#B9FF66] px-2 py-0.5 rounded text-xs font-bold">Found 14 high-match opportunities!</span>
                                </div>

                                <div className="flex gap-2 mt-4 animate-pulse">
                                    <span className="text-[#B9FF66]">$</span>
                                    <span className="w-2 h-5 bg-[#B9FF66]" />
                                </div>
                            </div>
                        </NeoCard>
                    </div>
                </div>
            </div>

            {/* Re-using the Services grid as the core features display */}
            <div className="relative z-10">
                <Services />
            </div>

            {/* Additional Feature Details Section */}
            <section className="max-w-7xl mx-auto px-6 mt-32 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-black/10 pb-8">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black">Under the Hood</h2>
                        <p className="text-gray-600 max-w-md">Built for performance, privacy, and precision.</p>
                    </div>
                    <div className="hidden md:block">
                        <Cpu className="w-12 h-12 text-black/10" />
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <NeoCard className="p-8 hover:-translate-y-1 transition-transform group" color="white">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 group-hover:bg-indigo-100 transition-colors border-2 border-black">
                            <Shield size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-black">Privacy First</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            Your data stays local. We don't sell your resume or search history. The agent runs Ephemerally for each session.
                        </p>
                    </NeoCard>

                    <NeoCard className="p-8 hover:-translate-y-1 transition-transform group" color="white">
                        <div className="w-14 h-14 bg-[#B9FF66] rounded-2xl flex items-center justify-center mb-6 text-black group-hover:bg-[#a3ff40] transition-colors border-2 border-black">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-black">Speed of Light</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            Powered by Gemini 2.0 Flash, our structuring node processes inconsistent HTML into clean JSON in milliseconds.
                        </p>
                    </NeoCard>

                    <NeoCard className="p-8 hover:-translate-y-1 transition-transform group" color="white">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:bg-purple-100 transition-colors border-2 border-black">
                            <Lock size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-black">Encrypted Core</h3>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            End-to-end encryption ensures your personal data and potential job opportunities remain for your eyes only.
                        </p>
                    </NeoCard>
                </div>
            </section>
        </main >
    );
}
