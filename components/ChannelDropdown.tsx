'use client';

import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ChannelDropdownProps {
  selectedChannel: string;
  setSelectedChannel: (channel: string) => void;
  channels: string[];
}

export function ChannelDropdown({
  selectedChannel,
  setSelectedChannel,
  channels
}: ChannelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left w-48" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2 rounded-full border outline-none cursor-pointer transition-all flex items-center justify-between ${
          isOpen ? 'border-[#9ef01a] ring-1 ring-[#9ef01a] bg-white' : 'border-gray-200'
        }`}
      >
        <span className="truncate">{selectedChannel === 'Channel' ? 'All Channels' : selectedChannel}</span>
        <span className="text-[10px] text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-2 w-full min-w-[220px] rounded-[24px] shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 p-3 space-y-1 max-h-60 overflow-y-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setSelectedChannel('Channel');
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-colors ${
              selectedChannel === 'Channel'
                ? 'bg-[#9ef01a]/15 text-[#121315]'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>All Channels</span>
            {selectedChannel === 'Channel' && <Check className="w-4 h-4 text-[#9ef01a] stroke-[3px]" />}
          </button>
          {channels.map((ch) => {
            const isChecked = selectedChannel.toLowerCase() === ch.toLowerCase();
            return (
              <button
                key={ch}
                type="button"
                onClick={() => {
                  setSelectedChannel(ch);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-colors ${
                  isChecked
                    ? 'bg-[#9ef01a]/15 text-[#121315]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="truncate">{ch}</span>
                {isChecked && <Check className="w-4 h-4 text-[#9ef01a] stroke-[3px]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
