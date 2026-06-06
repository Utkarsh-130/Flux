'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/AppContext';
import { 
  Compass, 
  Settings, 
  BookOpen,
  FileText,
  Video
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { jobs } = useApp();

  const navItems = [
    {
      label: 'Listings',
      href: '/listings',
      icon: Compass,
      count: jobs.length,
    },
    {
      label: 'Telegram Scraper',
      href: '/scraper-setup',
      icon: Settings,
    },
    {
      label: 'YouTube Scraper',
      href: '/youtube-scraper',
      icon: Video,
    },
    {
      label: 'Job Tracker',
      href: '/job-tracker',
      icon: BookOpen,
    },
    {
      label: 'Resume Matcher',
      href: '/resume-matcher',
      icon: FileText,
    },
  ];

  return (
    <aside className="fixed left-4 top-[44px] bottom-4 w-72 bg-[#0c0d0e] rounded-[32px] flex flex-col z-50 p-6">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#9ef01a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" fill="currentColor" fillOpacity="0.15" />
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
            <path d="M13 7L9 13h4v4l4-6h-4z" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">flux</h1>
      </div>

      <nav className="flex-1 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-5 py-4 rounded-full transition-all duration-200',
                isActive
                  ? 'bg-white text-black font-semibold'
                  : 'text-gray-400 hover:text-white font-medium'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={cn(
                    'px-3 py-1 text-[10px] font-extrabold rounded-full',
                    isActive
                      ? 'bg-black text-white'
                      : 'bg-white/10 text-white'
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
