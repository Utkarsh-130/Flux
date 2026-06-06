import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  runScraper: (channels: string[], keywords: any) => {
    ipcRenderer.send('scraper:run', channels, keywords);
  },
  
  stopScraper: () => {
    ipcRenderer.send('scraper:stop');
  },

  onScraperProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('scraper:progress', (_, data) => callback(data));
  },

  onScraperJobFound: (callback: (job: any) => void) => {
    ipcRenderer.on('scraper:jobFound', (_, job) => callback(job));
  },

  onScraperComplete: (callback: (result: any) => void) => {
    ipcRenderer.on('scraper:complete', (_, result) => callback(result));
  },

  onScraperError: (callback: (error: any) => void) => {
    ipcRenderer.on('scraper:error', (_, error) => callback(error));
  },

  pythonRequest: (data: any) => ipcRenderer.invoke('python:request', data),

  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  isDev: () => process.env.NODE_ENV === 'development',
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
  }
}

export type ElectronAPI = typeof electronAPI;
