// FILE: components/FloatingChat.jsx
'use client';

import React, { useEffect, useState } from 'react';
import AssistantChat from './AssistantChat';
import { MessageCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none">
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="pointer-events-auto fixed bottom-5 right-5 z-50 p-4 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition"
        aria-label="Open Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Centered Popup Overlay */}
      {open && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-6">
          <div className="relative flex h-full max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl border border-border/60 bg-white/90 shadow-2xl dark:bg-slate-900/80">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-border/60">
              <h4 className="font-semibold text-slate-900 dark:text-white">FinanSmartz Assistant</h4>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-lg font-bold">✕</button>
            </div>
            {/* Chat content */}
            <div className="flex-1 overflow-hidden p-4">
              <AssistantChat />
            </div>
          </div>
        </div>
      )}
    </div>
  , document.body);
}
