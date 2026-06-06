"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainWindow = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const isDev = !electron_1.app.isPackaged;
let mainWindow = null;
exports.mainWindow = mainWindow;
let pythonProcess = null;
// Next.js static files are served by Flask in production, so we don't start Next server
function createWindow() {
    exports.mainWindow = mainWindow = new electron_1.BrowserWindow({
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
            electron_1.shell.openExternal(url);
        }
        return { action: 'deny' };
    });
    const startUrl = isDev ? 'http://localhost:3000' : 'http://localhost:5000';
    if (isDev) {
        mainWindow.loadURL(startUrl);
        mainWindow.webContents.openDevTools();
    }
    else {
        setTimeout(() => {
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.loadURL(startUrl);
        }, 2500);
    }
    mainWindow.on('closed', () => {
        exports.mainWindow = mainWindow = null;
    });
}
function startPythonBackend() {
    let scriptPath;
    if (electron_1.app.isPackaged) {
        scriptPath = path.join(process.resourcesPath, 'dist/FluxMini.exe');
    }
    else {
        // In dev, we can still run python app.py or the compiled one
        scriptPath = path.join(__dirname, '../dist/FluxMini.exe');
        if (!fs.existsSync(scriptPath)) {
            // Fallback for dev if not compiled
            scriptPath = path.join(__dirname, '../app.py');
            pythonProcess = (0, child_process_1.spawn)('python', [scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: Object.assign(Object.assign({}, process.env), { PYTHONUNBUFFERED: '1' })
            });
            setupPythonProcess();
            return;
        }
    }
    if (!fs.existsSync(scriptPath)) {
        console.warn('[Electron] Python backend not found at', scriptPath);
        return;
    }
    pythonProcess = (0, child_process_1.spawn)(scriptPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: Object.assign(Object.assign({}, process.env), { PYTHONUNBUFFERED: '1' }),
    });
    setupPythonProcess();
}
function setupPythonProcess() {
    var _a, _b;
    (_a = pythonProcess === null || pythonProcess === void 0 ? void 0 : pythonProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', (data) => {
        console.log('[Python]', data.toString().trim());
    });
    (_b = pythonProcess === null || pythonProcess === void 0 ? void 0 : pythonProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', (data) => {
        console.error('[Python Error]', data.toString().trim());
    });
    pythonProcess === null || pythonProcess === void 0 ? void 0 : pythonProcess.on('close', (code) => {
        console.log('[Python] Process exited with code', code);
        pythonProcess = null;
    });
}
electron_1.ipcMain.on('scraper:run', (event, channelList, keywords) => {
    if (mainWindow) {
        if (pythonProcess === null || pythonProcess === void 0 ? void 0 : pythonProcess.stdin) {
            const message = JSON.stringify({
                command: 'scraper:run',
                channels: channelList,
                keywords,
            });
            pythonProcess.stdin.write(message + '\n');
        }
    }
});
electron_1.ipcMain.on('scraper:stop', () => {
    if (pythonProcess === null || pythonProcess === void 0 ? void 0 : pythonProcess.stdin) {
        pythonProcess.stdin.write(JSON.stringify({ command: 'scraper:stop' }) + '\n');
    }
});
electron_1.ipcMain.handle('python:request', (event, data) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        if (pythonProcess === null || pythonProcess === void 0 ? void 0 : pythonProcess.stdin) {
            pythonProcess.stdin.write(JSON.stringify(data) + '\n');
            resolve({ success: true });
        }
        else {
            resolve({ success: false, error: 'Python process not running' });
        }
    });
}));
electron_1.ipcMain.on('window:minimize', () => {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.minimize();
});
electron_1.ipcMain.on('window:maximize', () => {
    if (mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    }
    else {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.maximize();
    }
});
electron_1.ipcMain.on('window:close', () => {
    mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.close();
});
electron_1.app.on('ready', () => {
    startPythonBackend();
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
