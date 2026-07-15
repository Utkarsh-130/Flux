'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-full border border-white/10 w-full opacity-0">
        <div className="flex-1 py-2 h-8"></div>
        <div className="flex-1 py-2 h-8"></div>
        <div className="flex-1 py-2 h-8"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-1 bg-white/5 rounded-full border border-white/10 w-full">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex justify-center py-2 rounded-full transition-all duration-300 ${
          theme === 'light' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex justify-center py-2 rounded-full transition-all duration-300 ${
          theme === 'dark' ? 'bg-[#18191c] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white'
        }`}
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`flex-1 flex justify-center py-2 rounded-full transition-all duration-300 text-xs font-bold ${
          theme === 'system' ? 'bg-[#18191c] text-white shadow-md border border-white/10' : 'text-gray-400 hover:text-white'
        }`}
      >
        OS
      </button>
    </div>
  );
}
