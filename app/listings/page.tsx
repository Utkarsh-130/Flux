'use client';

import { useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { Download, ChevronRight, Compass, Check, MapPin, Clock, Banknote } from 'lucide-react';
import { Header } from '@/components/Header';
import { ExperienceDropdown } from '@/components/ExperienceDropdown';
import { ChannelDropdown } from '@/components/ChannelDropdown';

function ExperienceBadge({ level }: { level: string }) {
  const colors = (() => {
    switch (level) {
      case 'Intern': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
      case 'Entry-level': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Mid-level': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Senior': return 'bg-purple-50 text-purple-700 border-purple-100';
      default: return 'bg-surface-hover text-text-secondary border-border-medium';
    }
  })();
  return (
    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${colors}`}>
      {level}
    </span>
  );
}

function getExperienceCategory(title: string, expStr: string): string {
  const t = title.toLowerCase();
  const e = (expStr || 'N/A').toLowerCase();
  if (t.includes('intern') || e.includes('intern')) return 'Intern';

  const currentYear = new Date().getFullYear();
  const batchMatch = e.match(/(?:batch|class of)\s*(\d{4})/i) || t.match(/(?:batch|class of)\s*(\d{4})/i) || e.match(/\b(202\d)\b/) || t.match(/\b(202\d)\b/);
  
  if (batchMatch && batchMatch[1]) {
    const batchYear = parseInt(batchMatch[1], 10);
    const yearsExp = currentYear - batchYear;
    if (yearsExp < 0) return 'Intern';
    if (yearsExp <= 2) return 'Entry-level';
    if (yearsExp <= 5) return 'Mid-level';
    return 'Senior';
  }

  const numbers = e.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const validYears = numbers.map(Number).filter(n => n < 100);
    if (validYears.length > 0) {
      const years = Math.max(...validYears);
      if (years <= 2) return 'Entry-level';
      if (years <= 5) return 'Mid-level';
      return 'Senior';
    }
  }
  if (e.includes('fresher') || e.includes('entry') || e.includes('0-2') || e.includes('0-1') || t.includes('fresher') || t.includes('graduate')) {
    return 'Entry-level';
  }
  if (e.includes('senior') || t.includes('senior') || t.includes('lead') || t.includes('manager') || e.includes('lead')) {
    return 'Senior';
  }
  if (e.includes('mid') || e.includes('intermediate') || e.includes('3-5')) {
    return 'Mid-level';
  }
  return 'Not Specified';
}

export default function ListingsPage() {
  const {
    jobs,
    trackJob,
    parsedResumeSkills,
    isLoadingJobs,
    globalSearchTerm,
  } = useApp();

  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('Channel');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['Intern', 'Entry-level', 'Mid-level', 'Senior', 'Not Specified']);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'day-before'>('all');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [minMatchPct, setMinMatchPct] = useState<number>(0);
  const [showMatchDropdown, setShowMatchDropdown] = useState(false);
  const [showOnlyFresh, setShowOnlyFresh] = useState(false);

  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); 

  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayIndex = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);

  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonthIndex);

  const daysArray = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      dateString: `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(daysInPrevMonth - i).padStart(2, '0')}`
    });
  }

  for (let i = 1; i <= daysInCurrentMonth; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  const remainingCells = 42 - daysArray.length;
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    daysArray.push({
      day: i,
      isCurrentMonth: false,
      dateString: `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    });
  }

  const handleDateClick = (dateString: string) => {
    if ((rangeStart && rangeEnd) || (!rangeStart && !rangeEnd)) {
      setRangeStart(dateString);
      setRangeEnd(null);
    } else if (rangeStart && !rangeEnd) {
      if (dateString >= rangeStart) {
        setRangeEnd(dateString);
      } else {
        setRangeEnd(rangeStart);
        setRangeStart(dateString);
      }
    }
  };

  const isSelected = (dateString: string) => {
    if (dateString === rangeStart || dateString === rangeEnd) {
      return 'endpoints';
    }
    if (rangeStart && rangeEnd && dateString > rangeStart && dateString < rangeEnd) {
      return 'inbetween';
    }
    return 'none';
  };

  const clearDateFilter = () => {
    setRangeStart(null);
    setRangeEnd(null);
  };

  const uniqueChannels = Array.from(new Set(jobs.map((job) => job.channel || job.channel_name).filter(Boolean)));

  const latestScrapeTime = jobs.reduce((latest, job) => {
    if (!job.scraped_at) return latest;
    const time = new Date(job.scraped_at + 'Z').getTime();
    return time > latest ? time : latest;
  }, 0);

  const filteredJobs = jobs.filter((job) => {
    const matchesLocation =
      !selectedLocation ||
      (job.location || '').toLowerCase().includes(selectedLocation.toLowerCase());

    const matchesChannel =
      selectedChannel === 'Channel' ||
      (job.channel || job.channel_name || '').toLowerCase() === selectedChannel.toLowerCase();

    let matchesDate = true;
    if (rangeStart && !rangeEnd) {
      matchesDate = job.dateString === rangeStart;
    } else if (rangeStart && rangeEnd) {
      matchesDate = job.dateString >= rangeStart && job.dateString <= rangeEnd;
    }

    const matchesTime = (() => {
      const getOffsetDateString = (offsetDays: number) => {
        const d = new Date();
        d.setDate(d.getDate() - offsetDays);
        return d.toISOString().split('T')[0];
      };
      const todayStr = getOffsetDateString(0);
      const yesterdayStr = getOffsetDateString(1);
      const dayBeforeStr = getOffsetDateString(2);

      if (timeFilter === 'today') return job.dateString === todayStr;
      if (timeFilter === 'yesterday') return job.dateString === yesterdayStr;
      if (timeFilter === 'day-before') return job.dateString === dayBeforeStr;
      return true;
    })();

    const matchesExperience = selectedLevels.includes(getExperienceCategory(job.title, job.experience_years));

    const matched = job.requiredSkills.filter(s => parsedResumeSkills.some(rs => rs.toLowerCase() === s.toLowerCase()));
    const matchPct = job.requiredSkills.length > 0 ? Math.round((matched.length / job.requiredSkills.length) * 100) : 0;
    const matchesMatchPct = matchPct >= minMatchPct;

    const matchesGlobalSearch =
      !globalSearchTerm ||
      job.title.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      (job.company || '').toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      (job.location || '').toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
      (job.snippet || '').toLowerCase().includes(globalSearchTerm.toLowerCase());

    const isFresh = job.scraped_at && (latestScrapeTime - new Date(job.scraped_at + 'Z').getTime()) < 30 * 60 * 1000;
    const matchesFresh = !showOnlyFresh || isFresh;

    return matchesLocation && matchesChannel && matchesDate && matchesTime && matchesExperience && matchesMatchPct && matchesGlobalSearch && matchesFresh;
  });

  const freshJobs = filteredJobs.filter(job => {
    if (!job.scraped_at) return false;
    const scrapedTime = new Date(job.scraped_at + 'Z').getTime();
    return (latestScrapeTime - scrapedTime) < 30 * 60 * 1000;
  });

  const historyJobs = filteredJobs.filter(job => {
    if (!job.scraped_at) return true;
    const scrapedTime = new Date(job.scraped_at + 'Z').getTime();
    return (latestScrapeTime - scrapedTime) >= 30 * 60 * 1000;
  });

  const exportCSV = () => {
    const headers = ['Title', 'Company', 'Location', 'Salary', 'Channel', 'Date'];
    const rows = filteredJobs.map((j) => [
      j.title, j.company, j.location, j.salary, j.channel, j.dateString
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scraped_listings_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportExcel = () => {
    const headers = ['Title', 'Company', 'Location', 'Salary', 'Channel', 'Date'];
    const rows = filteredJobs.map((j) => [
      j.title, j.company, j.location, j.salary, j.channel, j.dateString
    ]);
    const excelContent = [headers.join('\t'), ...rows.map(e => e.join('\t'))].join('\n');
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `scraped_listings_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all untracked listings?')) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/jobs/clear`, { method: 'POST' });
      if (res.ok) {
        alert('Untracked listings cleared successfully. Changes will reflect shortly.');
      }
    } catch (e) {
      console.error('Failed to clear listings', e);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <Header title="Scraped Listings" subtitle="Browse and track matched job openings" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 overflow-hidden h-full">
        <div className="lg:col-span-8 bg-white dark:bg-[#18191c] rounded-[32px] p-8  border border-border-faint h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-text-primary">Scraped Listings ({filteredJobs.length})</h2>
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                  className="bg-surface-hover hover:bg-surface-muted text-text-tertiary font-semibold text-xs px-4 py-2.5 rounded-full border border-border-medium outline-none cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <span>{timeFilter === 'today' ? 'Today' : timeFilter === 'yesterday' ? 'Yesterday' : timeFilter === 'day-before' ? 'Day Before Yesterday' : 'All Listings'}</span>
                  <span className="text-[10px] text-text-secondary">▼</span>
                </button>

                {showTimeDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-[24px] shadow-lg bg-white dark:bg-[#18191c] ring-1 ring-black ring-opacity-5 z-50 overflow-hidden divide-y divide-gray-50">
                    <button
                      onClick={() => { setTimeFilter('all'); setShowTimeDropdown(false); }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${timeFilter === 'all' ? 'bg-[#9ef01a]/15 text-[#121315]' : 'text-text-tertiary hover:bg-surface-hover'}`}
                    >
                      All Listings
                    </button>
                    <button
                      onClick={() => { setTimeFilter('today'); setShowTimeDropdown(false); }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${timeFilter === 'today' ? 'bg-[#9ef01a]/15 text-[#121315]' : 'text-text-tertiary hover:bg-surface-hover'}`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => { setTimeFilter('yesterday'); setShowTimeDropdown(false); }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${timeFilter === 'yesterday' ? 'bg-[#9ef01a]/15 text-[#121315]' : 'text-text-tertiary hover:bg-surface-hover'}`}
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={() => { setTimeFilter('day-before'); setShowTimeDropdown(false); }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${timeFilter === 'day-before' ? 'bg-[#9ef01a]/15 text-[#121315]' : 'text-text-tertiary hover:bg-surface-hover'}`}
                    >
                      Day Before Yesterday
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 bg-white dark:bg-[#18191c] hover:bg-surface-hover text-text-tertiary font-bold text-xs px-4 py-2.5 rounded-full border border-border-medium transition-colors  cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={exportExcel}
                className="bg-[#9ef01a] hover:bg-[#8ae010] text-[#121315] font-bold text-xs px-5 py-2.5 rounded-full transition-colors  cursor-pointer"
              >
                Export Excel
              </button>
              <button
                onClick={handleClearAll}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-5 py-2.5 rounded-full border border-red-200 transition-colors cursor-pointer ml-2"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-6 relative flex-wrap">
            <input
              type="text"
              placeholder="Search location..."
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-surface-hover hover:bg-surface-muted focus:bg-white dark:bg-[#18191c] text-text-secondary font-semibold text-xs px-4 py-2 rounded-full border border-border-medium focus:border-[#9ef01a] focus:ring-1 focus:ring-[#9ef01a] outline-none transition-all w-40"
            />
            <ChannelDropdown
              selectedChannel={selectedChannel}
              setSelectedChannel={setSelectedChannel}
              channels={uniqueChannels}
            />
            <div className="relative w-48">
              <ExperienceDropdown
                selectedLevels={selectedLevels}
                setSelectedLevels={setSelectedLevels}
                buttonClassName="w-full bg-surface-hover hover:bg-surface-muted text-text-secondary font-semibold text-xs px-4 py-2 rounded-full border border-border-medium outline-none cursor-pointer transition-all flex items-center justify-between"
              />
            </div>
            <div className="flex items-center gap-3 bg-surface-hover px-4 py-2 rounded-full border border-border-medium">
              <span className="text-xs font-bold text-text-secondary whitespace-nowrap">Min Match: {minMatchPct}%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={minMatchPct}
                onChange={(e) => setMinMatchPct(Number(e.target.value))}
                className="w-32 accent-[#9ef01a] cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
              />
            </div>
            <button
              onClick={() => setShowOnlyFresh(!showOnlyFresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                showOnlyFresh 
                  ? 'bg-[#9ef01a]/20 border-[#9ef01a] text-lime-800' 
                  : 'bg-surface-hover border-border-medium text-text-secondary hover:bg-surface-muted'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${showOnlyFresh ? 'bg-[#9ef01a] animate-pulse' : 'bg-gray-400'}`}></div>
              Fresh Only
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar pb-8">
            {isLoadingJobs ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-[#18191c] rounded-[24px] p-6 border border-border-subtle  animate-pulse flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200/80 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200/80 rounded w-1/3" />
                    <div className="h-3 bg-gray-200/80 rounded w-1/4" />
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200/80 rounded w-3/4" />
                      <div className="h-3 bg-gray-200/80 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : filteredJobs.length === 0 ? (
              <p className="text-sm font-bold text-text-secondary text-center py-12">No jobs matched search criteria.</p>
            ) : (
              <div className="space-y-8">
                {freshJobs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-extrabold text-text-primary tracking-wider uppercase mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#9ef01a] animate-pulse"></div>
                      Freshly Taken ({freshJobs.length})
                    </h3>
                    <div className="space-y-4">
                      {freshJobs.map((job) => {
                        const matched = (job.requiredSkills || []).filter(s => parsedResumeSkills.some(rs => rs.toLowerCase() === s.toLowerCase()));
                        const matchPct = (job.requiredSkills && job.requiredSkills.length > 0) ? Math.round((matched.length / job.requiredSkills.length) * 100) : 0;

                        return (
                          <div
                            key={job.id}
                            className="bg-white dark:bg-[#18191c] hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-[0_8px_32px_rgba(158,240,26,0.15)] rounded-3xl p-6 transition-all border border-[#9ef01a]/30  duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#9ef01a]/10 rounded-bl-[64px] pointer-events-none"></div>
                            <div className="flex items-start gap-4 relative">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner ${job.color}`}>
                                {job.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-extrabold text-text-primary text-base hover:text-blue-600 transition-colors cursor-pointer">{job.title}</h3>
                                  <span className="bg-surface-muted text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    @{job.channel || job.channel_name}
                                  </span>
                                  <ExperienceBadge level={getExperienceCategory(job.title, job.experience_years)} />
                                  <span className="bg-[#9ef01a]/20 text-lime-900 dark:text-[#9ef01a] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ml-auto">
                                    {matchPct}% Match
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-text-secondary mb-3">{job.company}</p>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{job.snippet}</p>
                                <div className="flex items-center gap-4 text-text-secondary text-[11px] font-bold flex-wrap">
                                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" /> {job.location || 'Location Not Specified'}</span>
                                  <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> <span className="text-emerald-600">{job.salary || 'Salary Not Specified'}</span></span>
                                </div>
                                {matched.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                                    <span className="text-[10px] text-text-secondary self-center mr-1">Matches:</span>
                                    {matched.map((skill) => (
                                      <span key={skill} className="bg-lime-50 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 border border-lime-100 dark:border-lime-900/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 self-center">
                                <button
                                  onClick={() => {
                                    trackJob(job.id, 'wishlist');
                                    if (job.apply_link) {
                                      if (window.__TAURI_INTERNALS__) {
                                        import('@tauri-apps/plugin-shell').then(({ open }) => open(job.apply_link)).catch(() => window.open(job.apply_link, '_blank'));
                                      } else {
                                        window.open(job.apply_link, '_blank');
                                      }
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-surface-hover hover:bg-[#9ef01a] dark:hover:bg-[#9ef01a] hover:text-black hover:border-transparent text-text-tertiary font-extrabold text-xs px-4 py-2 rounded-full border border-border-medium transition-all duration-600 cursor-pointer group"
                                >
                                  Track
                                  <div className="w-5 h-5 rounded-full bg-white dark:bg-[#18191c] border border-border-medium flex items-center justify-center text-text-tertiary  group-hover:border-transparent">
                                    <ChevronRight className="w-3 h-3" />
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {historyJobs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-extrabold text-text-secondary tracking-wider uppercase mb-4 flex items-center gap-2">
                      History ({historyJobs.length})
                    </h3>
                    <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                      {historyJobs.map((job) => {
                        const matched = (job.requiredSkills || []).filter(s => parsedResumeSkills.some(rs => rs.toLowerCase() === s.toLowerCase()));
                        const matchPct = (job.requiredSkills && job.requiredSkills.length > 0) ? Math.round((matched.length / job.requiredSkills.length) * 100) : 0;

                        return (
                          <div
                            key={job.id}
                            className="bg-white dark:bg-[#18191c] hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-[0_8px_32px_rgba(158,240,26,0.15)] rounded-3xl p-6 transition-all border border-gray-100 dark:border-white/20  duration-300 transform hover:-translate-y-1"
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner ${job.color} opacity-70`}>
                                {job.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-extrabold text-text-primary text-base hover:text-blue-600 transition-colors cursor-pointer">{job.title}</h3>
                                  <span className="bg-surface-muted text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    @{job.channel || job.channel_name}
                                  </span>
                                  <ExperienceBadge level={getExperienceCategory(job.title, job.experience_years)} />
                                  <span className="bg-[#9ef01a]/20 text-lime-900 dark:text-[#9ef01a] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ml-auto">
                                    {matchPct}% Match
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-text-secondary mb-3">{job.company}</p>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{job.snippet}</p>
                                <div className="flex items-center gap-4 text-text-secondary text-[11px] font-bold flex-wrap">
                                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-text-secondary flex-shrink-0" /> {job.location || 'Location Not Specified'}</span>
                                  <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-emerald-500/70 flex-shrink-0" /> <span className="text-emerald-600/80">{job.salary || 'Salary Not Specified'}</span></span>
                                  <span className="flex items-center gap-1 ml-auto text-text-tertiary"><Clock className="w-3 h-3" /> Scraped: {job.dateString}</span>
                                </div>
                                {matched.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                                    <span className="text-[10px] text-text-secondary self-center mr-1">Matches:</span>
                                    {matched.map((skill) => (
                                      <span key={skill} className="bg-lime-50 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400 border border-lime-100 dark:border-lime-900/50 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 self-center">
                                <button
                                  onClick={() => {
                                    trackJob(job.id, 'wishlist');
                                    if (job.apply_link) {
                                      if (window.__TAURI_INTERNALS__) {
                                        import('@tauri-apps/plugin-shell').then(({ open }) => open(job.apply_link)).catch(() => window.open(job.apply_link, '_blank'));
                                      } else {
                                        window.open(job.apply_link, '_blank');
                                      }
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-surface-hover hover:bg-[#9ef01a] dark:hover:bg-[#9ef01a] hover:text-black hover:border-transparent text-text-tertiary font-extrabold text-xs px-4 py-2 rounded-full border border-border-medium transition-all duration-600 cursor-pointer group"
                                >
                                  Track
                                  <div className="w-5 h-5 rounded-full bg-white dark:bg-[#18191c] border border-border-medium flex items-center justify-center text-text-tertiary  group-hover:border-transparent">
                                    <ChevronRight className="w-3 h-3" />
                                  </div>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-[#18191c] rounded-[32px] p-8  border border-border-faint">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-6">
            <h3 className="text-xs font-extrabold text-text-secondary tracking-wider uppercase">Calendar Scope</h3>
            <ChevronRight className="w-4 h-4 text-text-tertiary" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <h4 className="font-extrabold text-text-primary text-lg">
              {monthNames[currentMonth]} {currentYear}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-full border border-border-medium flex items-center justify-center text-text-secondary hover:bg-surface-hover transition-colors text-sm font-bold cursor-pointer"
              >
                &lt;
              </button>
              <button
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-full border border-border-medium flex items-center justify-center text-text-secondary hover:bg-surface-hover transition-colors text-sm font-bold cursor-pointer"
              >
                &gt;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-6">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
              <div key={day} className="text-[10px] font-extrabold text-text-secondary tracking-wider">
                {day}
              </div>
            ))}
            {daysArray.map((cell, idx) => {
              const selectState = isSelected(cell.dateString);
              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(cell.dateString)}
                  className={`text-center py-2 text-xs font-bold rounded-lg transition-colors ${
                    selectState === 'endpoints'
                      ? 'bg-[#9ef01a] text-black font-extrabold '
                      : selectState === 'inbetween'
                      ? 'bg-[#9ef01a]/20 text-[#121315] font-bold'
                      : cell.isCurrentMonth
                      ? 'text-text-tertiary hover:bg-surface-hover'
                      : 'text-text-tertiary hover:bg-surface-hover'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <button
            onClick={clearDateFilter}
            className="w-full text-center text-xs font-extrabold text-text-secondary hover:text-black uppercase tracking-wider transition-colors pt-2 border-t border-gray-50"
          >
            Clear Date Filter
          </button>
        </div>
      </div>
    </div>
  );
}
