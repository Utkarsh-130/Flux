'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { Play, FileText, Upload, CheckCircle2, ExternalLink } from 'lucide-react';
import { Header } from '@/components/Header';

export default function YouTubeScraperPage() {
  const router = useRouter();
  const { channels, parsedResumeSkills, uploadedResumeName } = useApp();

  const [youtubeChannels, setYoutubeChannels] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string }[]>([]);
  const [links, setLinks] = useState<any[]>([]);

  const fetchLinks = async () => {
    try {
      const envUrl = process.env.NEXT_PUBLIC_API_URL;
      const baseUrl = (envUrl && envUrl.length > 0) ? envUrl : 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/youtube-links`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLinks(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);



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
          max_messages: 10,
          start_date: '',
          end_date: '',
          youtube_channels: youtubeChannels,
          scrape_telegram: false,
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
                setLogs((prev) => [...prev, { type: 'success', message: `Success! Extracted ${data.result.total_jobs} links.` }]);
                fetchLinks();
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
      <Header title="YouTube Scraper Settings" subtitle="Extract links from YouTube videos or channels" />

      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50">
        
        <div className="max-w-3xl">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
              YouTube Video or Channel URLs
            </label>
            <textarea
              value={youtubeChannels}
              onChange={(e) => setYoutubeChannels(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ, https://www.youtube.com/@NetworkChuck"
              className="w-full bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 outline-none focus:border-gray-300 resize-none h-32 transition-all"
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1 font-semibold">Separate multiple URLs with commas. You can provide direct video URLs or channel URLs (will fetch up to 10 latest videos).</p>
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

        {links.length > 0 && (
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100/50 mt-6">
            <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase mb-6 flex items-center justify-between">
              Extracted Links ({links.length})
              <button 
                onClick={async () => {
                  try {
                    const envUrl = process.env.NEXT_PUBLIC_API_URL;
                    const baseUrl = (envUrl && envUrl.length > 0) ? envUrl : 'http://localhost:5000';
                    await fetch(`${baseUrl}/api/youtube-links/clear`, { method: 'POST' });
                    fetchLinks();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="text-red-500 hover:text-red-600 transition-colors"
              >
                Clear
              </button>
            </h3>
            <div className="space-y-4">
              {links.map((link) => (
                <div key={link.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-extrabold text-sm text-[#1a253c]">{link.video_title}</h4>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      @{link.channel_name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium whitespace-pre-wrap bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3">
                    {link.context}
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-gray-400 truncate flex-1">{link.link_url}</span>
                    <a href={link.link_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 bg-[#121315] hover:bg-[#2a3654] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0">
                      Go <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
