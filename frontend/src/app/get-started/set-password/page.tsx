"use client";

import { ArrowRight } from "lucide-react";
import { NeoCard } from "@/components/NeoCard";
import { useRouter } from "next/navigation";

export default function SetPassword() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-20 flex justify-center">
            <NeoCard color="white" className="p-8 max-w-md w-full h-min space-y-6 mt-30">
                <h2 className="text-2xl font-bold text-black text-center">
                    Set your password
                </h2>

                <div>
                    <label className="block text-sm font-bold mb-2 text-black">
                        Password
                    </label>
                    <input
                        type="password"
                        className="w-full bg-white border-2 border-black rounded-xl p-4 text-black"
                        placeholder="Enter password"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-2 text-black">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        className="w-full bg-white border-2 border-black rounded-xl p-4 text-black"
                        placeholder="Confirm password"
                    />
                </div>

                <button
                    onClick={() => router.push("/chat")}
                    className="w-full bg-black text-[#B9FF66] border-2 border-black rounded-xl hover:bg-[#B9FF66] hover:text-black py-4 text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_#000]"
                >
                    Finish Setup <ArrowRight size={20} />
                </button>
            </NeoCard>
        </main>
    );
}