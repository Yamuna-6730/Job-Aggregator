"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, X, Maximize2, Mic } from "lucide-react";
import { sendQuery, Job } from "@/lib/api";
import JobCard from "./JobCard";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MessageMetadata {
  type?: string;
  jobs?: Job[];
  [key: string]: any;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: MessageMetadata | null;
}

interface ChatInterfaceProps {
  onActivate?: () => void;
  initialMessages?: Message[];
  sessionId?: string | null;
  onSendMessage?: (text: string) => Promise<{
    response: string;
    structured_data?: {
      jobs: Job[];
    };
    final_answer?: string;
  }>;
  onSendMessageStream?: (args: {
    text: string;
    uiMode: "remote" | "pro";
    userMessageId: string;
    assistantMessageId: string;
    onStatus?: (s: string) => void;
    onDelta?: (d: string) => void;
  }) => Promise<{
    assistantText: string;
    jobs: Job[];
  }>;
}

export default function ChatInterface({
  onActivate,
  initialMessages,
  sessionId,
  onSendMessage,
  onSendMessageStream,
}: ChatInterfaceProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isChatPage = pathname === "/chat" || pathname === "/assistant";
  const jobsRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"remote" | "pro">("remote");

  const defaultGreeting: Message = {
    id: "greeting",
    role: "assistant",
    content:
      "Hello! I'm JobSage. Ask me to find internships, jobs, or explain concepts.",
  };

  const lastSessionIdRef = useRef<string | null | undefined>(sessionId);
  const streamingAssistantIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<Message[]>(() => {
    if (initialMessages && initialMessages.length > 0) {
      return [defaultGreeting, ...initialMessages];
    }
    return [defaultGreeting];
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages((prev) => {
        const nextBase =
          initialMessages.length > 0
            ? [defaultGreeting, ...initialMessages]
            : [defaultGreeting];

        const sessionChanged = lastSessionIdRef.current !== sessionId;
        lastSessionIdRef.current = sessionId;

        // On session switch, replace entirely (but keep greeting).
        if (sessionChanged) {
          streamingAssistantIdRef.current = null;
          return nextBase;
        }

        // Same session: merge new fetched messages without wiping local in-flight UI.
        const seen = new Set(nextBase.map((m) => m.id));
        const extras = prev.filter((m) => !seen.has(m.id) && m.id !== "greeting");
        return extras.length > 0 ? [...nextBase, ...extras] : nextBase;
      });
    }
  }, [initialMessages, sessionId]);

  const [loading, setLoading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [statusText, setStatusText] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      onActivate?.();
    }

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();
    streamingAssistantIdRef.current = assistantMessageId;

    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      content: query,
    };

    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      metadata: null,
    };

    // Append (never replace) — prevents "query disappears" + job cards flicker.
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setQuery("");
    setLoading(true);
    setStatusText("Thinking...");

    try {
      if (onSendMessageStream) {
        let sawAnyDelta = false;

        const streamed = await onSendMessageStream({
          text: userMsg.content,
          uiMode: mode,
          userMessageId,
          assistantMessageId,
          onStatus: (s) => setStatusText(s),
          onDelta: (d) => {
            sawAnyDelta = true;
            const targetId = streamingAssistantIdRef.current || assistantMessageId;
            setMessages((prev) => {
              const idx = prev.findIndex((m) => m.id === targetId);
              if (idx === -1) return prev;
              const next = [...prev];
              const current = next[idx];
              next[idx] = {
                ...current,
                content: (current.content || "") + d,
              };
              return next;
            });
          },
        });

        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === assistantMessageId);
          if (idx === -1) return prev;
          const next = [...prev];
          const current = next[idx];

          const jobs = streamed.jobs || [];
          const metadata =
            jobs.length > 0
              ? ({
                  type: "job_results",
                  jobs,
                } as MessageMetadata)
              : null;

          const content =
            sawAnyDelta && current.content?.length
              ? current.content
              : streamed.assistantText || current.content || "Here are the results.";

          next[idx] = { ...current, content, metadata };
          return next;
        });
      } else {
        const data = onSendMessage
          ? await onSendMessage(userMsg.content)
          : await sendQuery(userMsg.content);

        const assistantText =
          data.response || data.final_answer || "Here are the results.";

        const jobs = data.structured_data?.jobs || [];
        const metadata =
          jobs.length > 0
            ? ({
                type: "job_results",
                jobs,
              } as MessageMetadata)
            : null;

        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === assistantMessageId);
          if (idx === -1) {
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: assistantText,
                metadata,
              },
            ];
          }
          const next = [...prev];
          next[idx] = { ...next[idx], content: assistantText, metadata };
          return next;
        });
      }
    } catch {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === assistantMessageId);
        if (idx === -1) {
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: "Sorry, I encountered an error connecting to the agent.",
              metadata: null,
            },
          ];
        }
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          content: "Sorry, I encountered an error connecting to the agent.",
          metadata: null,
        };
        return next;
      });
    } finally {
      setLoading(false);
      setStatusText("");
      streamingAssistantIdRef.current = null;
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

        <div className="flex items-center gap-10">
          {!isChatPage && (
            <button
              onClick={() => router.push("/chat")}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-black bg-black text-[#B9FF66]"
            >
              <Maximize2 size={16} />
            </button>
          )}

          {isChatPage && (
            <div className="relative flex bg-white border border-black rounded-full p-1">
              <span
                className={`absolute top-1 bottom-1 w-20 rounded-full bg-black transition-transform duration-300
                ${mode === "remote" ? "translate-x-0" : "translate-x-20"}`}
              />
              <button
                onClick={() => setMode("remote")}
                className={`relative z-10 w-20 px-3 py-1 text-sm font-semibold
                ${mode === "remote" ? "text-[#B9FF66]" : "text-black opacity-60"}`}
              >
                Remote
              </button>
              <button
                onClick={() => setMode("pro")}
                className={`relative z-10 w-20 px-3 py-1 text-sm font-semibold
                ${mode === "pro" ? "text-[#B9FF66]" : "text-black opacity-60"}`}
              >
                Pro
              </button>
            </div>
          )}

          {isChatPage && (
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-full border border-black bg-black text-[#B9FF66]"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F3F3F3] rounded-b-[45px] no-scrollbar">
        {/* REMOTE MODE */}
        {mode === "remote" && (
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative group cursor-pointer"
            >
              <div className="absolute -inset-4 bg-black/10 rounded-full blur-xl" />
              <button className="relative w-32 h-32 rounded-full bg-black flex items-center justify-center">
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

        {/* PRO MODE*/}
        {mode === "pro" &&
          messages.map((msg, idx) => {
            const isLastUser =
              msg.role === "user" &&
              idx === messages.map((m) => m.role).lastIndexOf("user");

            const jobsForMessage =
              msg.metadata?.type === "job_results" &&
              Array.isArray(msg.metadata.jobs)
                ? (msg.metadata.jobs as Job[])
                : [];

            return (
              <div key={msg.id} className="space-y-4">
                <motion.div
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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>

                {/* Thinking indicator — AFTER user query */}
                {isLastUser && loading && (
                  <div className="flex items-center gap-2 text-black text-sm">
                    <Loader2 className="animate-spin" size={16} />
                    {statusText || "Thinking & Searching..."}
                  </div>
                )}

                {/* Job cards — driven by message metadata */}
                {jobsForMessage.length > 0 && (
                  <div className="flex items-center gap-3 w-full max-w-[1400px] mx-auto">
                    <button
                      onClick={() =>
                        jobsRef.current?.scrollBy({
                          left: -1260,
                          behavior: "smooth",
                        })
                      }
                      className="w-10 h-10 rounded-full bg-black text-[#B9FF66]
                      flex items-center justify-center shadow-md flex-shrink-0
                      hover:scale-110 transition border-2 border-black"
                    >
                      ‹
                    </button>

                    <div className="flex-1 overflow-hidden">
                      <div
                        ref={jobsRef}
                        className="flex gap-5 overflow-x-auto scroll-smooth no-scrollbar"
                      >
                        {jobsForMessage.map((job, i) => (
                          <div key={i} className="w-[410px] flex-shrink-0">
                            <JobCard job={job} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        jobsRef.current?.scrollBy({
                          left: 1260,
                          behavior: "smooth",
                        })
                      }
                      className="w-10 h-10 rounded-full bg-black text-[#B9FF66]
                      flex items-center justify-center shadow-md flex-shrink-0
                      hover:scale-110 transition border-2 border-black"
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            );
          })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {mode === "pro" && (
        <div className="p-4 bg-white border-t border-black rounded-b-[45px]">
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