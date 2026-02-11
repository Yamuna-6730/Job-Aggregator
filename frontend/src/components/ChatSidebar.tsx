"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"

type Session = {
  id: string
  title?: string | null
  last_message?: string | null
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onNew,
  isOpen,
  onToggle,
}: {
  sessions: Session[]
  activeSessionId?: string | null
  onSelect: (id: string) => void
  onNew: () => void
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <>
      {/* SIDEBAR */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="
              w-[280px] h-full
              bg-[#FAFAFA]
              border-r border-black/10
              flex flex-col
              relative
              z-40
            "
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-black">
                Your chats
              </span>

              <div className="flex items-center gap-3">
                {/* + New */}
                <button
                  onClick={onNew}
                  className="
                    text-xs font-semibold
                    px-3 py-1.5
                    rounded-full
                    text-black
                    border border-black
                    bg-white
                    hover:bg-[#B9FF66]
                    transition-all
                    shadow-[1px_1px_0_#000]
                    hover:shadow-[2px_2px_0_#000]
                    hover:-translate-x-[1px]
                    hover:-translate-y-[1px]
                  "
                >
                  + New
                </button>

                {/* Close sidebar */}
                <button
                  onClick={onToggle}
                  className="
                    w-8 h-8
                    rounded-full
                    bg-black
                    flex flex-col items-center justify-center
                    gap-[2px]
                    hover:scale-105
                    transition
                  "
                >
                  <span className="w-4 h-[2px] bg-[#B9FF66]" />
                  <span className="w-4 h-[2px] bg-[#B9FF66]" />
                  <span className="w-4 h-[2px] bg-[#B9FF66]" />
                </button>
              </div>
            </div>

            <div className="h-px bg-black/10 mx-4" />

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
              {sessions.length === 0 && (
                <div className="px-5 py-6 text-sm text-gray-500">
                  No chats yet
                </div>
              )}

              {sessions.map((s) => {
                const isActive = activeSessionId === s.id

                return (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s.id)}
                    className={`
                      w-full text-left
                      px-5 py-3
                      text-sm
                      transition
                      ${
                        isActive
                          ? "bg-gray-200 text-black"
                          : "hover:bg-gray-100 text-gray-800"
                      }
                    `}
                  >
                    <div className="truncate font-medium">
                      {s.title || "New chat"}
                    </div>

                    {s.last_message && (
                      <div className="truncate text-xs text-gray-500 mt-0.5">
                        {s.last_message}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          onClick={onToggle}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="
            fixed
            top-4
            left-4
            z-50
            w-9 h-9
            rounded-full
            bg-black
            flex flex-col items-center justify-center
            gap-[2px]
            shadow-[2px_2px_0_#000]
          "
        >
          <span className="w-4 h-[2px] bg-[#B9FF66]" />
          <span className="w-4 h-[2px] bg-[#B9FF66]" />
          <span className="w-4 h-[2px] bg-[#B9FF66]" />
        </motion.button>
      )}
    </>
  )
}