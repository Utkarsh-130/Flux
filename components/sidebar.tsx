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
import { ThemeToggle } from '@/components/ThemeToggle';

export function Sidebar() {
  const pathname = usePathname();
  const { jobs, trackedJobs } = useApp();

  const navItems = [
    {
      label: 'Listings',
      href: '/listings',
      icon: Compass,
      count: jobs.filter(job => {
        if (!job.scraped_at) return false;
        
        const latestScrapeTime = jobs.reduce((latest, j) => {
          if (!j.scraped_at) return latest;
          const time = new Date(j.scraped_at + 'Z').getTime();
          return time > latest ? time : latest;
        }, 0);
        
        const scrapedTime = new Date(job.scraped_at + 'Z').getTime();
        return (latestScrapeTime - scrapedTime) < 30 * 60 * 1000;
      }).length,
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
    <aside className="fixed left-4 top-[44px] bottom-4 w-72 bg-[#0c0d0e] dark:bg-[#121315] rounded-[32px] flex flex-col z-50 p-6">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-10 h-10 flex items-center justify-center">
          <img src="/icon.png" alt="Flux Icon" className="w-8 h-8 object-contain drop-shadow-md" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-wide">flux</h1>
      </div>

      <nav className="flex flex-col gap-1 p-1.5 bg-white/5 border border-white/10 rounded-[24px] mb-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 px-5 py-3.5 rounded-full transition-all duration-300',
                isActive
                  ? 'bg-white dark:bg-[#18191c] text-black dark:text-white shadow-md dark:border dark:border-white/10 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 font-medium'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="flex-1 text-sm">{item.label}</span>
              {item.count !== undefined && (
                <span
                  className={cn(
                    'px-3 py-1 text-[10px] font-extrabold rounded-full',
                    isActive
                      ? 'bg-black dark:bg-[#9ef01a] text-white dark:text-black'
                      : 'bg-white/10 dark:bg-white/5 text-gray-400 dark:text-gray-300'
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {trackedJobs && trackedJobs.length > 0 && (
        <div className="flex-1 mt-6 mb-2 flex flex-col min-h-[120px] overflow-hidden">
          <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-3 px-2">
            Recently Tracked
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {trackedJobs.slice().reverse().slice(0, 4).map(job => (
              <Link href="/job-tracker" key={job.id} className="block bg-white/5 border border-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors group cursor-pointer">
                <div className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">{job.title}</div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{job.company}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                    {job.status}
                  </span>
                  <BookOpen className="w-3 h-3 text-gray-500 group-hover:text-[#9ef01a] opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/5">
        <ThemeToggle />
      </div>
    </aside>
  );
}
