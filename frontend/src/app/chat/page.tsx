"use client"

import React, { useEffect, useMemo, useState } from "react"
import ChatInterface from "@/components/ChatInterface"
import ChatSidebar from "@/components/ChatSidebar"
import { supabase } from "@/lib/supabaseClient"
import { sendQueryStream } from "@/lib/api"

type Session = {
  id: string
  title?: string | null
  last_message?: string | null
}

type Message = {
  id: string
  session_id: string
  role: string
  content: string
  created_at: string
  metadata?: any
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[] | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  /* ---------------- Fetch sessions ---------------- */
  async function fetchSessions() {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("fetchSessions", error)
      return
    }
    setSessions(data || [])
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  /* ---------------- Load messages for session ---------------- */
  async function loadSessionMessages(sessionId: string | null) {
    if (!sessionId) {
      setMessages(undefined)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) console.error("loadSessionMessages", error)
    setMessages((data as Message[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    if (activeSessionId) loadSessionMessages(activeSessionId)
    else setMessages([])
  }, [activeSessionId])

  /* ---------------- Handlers ---------------- */
  function handleSelectSession(id: string) {
    // Clear current messages immediately to avoid showing previous session
    // while the new session messages are loading.
    setMessages(undefined)
    setActiveSessionId(id)
  }

  async function createNewSession(initialText?: string) {
    const sessionId = crypto.randomUUID()
    const now = new Date().toISOString()
    const title = initialText ? extractTitleFromText(initialText) : "NewChat"

    const { error } = await supabase.from("chat_sessions").insert({
      id: sessionId,
      title,
      last_message: initialText ?? null,
      created_at: now,
      updated_at: now,
      is_archived: false,
      is_deleted: false,
    })

    if (error) throw error

    setActiveSessionId(sessionId)
    // Don't force a refetch; the UI keeps its own message state while sending.
    setSessions((prev) => [{ id: sessionId, title, last_message: initialText ?? null }, ...prev])
    setMessages([])
    return sessionId
  }

  function handleNewChat() {
    // New session should be created only from this action.
    void createNewSession()
  }

  function extractTitleFromText(text: string) {
    return text.split(/\s+/).slice(0, 6).join(" ")
  }

  const initialMessages = useMemo(() => {
    return (messages || []).map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      metadata: m.metadata,
    }))
  }, [messages])

  /* ---------------- Send message ---------------- */
  async function onSendMessageStream(args: {
    text: string
    uiMode: "remote" | "pro"
    userMessageId: string
    assistantMessageId: string
    onStatus?: (s: string) => void
    onDelta?: (d: string) => void
  }): Promise<{ assistantText: string; jobs: any[] }> {
    setSending(true)

    try {
      let sessionId = activeSessionId
      if (!sessionId) {
        // Fallback: if user sends without clicking "+ New", create once.
        sessionId = await createNewSession(args.text)
      }

      const now = new Date().toISOString()

      // Update title only if placeholder / empty (first real user message)
      const current = sessions.find((s) => s.id === sessionId)
      const currentTitle = (current?.title || "").trim()
      const normalizedTitle = currentTitle.toLowerCase().replace(/\s+/g, "")
      const isPlaceholderTitle =
        !currentTitle ||
        normalizedTitle === "newchat" ||
        normalizedTitle === "new"

      let generatedTitle: string | null = null
      if (isPlaceholderTitle) {
        generatedTitle = args.text.trim().slice(0, 40) || "NewChat"
        await supabase
          .from("chat_sessions")
          .update({ title: generatedTitle, updated_at: now })
          .eq("id", sessionId)

        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: generatedTitle } : s))
        )
      }

      // Insert user message (same session_id)
      await supabase.from("chat_messages").insert({
        id: args.userMessageId,
        session_id: sessionId,
        role: "user",
        content: args.text,
        created_at: now,
      })

      // Update session last_message + updated_at (on user send)
      await supabase
        .from("chat_sessions")
        .update({
          last_message: args.text,
          updated_at: now,
        })
        .eq("id", sessionId)

      // Update sidebar immediately (no refetch)
      setSessions((prev) => {
        const existing = prev.find((s) => s.id === sessionId)
        const next: Session = {
          id: sessionId!,
          title: generatedTitle ?? existing?.title ?? "NewChat",
          last_message: args.text,
        }
        return [next, ...prev.filter((s) => s.id !== sessionId)]
      })

      // Stream agent response
      const mode = args.uiMode === "pro" ? "job" : "normal"
      const data = await sendQueryStream(args.text, {
        sessionId,
        mode,
        onStatus: args.onStatus,
        onDelta: args.onDelta,
      })

      const assistantText =
        data.final_answer ||
        "Here are some job opportunities based on your query."

      const jobs = data.structured_data?.jobs ?? []
      const metadata =
        jobs.length > 0
          ? {
              type: "job_results",
              jobs,
            }
          : null

      // Insert assistant message (same session_id)
      await supabase.from("chat_messages").insert({
        id: args.assistantMessageId,
        session_id: sessionId,
        role: "assistant",
        content: assistantText,
        created_at: new Date().toISOString(),
        metadata,
      })

      // Update session after assistant reply
      const updatedAt = new Date().toISOString()
      await supabase
        .from("chat_sessions")
        .update({
          last_message: assistantText,
          updated_at: updatedAt,
        })
        .eq("id", sessionId)

      // Update sidebar list without refetch
      setSessions((prev) => {
        const existing = prev.find((s) => s.id === sessionId)
        const next: Session = {
          id: sessionId!,
          title: existing?.title || generatedTitle || extractTitleFromText(args.text),
          last_message: assistantText,
        }
        return [next, ...prev.filter((s) => s.id !== sessionId)]
      })

      return { assistantText, jobs }
    } catch (err) {
      console.error("onSendMessageStream error", err)
      return { assistantText: "Sorry, an error occurred.", jobs: [] }
    } finally {
      setSending(false)
    }
  }

  /* ---------------- Render ---------------- */
  return (
    <main className="relative h-screen w-full flex overflow-hidden">
      {/* Sidebar (animated internally) */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={handleSelectSession}
        onNew={handleNewChat}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((v) => !v)}
      />

      {/* Chat area */}
      <div className="flex-1 p-4 md:p-6 min-w-0">
        <ChatInterface
          onActivate={() => {}}
          sessionId={activeSessionId}
          initialMessages={initialMessages}
          onSendMessageStream={onSendMessageStream}
        />
      </div>
    </main>
  )
}