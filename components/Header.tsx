'use client';

import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Search, Bell, Settings } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const {
    setShowSettingsModal,
    globalSearchTerm,
    setGlobalSearchTerm,
    trackedJobs,
  } = useApp();

  const [localSearch, setLocalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const activeSearch = globalSearchTerm || localSearch;
  const wishlistJobs = trackedJobs.filter((j) => j.status === 'wishlist').slice(-3).reverse();

  return (
    <div className="relative">
      <div className="flex justify-between items-start w-full">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a253c] tracking-tight">{title}</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 w-72 shadow-sm border border-gray-100">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={activeSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setGlobalSearchTerm('');
              }}
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-black transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <h4 className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase mb-3 pb-1 border-b border-gray-50">Recent Wishlist Companies</h4>
                {wishlistJobs.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 text-center py-4">No recent wishlist companies.</p>
                ) : (
                  <div className="space-y-2">
                    {wishlistJobs.map((job) => (
                      <div key={job.id} className="flex flex-col p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <span className="text-xs font-extrabold text-gray-800">{job.company}</span>
                        <span className="text-[10px] text-gray-400 truncate">{job.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-black transition-colors cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center w-full mt-4">
        <div></div>
        <div className="bg-white/60 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold text-gray-500 shadow-sm">
          2 June, 2026
        </div>
      </div>
    </div>
  );
}
