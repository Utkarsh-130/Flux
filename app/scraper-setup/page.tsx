'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { Play, FileText, Upload, Calendar, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { ExperienceDropdown } from '@/components/ExperienceDropdown';

export default function ScraperSetupPage() {
  const router = useRouter();
  const { channels, parsedResumeSkills, uploadedResumeName } = useApp();

  const [mustHaveKeywords, setMustHaveKeywords] = useState('');
  const [includeKeywords, setIncludeKeywords] = useState('apply, apply at, apply here, role, company');
  const [excludeKeywords, setExcludeKeywords] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>(['Intern', 'Entry-level', 'Mid-level', 'Senior', 'Not Specified']);
  const [messageScope, setMessageScope] = useState<'all' | 'new'>('all');
  const [maxMessages, setMaxMessages] = useState(200);
  const [limitDateRange, setLimitDateRange] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);

  useEffect(() => {
    if (parsedResumeSkills.length > 0) {
      setMustHaveKeywords(parsedResumeSkills.join(', '));
    }
  }, [parsedResumeSkills]);

  const handleStartScraper = async () => {
    setIsRunning(true);
    setLogs([]);
    try {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const baseUrl = (envUrl && envUrl.length > 0) ? envUrl : 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/scraper/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          must_have: mustHaveKeywords,
          exclude: excludeKeywords,
          max_messages: maxMessages,
          start_date: limitDateRange ? startDate : '',
          end_date: limitDateRange ? endDate : '',
          experience_levels: selectedLevels.join(','),
          min_salary: minSalary,
          max_salary: maxSalary,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to run scraper');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable body stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line.trim());
              if (data.type === 'status') {
                setLogs((prev) => [...prev, { type: 'status', message: data.message }]);
              } else if (data.type === 'error') {
                setLogs((prev) => [...prev, { type: 'error', message: data.message }]);
              } else if (data.type === 'progress') {
                setLogs((prev) => [
                  ...prev,
                  {
                    type: 'progress',
                    message: `Searched channel @${data.channel} - found ${data.jobs} jobs (${Math.round(data.progress)}%)`,
                  },
                ]);
              } else if (data.type === 'success') {
                setLogs((prev) => [...prev, { type: 'success', message: `Success! Scraped ${data.result.total_jobs} total jobs.` }]);
                setTimeout(() => {
                  router.push('/listings');
                }, 3000);
              }
            } catch (e) {
              setLogs((prev) => [...prev, { type: 'status', message: line.trim() }]);
            }
          }
        }
      }
    } catch (err) {
      setLogs((prev) => [...prev, { type: 'error', message: err instanceof Error ? err.message : 'Error running scraper' }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Header title="Scraper Settings" subtitle="Configure parameters for search runs" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
          <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase mb-6">Search Keywords Setup</h3>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
                Must Include Keywords (AND)
              </label>
              <textarea
                value={mustHaveKeywords}
                onChange={(e) => setMustHaveKeywords(e.target.value)}
                placeholder="e.g. React, Python"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 outline-none focus:border-gray-300 resize-none h-24 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
                Could Include Keywords (OR)
              </label>
              <textarea
                value={includeKeywords}
                onChange={(e) => setIncludeKeywords(e.target.value)}
                placeholder="apply, apply at, apply here, role, company"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 outline-none focus:border-gray-300 resize-none h-24 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
                Exclude Keywords (NOT)
              </label>
              <textarea
                value={excludeKeywords}
                onChange={(e) => setExcludeKeywords(e.target.value)}
                placeholder="e.g. manager, lead"
                className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 outline-none focus:border-gray-300 resize-none h-24 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
                Experience Levels
              </label>
              <ExperienceDropdown
                selectedLevels={selectedLevels}
                setSelectedLevels={setSelectedLevels}
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
            <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase mb-6">Scraper Run Variables</h3>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-3 uppercase tracking-wider">Message Scope</label>
                <div className="flex bg-gray-100/60 p-1 rounded-full border border-gray-100">
                  <button
                    onClick={() => setMessageScope('all')}
                    className={`flex-1 py-2.5 rounded-full font-bold text-xs transition-all ${messageScope === 'all' ? 'bg-[#121315] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    All Posts
                  </button>
                  <button
                    onClick={() => setMessageScope('new')}
                    className={`flex-1 py-2.5 rounded-full font-bold text-xs transition-all ${messageScope === 'new' ? 'bg-[#121315] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    New Only
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Max Messages ({maxMessages})</label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={maxMessages}
                    onChange={(e) => setMaxMessages(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#9ef01a]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
                  Salary Range (LPA)
                </label>
                <div className="flex flex-col gap-6 bg-gray-50/50 border border-gray-200 rounded-2xl p-6">

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">Min Salary</span>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={minSalary}
                        onChange={(e) => setMinSalary(e.target.value)}
                        className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-800 outline-none focus:border-[#9ef01a] transition-all text-right"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={minSalary || 0}
                      onChange={(e) => setMinSalary(e.target.value)}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#9ef01a]"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">Max Salary</span>
                      <input
                        type="number"
                        placeholder="e.g. 20"
                        value={maxSalary}
                        onChange={(e) => setMaxSalary(e.target.value)}
                        className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-800 outline-none focus:border-[#9ef01a] transition-all text-right"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={maxSalary || 0}
                      onChange={(e) => setMaxSalary(e.target.value)}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#9ef01a]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="limitDate"
                    checked={limitDateRange}
                    onChange={(e) => setLimitDateRange(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-0 accent-black cursor-pointer"
                  />
                  <label htmlFor="limitDate" className="text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none">
                    Limit Posted Date range
                  </label>
                </div>
                {limitDateRange && (
                  <div className="flex gap-2 animate-in fade-in duration-200">
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                      />
                      <Calendar className="w-3.5 h-3.5 text-gray-400 absolute right-3 pointer-events-none" />
                    </div>
                    <div className="flex-1 relative flex items-center">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none"
                      />
                      <Calendar className="w-3.5 h-3.5 text-gray-400 absolute right-3 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="searchWithResume"
                    checked={!!uploadedResumeName}
                    disabled={!uploadedResumeName}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-0 accent-black cursor-pointer"
                  />
                  <label htmlFor="searchWithResume" className="text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer select-none">
                    Search with Resume
                  </label>
                </div>
                {uploadedResumeName ? (
                  <div className="border border-solid border-emerald-100 bg-emerald-50/20 rounded-2xl p-6 text-center shadow-xs flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-extrabold text-emerald-800 truncate max-w-full">
                      {uploadedResumeName}
                    </span>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-6 text-center cursor-pointer transition-all bg-gray-50/20">
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-5 h-5 text-gray-400" />
                      <span className="text-xs font-bold text-gray-500">Select CV Resume File</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4">
        <button
          onClick={handleStartScraper}
          disabled={isRunning}
          className="w-full bg-[#9ef01a] hover:bg-[#8ae010] text-[#121315] font-extrabold py-5 rounded-3xl transition-all shadow-sm tracking-wide text-sm flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current text-[#121315]" />
          {isRunning ? 'Scraping...' : 'Start Scraper run'}
        </button>

        {logs.length > 0 && (
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
            <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase mb-4">Scraper Outputs</h3>
            <div className="bg-gray-950 text-gray-200 font-mono text-xs p-5 rounded-2xl max-h-60 overflow-y-auto space-y-2 border border-gray-900 shadow-inner">
              {logs.map((log, idx) => (
                <div key={idx} className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : 'text-gray-300'}>
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
