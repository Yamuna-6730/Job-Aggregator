"use client";

import { useRouter } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";

export default function AssistantPage() {
  const router = useRouter();

  return (
    <main className="h-screen w-screen p-4 md:p-6 bg-[#F3F3F3]">
      <ChatInterface onActivate={() => {}} />
    </main>
  );
}
