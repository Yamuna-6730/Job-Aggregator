"use client";

import { useRouter } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
    const router = useRouter();

    return (
        <main className="h-screen w-screen p-4 md:p-6">
            <ChatInterface
                fullscreen
                onClose={() => router.push("/")}
            />
        </main>
    );
}
