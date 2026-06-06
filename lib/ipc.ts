declare global {
  interface Window {
    electronAPI?: {
      runScraper: (channels: string[], keywords: any) => void;
      stopScraper: () => void;
      onScraperProgress: (callback: (data: any) => void) => void;
      onScraperJobFound: (callback: (job: any) => void) => void;
      onScraperComplete: (callback: (result: any) => void) => void;
      onScraperError: (callback: (error: any) => void) => void;
      pythonRequest: (data: any) => Promise<any>;
      isDev: () => boolean;
    };
  }
}

export const ipc = {
  runScraper: (channels: string[], keywords: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.runScraper(channels, keywords);
    }
  },

  stopScraper: () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.stopScraper();
    }
  },

  onScraperProgress: (callback: (data: any) => void) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onScraperProgress(callback);
    }
  },

  onScraperJobFound: (callback: (job: any) => void) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onScraperJobFound(callback);
    }
  },

  onScraperComplete: (callback: (result: any) => void) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onScraperComplete(callback);
    }
  },

  onScraperError: (callback: (error: any) => void) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onScraperError(callback);
    }
  },

  pythonRequest: async (data: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return await window.electronAPI.pythonRequest(data);
    }
    return null;
  },

  isDev: () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.isDev();
    }
    return false;
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
