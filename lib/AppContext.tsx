'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  deadline: string;
  channel: string;
  initials: string;
  color: string;
  snippet: string;
  dateString: string; 
  scraped_at?: string;
  requiredSkills: string[];
  apply_link?: string;
}

interface TrackedJob {
  id: string;
  title: string;
  company: string;
  status: 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected';
}

interface Channel {
  id: string;
  name: string;
}

interface AppContextType {
  jobs: Job[];
  trackedJobs: TrackedJob[];
  channels: Channel[];
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  showSearchOverlay: boolean;
  setShowSearchOverlay: (show: boolean) => void;
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
  addChannel: (name: string) => void;
  removeChannel: (id: string) => void;
  clearChannels: () => void;
  trackJob: (jobId: string, status?: 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected') => void;
  moveTrackedJob: (id: string, status: 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected') => void;
  parsedResumeSkills: string[];
  setParsedResumeSkills: (skills: string[]) => void;
  isTelegramLoggedIn: boolean;
  setIsTelegramLoggedIn: (loggedIn: boolean) => void;
  uploadedResumeName: string | null;
  setUploadedResumeName: (name: string | null) => void;
  isLoadingJobs: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [channels, setChannels] = useState<Channel[]>([
    { id: '1', name: 'LMTPlacements' },
    { id: '2', name: 'algoprep_in' },
    { id: '3', name: 'jobs_off_campus' },
    { id: '4', name: 'jobs4fresherdotcom' },
    { id: '5', name: 'jobsinternshipshub' },
    { id: '6', name: 'offcampusjobs_4u' },
    { id: '7', name: 'dot_aware' },
  ]);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [parsedResumeSkills, setParsedResumeSkills] = useState<string[]>([]);
  const [isTelegramLoggedInState, setIsTelegramLoggedInState] = useState(false);
  const isTelegramLoggedIn = isTelegramLoggedInState;
  const setIsTelegramLoggedIn = (loggedIn: boolean) => {
    setIsTelegramLoggedInState(loggedIn);
    if (typeof window !== 'undefined') {
      if (loggedIn) {
        localStorage.setItem('isTelegramLoggedIn', 'true');
      } else {
        localStorage.removeItem('isTelegramLoggedIn');
      }
    }
  };
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  const fallbackJobs: Job[] = [
    {
      id: 'fallback-1',
      initials: 'HA',
      color: 'bg-purple-100 text-purple-700',
      title: 'Associate Engineer',
      company: 'Harman',
      location: 'Bangalore',
      salary: 'N/A',
      deadline: 'N/A',
      channel: 'LMTPlacements',
      snippet: 'Company: Harman Role: Associate Engineer Location: Bangalore Apply at: https://jobsearch.harman.com...',
      dateString: new Date().toISOString().split('T')[0],
      requiredSkills: ['React', 'JavaScript', 'CSS'],
    },
    {
      id: 'fallback-2',
      initials: 'ET',
      color: 'bg-lime-100 text-lime-700',
      title: 'Graduate Software Trainee',
      company: 'ETG',
      location: 'Bengaluru',
      salary: '6+ LPA',
      deadline: 'N/A',
      channel: 'LMTPlacements',
      snippet: 'Company: ETG Role: Graduate Software Trainee Location: Bengaluru Salary: 6+ LPA Apply at: https://...',
      dateString: new Date().toISOString().split('T')[0],
      requiredSkills: ['React', 'TypeScript', 'Java'],
    },
    {
      id: 'fallback-3',
      initials: 'AV',
      color: 'bg-blue-100 text-blue-700',
      title: 'Junior Software Developer',
      company: 'Avua',
      location: 'Remote',
      salary: '5+ LPA',
      deadline: 'N/A',
      channel: 'LMTPlacements',
      snippet: 'Company: Avua Role: Junior Software Developer Location: Remote Salary: 5+ LPA Apply at: https://...',
      dateString: new Date().toISOString().split('T')[0],
      requiredSkills: ['Python', 'Docker', 'AWS'],
    },
  ];

  const [jobs, setJobs] = useState<Job[]>(fallbackJobs);
  const [trackedJobs, setTrackedJobs] = useState<TrackedJob[]>([]);

  const refreshJobs = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${baseUrl}/api/jobs`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setJobs(data);
        }
      }
    } catch (e) {
      console.warn('Backend not ready yet, retrying in next cycle...');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    refreshJobs();
    const interval = setInterval(refreshJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedAuth = localStorage.getItem('isTelegramLoggedIn');
      if (storedAuth === 'true') {
        setIsTelegramLoggedIn(true);
      }
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${baseUrl}/api/auth/status`);
        if (res.ok) {
          try {
            const data = await res.json();
            setIsTelegramLoggedIn(data.authenticated);
            if (data.authenticated) {
              localStorage.setItem('isTelegramLoggedIn', 'true');
            } else {
              localStorage.removeItem('isTelegramLoggedIn');
            }
          } catch (jsonError) {
            console.error('API returned non-JSON response. Ensure backend is updated.', jsonError);
          }
        }
      } catch (e) {
        console.warn('Backend not ready yet for auth check, retrying in next cycle...');
      }
    };
    checkAuthStatus();
  }, []);

  const addChannel = (name: string) => {
    if (name.trim()) {
      setChannels((prev) => [...prev, { id: Date.now().toString(), name: name.trim() }]);
    }
  };

  const removeChannel = (id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id));
  };

  const clearChannels = () => {
    setChannels([]);
  };

  const trackJob = (jobId: string, status: 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected' = 'wishlist') => {
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setTrackedJobs((prev) => {
        if (prev.some((j) => j.id === jobId)) return prev;
        return [...prev, { id: jobId, title: job.title, company: job.company, status }];
      });
    }
  };

  const moveTrackedJob = (id: string, status: 'wishlist' | 'applied' | 'interviewing' | 'offered' | 'rejected') => {
    setTrackedJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, status } : j))
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchOverlay(true);
      }
      if (e.key === 'Escape') {
        setShowSearchOverlay(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        jobs,
        trackedJobs,
        channels,
        showSettingsModal,
        setShowSettingsModal,
        showSearchOverlay,
        setShowSearchOverlay,
        globalSearchTerm,
        setGlobalSearchTerm,
        addChannel,
        removeChannel,
        clearChannels,
        trackJob,
        moveTrackedJob,
        parsedResumeSkills,
        setParsedResumeSkills,
        isTelegramLoggedIn,
        setIsTelegramLoggedIn,
        uploadedResumeName,
        setUploadedResumeName,
        isLoadingJobs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
