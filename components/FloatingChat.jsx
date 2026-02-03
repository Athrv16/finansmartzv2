// FILE: components/FloatingChat.jsx
'use client';

import React, { useState } from 'react';
import AssistantChat from './AssistantChat';
import { MessageCircle } from 'lucide-react';

export default function FloatingChat() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
        aria-label="Open Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Centered Popup Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-[90%] max-w-3xl h-[80%] bg-white dark:bg-slate-800 rounded-xl shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-slate-800 dark:text-white">FinanSmartz Assistant</h4>
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
  );
}