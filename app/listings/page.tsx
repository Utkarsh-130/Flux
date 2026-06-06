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
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
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

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); 

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

    return matchesLocation && matchesChannel && matchesDate && matchesTime && matchesExperience && matchesMatchPct && matchesGlobalSearch;
  });

  const freshJobs = filteredJobs.filter(job => {
    if (!job.scraped_at) return false;
    const scrapedTime = new Date(job.scraped_at + 'Z').getTime();
    return (Date.now() - scrapedTime) < 24 * 60 * 60 * 1000;
  });

  const historyJobs = filteredJobs.filter(job => {
    if (!job.scraped_at) return true;
    const scrapedTime = new Date(job.scraped_at + 'Z').getTime();
    return (Date.now() - scrapedTime) >= 24 * 60 * 60 * 1000;
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

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <Header title="Scraped Listings" subtitle="Browse and track matched job openings" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 overflow-hidden h-full">
        <div className="lg:col-span-8 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Compass className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-extrabold text-[#1a253c]">Scraped Listings ({filteredJobs.length})</h2>
            </div>
            <div className="flex items-center gap-3 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold text-xs px-4 py-2.5 rounded-full border border-gray-200 outline-none cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <span>{timeFilter === 'today' ? 'Today' : timeFilter === 'yesterday' ? 'Yesterday' : timeFilter === 'day-before' ? 'Day Before Yesterday' : 'All Listings'}</span>
                  <span className="text-[10px] text-gray-400">▼</span>
                </button>

                {showTimeDropdown && (
                  <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-[24px] shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 overflow-hidden divide-y divide-gray-50">
                    <button
                      onClick={() => { setTimeFilter('all'); setShowTimeDropdown(false); }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${timeFilter === 'all' ? 'bg-[#9ef01a]/15 text-[#121315]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      All Listings
                    </button>
                    <button
                      onClick={() => { setTimeFilter('today'); setShowTimeDropdown(false); }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${timeFilter === 'today' ? 'bg-[#9ef01a]/15 text-[#121315]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => { setTimeFilter('yesterday'); setShowTimeDropdown(false); }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${timeFilter === 'yesterday' ? 'bg-[#9ef01a]/15 text-[#121315]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={() => { setTimeFilter('day-before'); setShowTimeDropdown(false); }}
                      className={`w-full text-left px-5 py-3.5 text-xs font-bold transition-colors ${timeFilter === 'day-before' ? 'bg-[#9ef01a]/15 text-[#121315]' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      Day Before Yesterday
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs px-4 py-2.5 rounded-full border border-gray-200 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                onClick={exportExcel}
                className="bg-[#9ef01a] hover:bg-[#8ae010] text-[#121315] font-bold text-xs px-5 py-2.5 rounded-full transition-colors shadow-sm cursor-pointer"
              >
                Export Excel
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-6 relative flex-wrap">
            <input
              type="text"
              placeholder="Search location..."
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-600 font-semibold text-xs px-4 py-2 rounded-full border border-gray-200 focus:border-[#9ef01a] focus:ring-1 focus:ring-[#9ef01a] outline-none transition-all w-40"
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
                buttonClassName="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2 rounded-full border border-gray-200 outline-none cursor-pointer transition-all flex items-center justify-between"
              />
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
              <span className="text-xs font-bold text-gray-600 whitespace-nowrap">Min Match: {minMatchPct}%</span>
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
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar pb-8">
            {isLoadingJobs ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-white rounded-[24px] p-6 border border-gray-100 shadow-sm animate-pulse flex items-start gap-4">
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
              <p className="text-sm font-bold text-gray-400 text-center py-12">No jobs matched search criteria.</p>
            ) : (
              <div className="space-y-8">
                {freshJobs.length > 0 && (
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1a253c] tracking-wider uppercase mb-4 flex items-center gap-2">
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
                            className="bg-white hover:bg-gray-50/50 hover:shadow-lg rounded-3xl p-6 transition-all border border-[#9ef01a]/30 shadow-sm duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#9ef01a]/10 rounded-bl-[64px] pointer-events-none"></div>
                            <div className="flex items-start gap-4 relative">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner ${job.color}`}>
                                {job.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-extrabold text-[#1a253c] text-base hover:text-blue-600 transition-colors cursor-pointer">{job.title}</h3>
                                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    @{job.channel || job.channel_name}
                                  </span>
                                  <ExperienceBadge level={getExperienceCategory(job.title, job.experience_years)} />
                                  <span className="bg-[#9ef01a]/20 text-lime-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ml-auto">
                                    {matchPct}% Match
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 mb-3">{job.company}</p>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{job.snippet}</p>
                                <div className="flex items-center gap-4 text-gray-400 text-[11px] font-bold flex-wrap">
                                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {job.location || 'Location Not Specified'}</span>
                                  <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> <span className="text-emerald-600">{job.salary || 'Salary Not Specified'}</span></span>
                                </div>
                                {matched.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                                    <span className="text-[10px] text-gray-400 self-center mr-1">Matches:</span>
                                    {matched.map((skill) => (
                                      <span key={skill} className="bg-lime-50 text-lime-700 border border-lime-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
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
                                      window.open(job.apply_link, '_blank');
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-gray-50 hover:bg-[#9ef01a] hover:text-black hover:border-transparent text-gray-700 font-extrabold text-xs px-4 py-2 rounded-full border border-gray-200 transition-all duration-600 cursor-pointer group"
                                >
                                  Track
                                  <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-sm group-hover:border-transparent">
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
                    <h3 className="text-sm font-extrabold text-gray-400 tracking-wider uppercase mb-4 flex items-center gap-2">
                      History ({historyJobs.length})
                    </h3>
                    <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                      {historyJobs.map((job) => {
                        const matched = (job.requiredSkills || []).filter(s => parsedResumeSkills.some(rs => rs.toLowerCase() === s.toLowerCase()));
                        const matchPct = (job.requiredSkills && job.requiredSkills.length > 0) ? Math.round((matched.length / job.requiredSkills.length) * 100) : 0;

                        return (
                          <div
                            key={job.id}
                            className="bg-white hover:bg-gray-50/50 hover:shadow-lg rounded-3xl p-6 transition-all border border-gray-100/80 shadow-sm duration-300 transform hover:-translate-y-1"
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-inner ${job.color} opacity-70`}>
                                {job.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-extrabold text-[#1a253c] text-base hover:text-blue-600 transition-colors cursor-pointer">{job.title}</h3>
                                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                    @{job.channel || job.channel_name}
                                  </span>
                                  <ExperienceBadge level={getExperienceCategory(job.title, job.experience_years)} />
                                  <span className="bg-[#9ef01a]/20 text-lime-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ml-auto">
                                    {matchPct}% Match
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-gray-400 mb-3">{job.company}</p>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">{job.snippet}</p>
                                <div className="flex items-center gap-4 text-gray-400 text-[11px] font-bold flex-wrap">
                                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /> {job.location || 'Location Not Specified'}</span>
                                  <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-emerald-500/70 flex-shrink-0" /> <span className="text-emerald-600/80">{job.salary || 'Salary Not Specified'}</span></span>
                                  <span className="flex items-center gap-1 ml-auto text-gray-300"><Clock className="w-3 h-3" /> Scraped: {job.dateString}</span>
                                </div>
                                {matched.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                                    <span className="text-[10px] text-gray-400 self-center mr-1">Matches:</span>
                                    {matched.map((skill) => (
                                      <span key={skill} className="bg-lime-50 text-lime-700 border border-lime-100 text-[9px] font-bold px-2 py-0.5 rounded-full">
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
                                      window.open(job.apply_link, '_blank');
                                    }
                                  }}
                                  className="flex items-center gap-1 bg-gray-50 hover:bg-[#9ef01a] hover:text-black hover:border-transparent text-gray-700 font-extrabold text-xs px-4 py-2 rounded-full border border-gray-200 transition-all duration-600 cursor-pointer group"
                                >
                                  Track
                                  <div className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-sm group-hover:border-transparent">
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

        <div className="lg:col-span-4 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
            <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase">Calendar Scope</h3>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>

          <div className="flex items-center justify-between mb-6">
            <h4 className="font-extrabold text-[#1a253c] text-lg">
              {monthNames[currentMonth]} {currentYear}
            </h4>
            <div className="flex gap-2">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm font-bold cursor-pointer"
              >
                &lt;
              </button>
              <button
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors text-sm font-bold cursor-pointer"
              >
                &gt;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-6">
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
              <div key={day} className="text-[10px] font-extrabold text-gray-400 tracking-wider">
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
                      ? 'bg-[#9ef01a] text-black font-extrabold shadow-sm'
                      : selectState === 'inbetween'
                      ? 'bg-[#9ef01a]/20 text-[#121315] font-bold'
                      : cell.isCurrentMonth
                      ? 'text-gray-700 hover:bg-gray-50'
                      : 'text-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <button
            onClick={clearDateFilter}
            className="w-full text-center text-xs font-extrabold text-gray-400 hover:text-black uppercase tracking-wider transition-colors pt-2 border-t border-gray-50"
          >
            Clear Date Filter
          </button>
        </div>
      </div>
    </div>
  );
}
