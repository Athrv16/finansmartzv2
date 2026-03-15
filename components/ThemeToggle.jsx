'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';


export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // Avoid hydration mismatch

  const activeTheme = resolvedTheme || theme;

  return (
    <button
      onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full border bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 transition"
      aria-label="Toggle Theme"
    >
      {activeTheme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700" />
      )}
    </button>
  );
}
