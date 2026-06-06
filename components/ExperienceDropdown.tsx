'use client';

import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';

interface ExperienceDropdownProps {
  selectedLevels: string[];
  setSelectedLevels: (levels: string[]) => void;
  align?: 'left' | 'right';
  buttonClassName?: string;
}

export function ExperienceDropdown({
  selectedLevels,
  setSelectedLevels,
  align = 'left',
  buttonClassName = 'w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-3 rounded-2xl border outline-none cursor-pointer transition-all flex items-center justify-between'
}: ExperienceDropdownProps) {
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

  const levels = ['Intern', 'Entry-level', 'Mid-level', 'Senior', 'Not Specified'];

  const toggleLevel = (lvl: string) => {
    if (selectedLevels.includes(lvl)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== lvl));
    } else {
      setSelectedLevels([...selectedLevels, lvl]);
    }
  };

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonClassName} ${isOpen ? 'border-[#9ef01a] ring-1 ring-[#9ef01a] bg-white' : ''}`}
      >
        <span>
          {selectedLevels.length === levels.length
            ? 'All Experience Levels'
            : selectedLevels.length === 0
            ? 'No Levels Selected'
            : `${selectedLevels.length} Levels Selected`}
        </span>
        <span className="text-[10px] text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div
          className={`origin-top-left absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-full min-w-[220px] rounded-[24px] shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 p-3 space-y-1`}
        >
          {levels.map((lvl) => {
            const isChecked = selectedLevels.includes(lvl);
            const colorClasses = (() => {
              switch (lvl) {
                case 'Intern':
                  return isChecked ? 'bg-cyan-50 text-cyan-800' : 'text-gray-700 hover:bg-cyan-50/50';
                case 'Entry-level':
                  return isChecked ? 'bg-emerald-50 text-emerald-800' : 'text-gray-700 hover:bg-emerald-50/50';
                case 'Mid-level':
                  return isChecked ? 'bg-amber-50 text-amber-800' : 'text-gray-700 hover:bg-amber-50/50';
                case 'Senior':
                  return isChecked ? 'bg-purple-50 text-purple-800' : 'text-gray-700 hover:bg-purple-50/50';
                default:
                  return isChecked ? 'bg-gray-100 text-gray-800' : 'text-gray-700 hover:bg-gray-100/50';
              }
            })();
            const checkColor = (() => {
              switch (lvl) {
                case 'Intern':
                  return 'text-cyan-600';
                case 'Entry-level':
                  return 'text-emerald-600';
                case 'Mid-level':
                  return 'text-amber-600';
                case 'Senior':
                  return 'text-purple-600';
                default:
                  return 'text-gray-600';
              }
            })();
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => toggleLevel(lvl)}
                className={`w-full text-left px-4 py-3 text-xs font-bold rounded-xl flex items-center justify-between transition-colors ${colorClasses}`}
              >
                <span>{lvl}</span>
                {isChecked && <Check className={`w-4 h-4 ${checkColor} stroke-[3px]`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
