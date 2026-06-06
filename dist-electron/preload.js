"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    runScraper: (channels, keywords) => {
        electron_1.ipcRenderer.send('scraper:run', channels, keywords);
    },
    stopScraper: () => {
        electron_1.ipcRenderer.send('scraper:stop');
    },
    onScraperProgress: (callback) => {
        electron_1.ipcRenderer.on('scraper:progress', (_, data) => callback(data));
    },
    onScraperJobFound: (callback) => {
        electron_1.ipcRenderer.on('scraper:jobFound', (_, job) => callback(job));
    },
    onScraperComplete: (callback) => {
        electron_1.ipcRenderer.on('scraper:complete', (_, result) => callback(result));
    },
    onScraperError: (callback) => {
        electron_1.ipcRenderer.on('scraper:error', (_, error) => callback(error));
    },
    pythonRequest: (data) => electron_1.ipcRenderer.invoke('python:request', data),
    minimizeWindow: () => electron_1.ipcRenderer.send('window:minimize'),
    maximizeWindow: () => electron_1.ipcRenderer.send('window:maximize'),
    closeWindow: () => electron_1.ipcRenderer.send('window:close'),
    isDev: () => process.env.NODE_ENV === 'development',
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
