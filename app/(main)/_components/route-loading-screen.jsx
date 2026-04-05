"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const messages = [
  "Loading your next page...",
  "Preparing your latest data...",
  "Almost there...",
];

export default function RouteLoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length);
    }, 1800);

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return current;
        return Math.min(90, current + Math.random() * 8);
      });
    }, 260);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
    };
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/75">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-300" />
          </div>

          <p className="mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">
            {messages[messageIndex]}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please wait a moment while we load the page.
          </p>

          <div className="mt-6 w-full">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
