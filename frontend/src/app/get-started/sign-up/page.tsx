"use client";

import { ArrowRight } from "lucide-react";
import { NeoCard } from "@/components/NeoCard";
import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = [
    { label: "Student / Fresher", emoji: "🎓" },
    { label: "Working Professional", emoji: "🧑‍💼" },
    { label: "Blue-Collar / Gig Worker", emoji: "👩‍🔧" },
    { label: "Employer / Recruiter", emoji: "🏢" },
    { label: "Career Re-starter / Homemaker / Retired", emoji: "🧓" },
];

export default function GetStarted() {
    const [role, setRole] = useState<string | null>(null);
    const router = useRouter();

    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-125 h-125 bg-[#B9FF66] rounded-full blur-[150px] opacity-20 pointer-events-none" />

            <div className="max-w-2xl mx-auto px-6 relative z-10 text-center">
                <span className="bg-[#B9FF66] text-black px-3 py-1 rounded-full font-bold text-sm uppercase tracking-wider mb-6 inline-block">
                    Free Alpha
                </span>

                <h1 className="text-5xl md:text-7xl font-bold mb-8">
                    Start your search.
                </h1>

                <p className="text-xl text-gray-400 mb-12">
                    No credit card required. Just an agent that works for you.
                </p>

                <NeoCard color="white" className="p-8 text-left space-y-6">
                    <h2 className="text-2xl font-bold text-black">
                        Set Up Your Job Guide
                    </h2>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-bold mb-2 text-black">
                            Your Name
                        </label>
                        <input
                            type="text"
                            className="w-full bg-white border-2 border-black rounded-xl p-4 text-black"
                            placeholder="Enter your name"
                        />
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-bold mb-3 text-black">
                            Role
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ROLES.map((item) => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => setRole(item.label)}
                                    className={`border-2 border-black rounded-xl p-4 text-left font-bold transition-all shadow-[3px_3px_0px_#000]
                                        ${
                                            role === item.label
                                                ? "bg-[#B9FF66] text-black"
                                                : "bg-white text-black hover:bg-gray-100"
                                        }
                                        ${
                                            item.label === "Career Re-starter / Homemaker / Retired"
                                                ? "sm:col-span-2"
                                                : ""
                                        }
                                    `}
                                >
                                    <span className="mr-2">{item.emoji}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-bold mb-2 text-black">
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="w-full bg-white border-2 border-black rounded-xl p-4 text-black"
                            placeholder="you@gmail.com"
                        />
                        <p className="text-xs text-gray-600 mt-2">
                            We’ll verify your email and help you set a password next.
                        </p>
                    </div>

                    {/* CTA */}
                    <button
                        onClick={() => router.push("/get-started/verify")}
                        className="w-full bg-black text-[#B9FF66] border-2 border-black rounded-xl hover:bg-[#B9FF66] hover:text-black py-4 text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_#000]"
                    >
                        Continue <ArrowRight size={20} />
                    </button>

                    {/* OR Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-black opacity-20" />
                        <span className="text-xs font-bold text-black opacity-60">
                            OR
                        </span>
                        <div className="flex-1 h-px bg-black opacity-20" />
                    </div>

                    {/* Social Auth */}
                    <div className="flex justify-center gap-4 pt-2">
                        {/* Google */}
                        <button
                            title="Continue with Google"
                            className="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-[3px_3px_0px_#000]"
                        >
                            <svg viewBox="0 0 48 48" className="w-5 h-5">
                                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.1 29.4 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1 7.4 2.7l5.7-5.7C33.4 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 19 13 24 13c2.8 0 5.4 1 7.4 2.7l5.7-5.7C33.4 6.1 28.9 4 24 4c-7.6 0-14.2 4.3-17.7 10.7z"/>
                                <path fill="#4CAF50" d="M24 44c4.3 0 8.4-1.6 11.5-4.2l-5.3-4.5c-1.5 1-3.5 1.7-6.2 1.7-5.3 0-9.8-3.6-11.4-8.4l-6.5 5C9.6 39.7 16.3 44 24 44z"/>
                                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.6-4.6 6.3-8.9 6.3-2.7 0-5.2-.9-7.1-2.4l-6.5 5C16.3 41.3 20 44 24 44c11.1 0 20-8.9 20-20 0-1.2-.1-2.3-.4-3.5z"/>
                            </svg>
                        </button>

                        {/* LinkedIn */}
                        <button
                            title="Continue with LinkedIn"
                            className="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-[3px_3px_0px_#000]"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0A66C2]">
                                <path d="M22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0zM7.09 20.45H3.56V9h3.53v11.45zM5.33 7.43c-1.13 0-2.05-.93-2.05-2.07 0-1.14.92-2.07 2.05-2.07s2.05.93 2.05 2.07c0 1.14-.92 2.07-2.05 2.07zM20.45 20.45h-3.53v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.95v5.66h-3.53V9h3.39v1.56h.05c.47-.9 1.63-1.85 3.35-1.85 3.58 0 4.24 2.36 4.24 5.43v6.31z"/>
                            </svg>
                        </button>

                        {/* Indeed */}
                        <button
                            title="Continue with Indeed"
                            className="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center hover:bg-gray-100 transition shadow-[3px_3px_0px_#000]"
                        >
                            <span className="text-[#003A9B] font-extrabold text-lg">
                                i
                            </span>
                        </button>
                    </div>

                </NeoCard>
            </div>
        </main>
    );
}