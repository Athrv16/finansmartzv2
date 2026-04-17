'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

export default function AssistantChat({ onActionsChange, onChatUpdate }) {
  const { user } = useUser()
  const pathname = usePathname()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const visibleMessages = messages

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    adjustTextareaHeight(inputRef.current)
  }, [input])

  function adjustTextareaHeight(element) {
    if (!element) return
    element.style.height = 'auto'
    const maxHeight = 220
    const nextHeight = Math.min(element.scrollHeight, maxHeight)
    element.style.height = `${nextHeight}px`
    element.style.overflowY = element.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  async function saveMessage(role, content) {
    if (!user) return
    try {
      await fetch('/api/assistant/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content }),
      })
    } catch (err) {
      console.error('Failed to save message:', err)
    }
  }

  async function deleteHistory() {
    if (!user) return
    try {
      const res = await fetch('/api/assistant/history', { method: 'DELETE' })
      if (!res.ok) return
      setMessages([])
    } catch (err) {
      console.error('Failed to delete history:', err)
    }
  }

  async function sendMessage(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    const isFirstUserMessage = messages.length === 0
    const nextMessages = [...messages, userMsg]

    setMessages(nextMessages)
    await saveMessage('user', text)
    setInput('')
    setLoading(true)

    onChatUpdate?.({
      title: text,
      messages: nextMessages,
      started: isFirstUserMessage,
    })

    try {
      const conversation = nextMessages.map((m) => ({
        role: m.role,
        content: m.text,
      }))

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation, currentRoute: pathname || '/' }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Assistant error')
      }

      const data = await res.json()
      const assistantText = data?.response || 'Sorry — I could not get an answer.'
      const assistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: assistantText,
      }

      setMessages((prev) => [...prev, assistantMessage])

      onChatUpdate?.({
        title: text,
        messages: [...nextMessages, assistantMessage],
        started: isFirstUserMessage,
      })
    } catch (err) {
      const message = `Error: ${err.message || String(err)}`
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: message,
      }
      const nextErrorMessages = [...nextMessages, errorMessage]
      setMessages(nextErrorMessages)
      await saveMessage('assistant', message)

      onChatUpdate?.({
        title: text,
        messages: nextErrorMessages,
        started: isFirstUserMessage,
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleInputKeyDown(event) {
    if (event.key !== 'Enter' || event.shiftKey) return

    event.preventDefault()
    sendMessage(event)
  }

  useEffect(() => {
    if (!onActionsChange) return undefined

    onActionsChange({
      deleteAllHistory: async () => {
        await deleteHistory()
      },
      startNewChat: () => {
        setMessages([])
        setInput('')
        setLoading(false)
        setTimeout(() => inputRef.current?.focus(), 60)
      },
      getSnapshot: () => ({
        messages,
      }),
      loadSnapshot: (snapshotMessages = []) => {
        if (!Array.isArray(snapshotMessages) || snapshotMessages.length === 0) return
        setMessages(snapshotMessages)
        setInput('')
        setLoading(false)
        setTimeout(() => inputRef.current?.focus(), 60)
      },
    })

    return () => {
      onActionsChange(null)
    }
  }, [onActionsChange, messages])

  return (
    <div className="flex h-full min-h-0 flex-col p-2 md:p-3">
      <div className="flex h-full min-h-0 flex-col gap-3 rounded-2xl border border-border/60 bg-white/85 p-4 shadow-sm dark:bg-slate-900/70">
        <div
          ref={listRef}
          className="relative min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-slate-50/70 p-3 dark:bg-slate-900/60"
        >
          {visibleMessages.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="text-center select-none">
                <div className="relative mx-auto mb-3 flex h-18 w-18 items-center justify-center rounded-3xl border border-slate-200/70 bg-white/70 p-2 shadow-sm opacity-40 dark:border-slate-700/70 dark:bg-slate-900/40">
                  <span className="absolute inset-0 -z-10 rounded-3xl bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.35),rgba(59,130,246,0.08)_45%,transparent_75%)] blur-2xl" />
                  <span className="absolute inset-1 -z-10 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.22),transparent_70%)] blur-xl" />
                  <Image
                    src="/logo.png"
                    alt="FinanSmartz logo"
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain"
                    priority={false}
                  />
                </div>
                <p className="text-2xl font-semibold tracking-tight text-slate-900/25 dark:text-white/20">
                  FinanSmartz
                </p>
                <p className="mt-2 text-sm text-slate-500/30 dark:text-slate-300/20">
                  Start a conversation to see it here
                </p>
              </div>
            </div>
          ) : (
            visibleMessages.map((m, index) => (
              <div
                key={`${m.role}-${m.id}-${index}`}
                className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block rounded-2xl p-3 ${
                    m.role === 'assistant'
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : 'bg-blue-50 dark:bg-blue-900/30'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {m.role === 'assistant' ? <ReactMarkdown>{m.text}</ReactMarkdown> : m.text}
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="mb-3 text-left">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex items-end gap-2 md:gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            rows={2}
            placeholder="Ask Anything..."
            className="min-h-[52px] flex-1 resize-none rounded-2xl border border-border/60 bg-white/80 px-4 py-3 leading-5 dark:bg-slate-900/70"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-[52px] shrink-0 self-end rounded-2xl bg-slate-900 px-5 text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>

        <footer className="text-xs text-muted-foreground">
          Tip: Don&apos;t share real bank details. Sora provides educational guidance — verify
          with a certified advisor for legal or tax matters.
        </footer>
      </div>
    </div>
  )
}
