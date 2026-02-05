"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import ChatInterface from "./ChatInterface";

export default function ChatPage() {
    const router = useRouter();

    return (
        <main className="min-h-screen flex items-center justify-center px-6 py-10">

            <div className="w-full max-w-5xl relative">

                {/* Close Button */}
                <button
                    onClick={() => router.push("/")}
                    className="absolute -top-10 right-0 flex items-center gap-2 text-sm font-semibold text-black"
                >
                    <X size={18} />
                    Close
                </button>

                {/* Chat UI (UNCHANGED) */}
                <ChatInterface />

            </div>

        </main>
    );
}
