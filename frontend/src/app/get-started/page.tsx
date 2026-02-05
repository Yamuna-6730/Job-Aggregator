"use client";

import { ArrowRight } from "lucide-react";
import { NeoCard } from "@/components/NeoCard";

export default function GetStarted() {
    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B9FF66] rounded-full blur-[150px] opacity-20 pointer-events-none" />

            <div className="max-w-2xl mx-auto px-6 relative z-10 text-center">
                <span className="bg-[#B9FF66] text-black px-3 py-1 rounded-full font-bold text-sm uppercase tracking-wider mb-6 inline-block">
                    Free Alpha
                </span>
                <h1 className="text-5xl md:text-7xl font-bold mb-8">Start your search.</h1>
                <p className="text-xl text-gray-400 mb-12">
                    No credit card required. Just an agent that works for you.
                </p>

                <NeoCard color="white" className="p-8 text-left space-y-6">
                    <h2 className="text-2xl font-bold text-black mb-2">Create your Agent</h2>
                    <div>
                        <label className="block text-sm font-bold mb-2 text-black">Email Address</label>
                        <input type="email" className="w-full bg-white border-2 border-black rounded-xl p-4 focus:border-[#B9FF66] focus:ring-2 focus:ring-[#B9FF66] focus:outline-none transition-colors text-black" placeholder="you@company.com" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 text-black">Primary Goal</label>
                        <select className="w-full bg-white border-2 border-black rounded-xl p-4 focus:border-[#B9FF66] focus:ring-2 focus:ring-[#B9FF66] focus:outline-none transition-colors text-black">
                            <option>Find an Internship</option>
                            <option>Switch Careers</option>
                            <option>Find Remote Work</option>
                        </select>
                    </div>

                    <button className="w-full bg-black text-[#B9FF66] border-2 border-black rounded-xl hover:bg-[#B9FF66] hover:text-black py-4 text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_#000]">
                        Create Agent <ArrowRight size={20} />
                    </button>
                </NeoCard>

                <p className="mt-8 text-sm text-gray-500">By joining, you agree to our Terms and Privacy Policy.</p>
            </div>
        </main>
    );
}
