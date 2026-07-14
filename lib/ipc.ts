import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export const ipc = {
  runScraper: async (channels: string[], keywords: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      await invoke('run_scraper', { channels, keywords });
    }
  },

  stopScraper: async () => {
    if (typeof window !== 'undefined') {
      await invoke('stop_scraper');
    }
  },

  onScraperProgress: async (callback: (data: any) => void): Promise<UnlistenFn | undefined> => {
    if (typeof window !== 'undefined') {
      return await listen('scraper:progress', (event) => callback(event.payload));
    }
  },

  onScraperJobFound: async (callback: (job: any) => void): Promise<UnlistenFn | undefined> => {
    if (typeof window !== 'undefined') {
      return await listen('scraper:jobFound', (event) => callback(event.payload));
    }
  },

  onScraperComplete: async (callback: (result: any) => void): Promise<UnlistenFn | undefined> => {
    if (typeof window !== 'undefined') {
      return await listen('scraper:complete', (event) => callback(event.payload));
    }
  },

  onScraperError: async (callback: (error: any) => void): Promise<UnlistenFn | undefined> => {
    if (typeof window !== 'undefined') {
      return await listen('scraper:error', (event) => callback(event.payload));
    }
  },

  pythonRequest: async (data: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      return await invoke('python_request', { data });
    }
    return null;
  },

  isDev: () => {
    // In Tauri, we can check process.env or just assume false for now unless we implement a dev check command
    return process.env.NODE_ENV === 'development';
  },
};

export type IPCRequest = {
  command:
    | 'scraper:run'
    | 'scraper:stop'
    | 'db:getJobs'
    | 'db:addChannel'
    | 'db:removeChannel'
    | 'db:getChannels'
    | 'db:addApplication'
    | 'db:updateApplication'
    | 'parser:analyzeResume';
  [key: string]: any;
};
