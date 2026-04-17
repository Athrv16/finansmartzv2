// FILE: components/FloatingChat.jsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import AssistantChat from './AssistantChat';
import { Maximize2, MessageCircle, Minimize2, PanelLeftClose, PanelLeftOpen, Sparkles, SquarePen, Trash2, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const SYSTEM_GREETING_TEXT = 'Hi, I am Sora — your AI assistant! \nHow can I help you today?';
const TITLE_STOP_WORDS = new Set([
  'a', 'about', 'after', 'all', 'and', 'any', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'for',
  'from', 'get', 'give', 'help', 'how', 'i', 'in', 'into', 'is', 'it', 'me', 'my', 'of', 'on',
  'or', 'please', 'show', 'sora', 'tell', 'the', 'to', 'with', 'what', 'when', 'where', 'which',
  'who', 'why', 'you', 'your', 'hi', 'hello', 'hey', 'assistant', 'need', 'want', 'make', 'update',
]);

function deriveChatTitle(messages = []) {
  const meaningfulText = messages
    .filter((message) => message?.role === 'user')
    .map((message) => String(message?.text || '').trim())
    .filter((text) => text && text !== SYSTEM_GREETING_TEXT)
    .join(' ')
    .replace(/[`*_~>#\[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!meaningfulText) {
    return null;
  }

  const words = meaningfulText
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !TITLE_STOP_WORDS.has(word));

  if (words.length === 0) {
    return meaningfulText.slice(0, 42);
  }

  const titleWords = words.slice(0, 4).map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return titleWords.join(' ').slice(0, 42);
}

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();
  const promptTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const welcomeTimerRef = useRef(null);
  const chatActionsRef = useRef(null);
  const hasShownWelcomeRef = useRef(false);
  const recentsStorageKey = `sora-chat-recents:${user?.id || 'guest'}`;

  const greetingName = user?.firstName || user?.username || user?.fullName?.split(' ')?.[0] || 'there';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    window.clearTimeout(promptTimerRef.current);
    window.clearTimeout(hideTimerRef.current);
    setShowPrompt(false);

    promptTimerRef.current = window.setTimeout(() => {
      setShowPrompt(true);
      hideTimerRef.current = window.setTimeout(() => {
        setShowPrompt(false);
      }, 7000);
    }, 5000);

    return () => {
      window.clearTimeout(promptTimerRef.current);
      window.clearTimeout(hideTimerRef.current);
    };
  }, [mounted]);

  useEffect(() => {
    return () => {
      window.clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setShowPrompt(false);
      setShowWelcomeOverlay(false);
      window.clearTimeout(promptTimerRef.current);
      window.clearTimeout(hideTimerRef.current);
      window.clearTimeout(welcomeTimerRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return;

    try {
      const raw = window.localStorage.getItem(recentsStorageKey);
      if (!raw) {
        setChatHistory([]);
        return;
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setChatHistory(parsed);
      } else {
        setChatHistory([]);
      }
    } catch {
      setChatHistory([]);
    }
  }, [mounted, recentsStorageKey]);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(recentsStorageKey, JSON.stringify(chatHistory));
  }, [chatHistory, mounted, recentsStorageKey]);

  function openChatScreen() {
    setShowPrompt(false);
    setShowWelcomeOverlay(false);
    window.clearTimeout(welcomeTimerRef.current);
    setIsFullscreen(false);
    setIsMenuExpanded(true);
    setOpen(true);
  }

  function handleFloatingButtonClick() {
    if (!hasShownWelcomeRef.current) {
      hasShownWelcomeRef.current = true;
      setShowPrompt(false);
      setShowWelcomeOverlay(true);
      window.clearTimeout(promptTimerRef.current);
      window.clearTimeout(hideTimerRef.current);

      welcomeTimerRef.current = window.setTimeout(() => {
        setShowWelcomeOverlay(false);
        setOpen(true);
      }, 2000);

      return;
    }

    openChatScreen();
  }

  function handleDeleteRecentChat(historyId) {
    setChatHistory((current) => {
      const nextHistory = current.filter((chat) => chat.id !== historyId);

      if (currentChatId === historyId || nextHistory.length === 0) {
        chatActionsRef.current?.startNewChat?.();
        setActiveHistoryId(null);
        setCurrentChatId(null);
      }

      return nextHistory;
    });

    setActiveHistoryId((current) => (current === historyId ? null : current));
    setCurrentChatId((current) => (current === historyId ? null : current));
  }

  function handleNewChat() {
    const draftId = currentChatId && chatHistory.find((chat) => chat.id === currentChatId && chat.title === 'New Chat')
      ? currentChatId
      : `chat-${Date.now()}`;

    if (!chatHistory.find((chat) => chat.id === draftId)) {
      setChatHistory((current) => [
        {
          id: draftId,
          title: 'New Chat',
          createdAt: new Date().toLocaleString(),
          messages: [],
        },
        ...current,
      ].slice(0, 15));
    }

    setCurrentChatId(draftId);
    setActiveHistoryId(null);
    chatActionsRef.current?.startNewChat?.();
    setIsFullscreen(true);
    setIsMenuExpanded(true);
  }

  function handleOpenHistoryChat(historyId) {
    const selected = chatHistory.find((chat) => chat.id === historyId);
    if (!selected) return;
    chatActionsRef.current?.loadSnapshot?.(selected.messages);
    setActiveHistoryId(historyId);
    setCurrentChatId(historyId);
  }

  function handleChatUpdate(update) {
    if (!currentChatId || !update) return;

    const nextTitle = update.started ? deriveChatTitle([{ role: 'user', text: update.title }]) : null;

    if (update.started) {
      setActiveHistoryId(currentChatId);
    }

    setChatHistory((current) => current.map((chat) => {
      if (chat.id !== currentChatId) return chat;

      return {
        ...chat,
        title: chat.title === 'New Chat' && nextTitle ? nextTitle : chat.title,
        messages: Array.isArray(update.messages) ? update.messages : chat.messages,
      };
    }));
  }

  function handleChatActionsChange(actions) {
    chatActionsRef.current = actions;
  }

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none">
      <div
        className={`pointer-events-auto fixed bottom-24 right-5 z-50 w-[min(320px,calc(100vw-2.5rem))] transition-all duration-500 ease-out ${
          showPrompt ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            openChatScreen();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openChatScreen();
            }
          }}
          className="group w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-left shadow-[0_18px_50px_-24px_rgba(15,23,42,0.55)] backdrop-blur-md transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.6)] dark:border-slate-800/70 dark:bg-slate-950/90"
          aria-label="Open chat prompt"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 transition duration-300 group-hover:scale-105">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Ask me
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  AI assistant
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                Need help with budgets, bills, investments, or anything inside FinanSmartz?
              </p>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShowPrompt(false);
              }}
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Dismiss chat prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating button */}
      <button
        onClick={handleFloatingButtonClick}
        className="pointer-events-auto fixed bottom-5 right-5 z-50 p-4 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition"
        aria-label="Open Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {showWelcomeOverlay && (
        <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 backdrop-blur-md px-4 py-6">
          <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/90 p-7 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300 dark:border-slate-800/70 dark:bg-slate-950/85">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Hi {greetingName}! Good to see you
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Opening your assistant...
            </p>
          </div>
        </div>
      )}

      {/* Centered Popup Overlay */}
      {open && (
        <div className={isFullscreen
          ? "pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md px-2 py-2 md:px-3 md:py-3"
          : "pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-3 py-4 md:px-6 md:py-8"
        }>
          <div className={isFullscreen
            ? "relative flex h-[calc(100vh-1rem)] w-full max-w-none flex-col overflow-hidden rounded-2xl border border-border/70 bg-white/95 shadow-2xl dark:bg-slate-900/92"
            : "relative flex h-[min(88vh,760px)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border/60 bg-white/92 shadow-2xl dark:bg-slate-900/88"
          }>
            {/* Header */}
            <div className="border-b border-border/60 px-4 py-4 md:px-6">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-base font-semibold text-slate-900 dark:text-white md:text-lg">Sora - AI Chatbot</h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFullscreen((current) => !current)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label={isFullscreen ? 'Minimize chat' : 'Maximize chat'}
                    title={isFullscreen ? 'Minimize chat' : 'Maximize chat'}
                  >
                    {isFullscreen ? <Minimize2 className="h-4.5 w-4.5" /> : <Maximize2 className="h-4.5 w-4.5" />}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    aria-label="Close chat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
                >
                  <SquarePen className="h-3.5 w-3.5" />
                  New Chat
                </button>
              </div>
            </div>
            {/* Chat content */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              <aside
                className={isMenuExpanded
                  ? "hidden h-full w-72 shrink-0 border-r border-border/60 bg-slate-50/90 p-3 md:flex md:flex-col"
                  : "hidden h-full w-16 shrink-0 border-r border-border/60 bg-slate-50/90 p-2 md:flex md:flex-col"
                }
              >
                <button
                  type="button"
                  onClick={() => setIsMenuExpanded((current) => !current)}
                  className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-800 dark:hover:bg-slate-800"
                  aria-label={isMenuExpanded ? 'Collapse chat menu' : 'Expand chat menu'}
                >
                  {isMenuExpanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </button>

                {isMenuExpanded ? (
                  <>
                    <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Recents
                    </div>
                    <div className="mt-2 flex-1 space-y-1 overflow-y-auto pr-1">
                      {chatHistory.length === 0 ? (
                        <div className="rounded-xl border border-slate-200/80 bg-white/80 p-3 text-xs text-slate-500">
                          No previous chats yet.
                        </div>
                      ) : (
                        chatHistory.map((chat) => (
                          <button
                            key={chat.id}
                            type="button"
                            onClick={() => handleOpenHistoryChat(chat.id)}
                            className={`group relative w-full rounded-xl border px-3 py-2 text-left transition ${
                              activeHistoryId === chat.id
                                ? 'border-blue-300 bg-blue-50/90 shadow-sm ring-1 ring-blue-200 dark:border-blue-500/50 dark:bg-blue-500/10 dark:ring-blue-500/20'
                                : 'border-slate-200/80 bg-white/80 hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-900/50 dark:hover:bg-slate-800/70'
                            }`}
                            title={chat.title}
                            aria-current={activeHistoryId === chat.id ? 'true' : 'false'}
                          >
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteRecentChat(chat.id);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleDeleteRecentChat(chat.id);
                                }
                              }}
                              className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent bg-white/90 text-slate-400 opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-red-600"
                              aria-label="Delete this chat"
                              title="Delete this chat"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </span>
                            <p className="truncate text-sm font-medium text-slate-800">{chat.title}</p>
                            <p className="mt-0.5 truncate text-[11px] text-slate-500">{chat.createdAt}</p>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="mt-2 rounded-xl border border-slate-200/80 bg-white/80 p-3 text-xs text-slate-600">
                      Sora can help with app features, workflows, and troubleshooting.
                    </div>
                  </>
                ) : (
                  <>
                  </>
                )}
              </aside>

              <div className={isFullscreen
                ? "flex-1 min-h-0 overflow-hidden px-2 pb-2 pt-1 md:px-4 md:pb-4"
                : "flex-1 min-h-0 overflow-hidden px-2 pb-2 pt-1 md:px-3 md:pb-3"
              }>
                <AssistantChat onActionsChange={handleChatActionsChange} onChatUpdate={handleChatUpdate} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  , document.body);
}
