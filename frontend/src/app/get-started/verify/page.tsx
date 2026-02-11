"use client";

import { ArrowRight } from "lucide-react";
import { NeoCard } from "@/components/NeoCard";
import { useRouter } from "next/navigation";

export default function VerifyEmail() {
    const router = useRouter();

    return (
        <main className="min-h-screen bg-black text-white pt-32 pb-20 flex justify-center">
            <NeoCard color="white" className="p-8 max-w-md w-full h-min text-center space-y-6 mt-36">
                    <h2 className="text-2xl font-bold text-black">
                        Verify your email
                    </h2>

                    <p className="text-gray-700">
                        We’ve sent a verification link to your email address.
                        Please verify to continue.
                    </p>

                    <button
                        onClick={() => router.push("/get-started/set-password")}
                        className="w-full bg-black text-[#B9FF66] border-2 border-black rounded-xl hover:bg-[#B9FF66] hover:text-black py-4 text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_#000]"
                    >
                        Continue <ArrowRight size={20} />
                    </button>
                </NeoCard>
        </main>
    );
}