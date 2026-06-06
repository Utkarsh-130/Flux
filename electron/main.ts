import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let pythonProcess: ChildProcess | null = null;

// Next.js static files are served by Flask in production, so we don't start Next server

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const startUrl = isDev ? 'http://localhost:3000' : 'http://localhost:5000';

  if (isDev) {
    mainWindow.loadURL(startUrl);
    mainWindow.webContents.openDevTools();
  } else {
    setTimeout(() => {
      mainWindow?.loadURL(startUrl);
    }, 2500);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startPythonBackend() {
  let scriptPath: string;
  
  if (app.isPackaged) {
    scriptPath = path.join(process.resourcesPath, 'dist/FluxMini.exe');
  } else {
    // In dev, we can still run python app.py or the compiled one
    scriptPath = path.join(__dirname, '../dist/FluxMini.exe');
    if (!fs.existsSync(scriptPath)) {
        // Fallback for dev if not compiled
        scriptPath = path.join(__dirname, '../app.py');
        pythonProcess = spawn('python', [scriptPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });
        setupPythonProcess();
        return;
    }
  }

  if (!fs.existsSync(scriptPath)) {
    console.warn('[Electron] Python backend not found at', scriptPath);
    return;
  }

  pythonProcess = spawn(scriptPath, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
    },
  });

  setupPythonProcess();
}

function setupPythonProcess() {
  pythonProcess?.stdout?.on('data', (data) => {
    console.log('[Python]', data.toString().trim());
  });

  pythonProcess?.stderr?.on('data', (data) => {
    console.error('[Python Error]', data.toString().trim());
  });

  pythonProcess?.on('close', (code) => {
    console.log('[Python] Process exited with code', code);
    pythonProcess = null;
  });
}

ipcMain.on('scraper:run', (event, channelList: string[], keywords: any) => {
  if (mainWindow) {
    if (pythonProcess?.stdin) {
      const message = JSON.stringify({
        command: 'scraper:run',
        channels: channelList,
        keywords,
      });
      pythonProcess.stdin.write(message + '\n');
    }
  }
});

ipcMain.on('scraper:stop', () => {
  if (pythonProcess?.stdin) {
    pythonProcess.stdin.write(JSON.stringify({ command: 'scraper:stop' }) + '\n');
  }
});

ipcMain.handle('python:request', async (event, data) => {
  return new Promise((resolve) => {
    if (pythonProcess?.stdin) {
      pythonProcess.stdin.write(JSON.stringify(data) + '\n');
      resolve({ success: true });
    } else {
      resolve({ success: false, error: 'Python process not running' });
    }
  });
});

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

app.on('ready', () => {
  startPythonBackend();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

export { mainWindow };
