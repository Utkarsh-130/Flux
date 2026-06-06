'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { Search, X } from 'lucide-react';

export function SearchOverlay() {
  const {
    showSearchOverlay,
    setShowSearchOverlay,
    globalSearchTerm,
    setGlobalSearchTerm,
  } = useApp();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearchOverlay) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showSearchOverlay]);

  if (!showSearchOverlay) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-start pt-32 z-[200] px-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[640px] flex flex-col items-center gap-4">
        <div className="w-full bg-[#0a0f18]/95 rounded-full px-6 py-4 flex items-center gap-4 border border-emerald-950/30 shadow-2xl shadow-emerald-950/20">
          <Search className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by location... e.g. Remote"
            value={globalSearchTerm}
            onChange={(e) => setGlobalSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-base text-gray-200 outline-none placeholder-gray-500 font-medium"
          />
          {globalSearchTerm && (
            <button
              onClick={() => setGlobalSearchTerm('')}
              className="text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowSearchOverlay(false)}
            className="text-gray-500 hover:text-gray-300 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs font-bold text-gray-400">
          Press <span className="bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700/50">ESC</span> to close
        </p>
      </div>
    </div>
  );
}
