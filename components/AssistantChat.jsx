'use client'

import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useUser } from '@clerk/nextjs'

export default function AssistantChat() {
  const { user } = useUser()
  const [messages, setMessages] = useState([
    { id: 'sys-1', role: 'system', text: 'Hi, I am Sora — your AI assistant! \nHow can I help you today?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Load chat history once per user
  useEffect(() => {
    if (user && !historyLoaded) {
      loadHistory()
    }
  }, [user, historyLoaded])

  // Auto-scroll to the latest message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  // Load chat history from backend
  async function loadHistory() {
    try {
      const res = await fetch('/api/assistant/history')
      if (res.ok) {
        const data = await res.json()
        const historyMessages = data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          text: m.content,
        }))
        // Replace messages with system + history (not append)
        setMessages([
          { id: 'sys-1', role: 'system', text: 'Hi, I am Sora — your AI assistant! \nHow can I help you today?' },
          ...historyMessages,
        ])
        setHistoryLoaded(true)
      }
    } catch (err) {
      console.error('Failed to load history:', err)
    }
  }

  // Save message to database
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

  // Delete all chat history
  async function deleteHistory() {
    if (!user) return
    try {
      const res = await fetch('/api/assistant/history', { method: 'DELETE' })
      if (res.ok) {
        setMessages([
          { id: 'sys-1', role: 'system', text: 'Hi, I am Sora — your AI assistant! \nHow can I help you today?' },
        ])
        setHistoryLoaded(false)
      }
    } catch (err) {
      console.error('Failed to delete history:', err)
    }
  }

  // Send message to assistant
  async function sendMessage(e) {
    e && e.preventDefault()
    const text = input.trim()
    if (!text) return

    const userMsg = { id: `u-${Date.now()}`, role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    await saveMessage('user', text)
    setInput('')
    setLoading(true)

    try {
      const conversation = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.text,
      }))

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: conversation }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Assistant error')
      }

      const data = await res.json()
      const assistantText = data?.response || 'Sorry — I could not get an answer.'

      const assistantMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: assistantText,
      }

      setMessages((prev) => [...prev, assistantMsg])
      // Assistant message is saved automatically on backend
    } catch (err) {
      const errMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: `Error: ${err.message || String(err)}`,
      }
      setMessages((prev) => [...prev, errMsg])
      await saveMessage('assistant', `Error: ${err.message || String(err)}`)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  // Quick prompt button handler
  function quickPrompt(text) {
    setInput(text)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl shadow p-4 flex flex-col gap-4">
        {/* Header */}
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sora - AI Chatbot</h3>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-sm rounded-md border"
              onClick={() =>
                quickPrompt(
                  'Create a 6-month savings plan for someone earning ₹60,000/month with a goal to save ₹1,00,000.'
                )
              }
            >
              Savings Plan
            </button>
            <button
              className="px-3 py-1 text-sm rounded-md border"
              onClick={() =>
                quickPrompt(
                  'Suggest 3 diversified investment ideas for a conservative investor with ₹2 lakh to invest for 3 years.'
                )
              }
            >
              Investment Ideas
            </button>
            {user && (
              <button
                className="px-3 py-1 text-sm rounded-md border bg-red-50 text-red-600 hover:bg-red-100"
                onClick={deleteHistory}
              >
                Delete All History
              </button>
            )}
          </div>
        </header>

        {/* Chat Messages */}
        <div
          ref={listRef}
          className="h-72 overflow-y-auto border rounded-lg p-3 bg-slate-50 dark:bg-slate-900"
        >
          {messages.map((m, index) => (
            <div
              key={`${m.role}-${m.id}-${index}`}
              className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  m.role === 'assistant'
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'bg-blue-50 dark:bg-blue-900/30'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {m.role === 'assistant' ? (
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  ) : (
                    m.text
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={sendMessage} className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            placeholder="Ask about budgeting, investments, goals..."
            className="flex-1 p-2 rounded-md border resize-none bg-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md bg-slate-800 text-white disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </form>

        {/* Footer */}
        <footer className="text-xs text-muted-foreground">
          Tip: Don’t share real bank details. Sora provides educational guidance — verify
          with a certified advisor for legal or tax matters.
        </footer>
      </div>
    </div>
  )
}