"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, X, Maximize2, Mic } from "lucide-react";
import { sendQuery, Job, fetchInitialJobs } from "@/lib/api";
import JobCard from "./JobCard";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  jobs?: Job[];
}

export default function ChatInterface({
  onActivate,
}: {
  onActivate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isChatPage = pathname === "/chat" || pathname === "/assistant";
  const jobsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"remote" | "pro">("remote");
  const [jobResults, setJobResults] = useState<Job[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm JobSage. Ask me to find internships, jobs, or explain concepts.",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const dummyJobs: Job[] = [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      onActivate?.();
    }

    const userMsg: Message = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const data = await sendQuery(userMsg.content);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.response || data.final_answer || "Here are the results.",
        },
      ]);

      // Update job results if backend returns jobs
      if (data.structured_data?.jobs && data.structured_data.jobs.length > 0) {
        setJobResults(data.structured_data.jobs);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error connecting to the agent.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={`flex flex-col bg-white border border-black shadow-[0_5px_0_#191A23]
            ${
              isChatPage
                ? "h-[calc(100svh-4rem)] rounded-[48px] m-4"
                : "h-150 rounded-[45px]"
            }`}
    >
      {/* Header */}
      <div className="bg-[#B9FF66] p-4 border-b border-black flex items-center justify-between rounded-t-[45px]">
        <div className="flex items-center gap-3">
          <div className="bg-black text-[#B9FF66] p-2 rounded-full">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-black">JobSage Assistant</h3>
            <p className="text-xs font-semibold text-black opacity-80">
              Online • AI Agent
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-10">
          {/* Expand button – ONLY on home */}
          {!isChatPage && (
            <button
              onClick={() => router.push("/chat")}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-black bg-black text-[#B9FF66]
                    transition-all duration-200 ease-out
                    hover:scale-110 hover:shadow-md
                    active:scale-95"
              aria-label="Expand chat"
            >
              <Maximize2 size={16} />
            </button>
          )}

          {/* Mode Toggle – ONLY on /chat */}
          {isChatPage && (
            <div className="relative flex bg-white border border-black rounded-full p-1">
              {/* Sliding pill */}
              <span
                className={`absolute top-1 bottom-1 w-20 rounded-full bg-black transition-transform duration-300 ease-out
                        ${mode === "remote" ? "translate-x-0" : "translate-x-20"}`}
              />

              <button
                onClick={() => setMode("remote")}
                className={`relative z-10 w-20 px-3 py-1 text-sm font-semibold rounded-full
                        ${mode === "remote" ? "text-[#B9FF66]" : "text-black opacity-60"}`}
              >
                Remote
              </button>

              <button
                onClick={() => setMode("pro")}
                className={`relative z-10 w-20 px-3 py-1 text-sm font-semibold rounded-full
                        ${mode === "pro" ? "text-[#B9FF66]" : "text-black opacity-60"}`}
              >
                Pro
              </button>
            </div>
          )}

          {/* Close – ONLY on /chat */}
          {isChatPage && (
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-black bg-black text-[#B9FF66] transition-all duration-200 ease-out
                    hover:scale-110 hover:shadow-md
                    active:scale-95"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages / Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F3F3F3] scroll-smooth overscroll-contain relative">
        {/* REMOTE MODE UI */}
        {mode === "remote" && (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative group cursor-pointer"
            >
              {/* Outer Glow Ring */}
              <div className="absolute -inset-4 bg-black/10 rounded-full blur-xl group-hover:bg-black/20 transition-all duration-500" />

              {/* Mic Button */}
              <button
                className="relative w-32 h-32 rounded-full bg-black flex items-center justify-center shadow-2xl 
                         transition-transform duration-200 active:scale-95 group-hover:scale-105"
              >
                <div className="w-24 h-24 rounded-full border-2 border-[#B9FF66]/30 flex items-center justify-center">
                  <Mic size={48} className="text-[#B9FF66]" />
                </div>
              </button>
            </motion.div>

            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-black">Tap to Speak</h3>
              <p className="text-gray-500 font-medium">I'm listening...</p>
            </div>
          </div>
        )}

        {/* PRO MODE UI (Chat) */}
        {mode === "pro" && (
          <>
            {/* JobCards - Now displayed FIRST */}
            {hasUserInteracted && (
              <div className="mb-8 flex items-center gap-3 w-full max-w-[1400px] mx-auto">
                {/* Left Arrow */}
                <button
                  onClick={() => {
                    const container = jobsRef.current;
                    if (container) {
                      container.scrollBy({ left: -1260, behavior: "smooth" });
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-black text-[#B9FF66]
                            flex items-center justify-center shadow-md flex-shrink-0
                            hover:scale-110 transition border-2 border-black"
                >
                  ‹
                </button>

                {/* Job Cards Container */}
                <div className="flex-1 overflow-hidden">
                  <div
                    ref={jobsRef}
                    className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar"
                  >
                    {(jobResults.length > 0 ? jobResults : dummyJobs).map(
                      (job, index) => (
                        <div key={index} className="w-[400px] flex-shrink-0">
                          <JobCard job={job} />
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => {
                    const container = jobsRef.current;
                    if (container) {
                      container.scrollBy({ left: 1260, behavior: "smooth" });
                    }
                  }}
                  className="w-10 h-10 rounded-full bg-black text-[#B9FF66]
                            flex items-center justify-center shadow-md flex-shrink-0
                            hover:scale-110 transition border-2 border-black"
                >
                  ›
                </button>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 text-base font-medium border border-black shadow-[2px_2px_0_#000]
                            ${
                              msg.role === "user"
                                ? "bg-[#B9FF66] text-black rounded-l-3xl rounded-br-md"
                                : "bg-white text-black rounded-r-3xl rounded-bl-md"
                            }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          ul: ({ node, ...props }) => (
                            <ul
                              className="list-disc pl-5 mb-2 space-y-1"
                              {...props}
                            />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol
                              className="list-decimal pl-5 mb-2 space-y-1"
                              {...props}
                            />
                          ),
                          li: ({ node, ...props }) => (
                            <li className="mb-0.5" {...props} />
                          ),
                          p: ({ node, ...props }) => (
                            <p className="mb-2 last:mb-0" {...props} />
                          ),
                          h1: ({ node, ...props }) => (
                            <h1
                              className="text-xl font-bold mb-3 mt-1"
                              {...props}
                            />
                          ),
                          h2: ({ node, ...props }) => (
                            <h2
                              className="text-lg font-bold mb-2 mt-3"
                              {...props}
                            />
                          ),
                          h3: ({ node, ...props }) => (
                            <h3
                              className="text-md font-bold mb-2 mt-2"
                              {...props}
                            />
                          ),
                          strong: ({ node, ...props }) => (
                            <strong
                              className="font-bold text-black"
                              {...props}
                            />
                          ),
                          a: ({ node, ...props }) => (
                            <a
                              className="text-blue-600 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            />
                          ),
                          code: ({
                            node,
                            className,
                            children,
                            ...props
                          }: any) => {
                            const match = /language-(\w+)/.exec(
                              className || "",
                            );
                            const isInline =
                              !match && !String(children).includes("\n");
                            return isInline ? (
                              <code
                                className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono text-pink-600"
                                {...props}
                              >
                                {children}
                              </code>
                            ) : (
                              <div className="bg-gray-900 text-white rounded-md p-3 my-2 overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </div>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-black text-sm">
                <Loader2 className="animate-spin" size={16} />
                Thinking & Searching...
              </div>
            )}

            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input - Only show in PRO mode */}
      {mode === "pro" && (
        <div className="p-4 bg-white border-t border-black rounded-b-[45px] sticky bottom-0 z-10">
          <form onSubmit={handleSubmit} className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your query here..."
              className="w-full bg-gray-100 border border-black rounded-xl py-4 pl-4 pr-14 text-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-[#B9FF66] p-2 rounded-lg"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
