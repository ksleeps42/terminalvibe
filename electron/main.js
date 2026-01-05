import { app, BrowserWindow, Tray, Menu, ipcMain, shell, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import Store from 'electron-store';
import {
  checkScreenCapturePermission,
  openScreenCapturePreferences,
  getTerminalWindows,
  captureTerminalThumbnail,
  getAllWindows,
  getAllTerminalTabs
} from './terminalCapture.js';
import {
  isGitRepo,
  getRepoInfo,
  listBranches,
  listWorktrees,
  createWorktree,
  removeWorktree,
  pruneWorktrees,
  generateWorktreePath
} from './gitOperations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const store = new Store();
let mainWindow;
let tray;

// Create menu bar app
function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Active Agents: 0',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Terminal Vibe');
  tray.setContextMenu(contextMenu);

  // Click tray icon to show window
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    vibrancy: 'dark',
  });

  // Load Vite dev server in development, built files in production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    // Don't quit, just hide window
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

app.whenReady().then(() => {
  createTray();
  createWindow();
});

app.on('window-all-closed', () => {
  // Keep app running in menu bar
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// ==========================================
// IPC Handlers - Terminal Capture
// ==========================================

// Check if screen recording permission is granted
ipcMain.handle('check-screen-permission', () => {
  return checkScreenCapturePermission();
});

// Open System Preferences to grant screen recording permission
ipcMain.handle('open-screen-preferences', () => {
  openScreenCapturePreferences();
  return true;
});

// Get list of terminal windows with thumbnails
ipcMain.handle('get-terminal-windows', async () => {
  return await getTerminalWindows();
});

// Get all terminal tabs (from Terminal.app, iTerm, etc.)
ipcMain.handle('get-terminal-tabs', async () => {
  return await getAllTerminalTabs();
});

// Capture a specific terminal window's thumbnail at higher resolution
ipcMain.handle('capture-terminal', async (event, sourceId, width = 800, height = 600) => {
  return await captureTerminalThumbnail(sourceId, { width, height });
});

// Get all windows (for debugging)
ipcMain.handle('get-all-windows', async () => {
  return await getAllWindows();
});

// Legacy handler - now uses getTerminalWindows
ipcMain.handle('get-terminals', async () => {
  return await getTerminalWindows();
});

// ==========================================
// IPC Handlers - Project Configuration
// ==========================================

ipcMain.handle('get-project-config', async () => {
  return store.get('projectConfig', {
    projectName: '',
    repositoryPath: '',
    architectureDiagramUrl: '',
    mermaidDefinition: '',
    contextFiles: [],
    agents: [],
    worktrees: [],
    audioEnabled: true
  });
});

ipcMain.handle('save-project-config', async (event, config) => {
  store.set('projectConfig', config);
  return true;
});

// ==========================================
// IPC Handlers - Window Management
// ==========================================

ipcMain.handle('focus-terminal', async (event, terminalName) => {
  // Legacy handler - just activate the app
  if (process.platform === 'darwin') {
    const { exec } = await import('child_process');
    let appName = 'Terminal';
    const nameLower = (terminalName || '').toLowerCase();
    if (nameLower.includes('iterm')) appName = 'iTerm';
    exec(`osascript -e 'tell application "${appName}" to activate'`);
  }
  return true;
});

// Focus a specific terminal tab
ipcMain.handle('focus-terminal-tab', async (event, { app, windowId, tty, terminalName }) => {
  if (process.platform !== 'darwin') return true;

  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    if (app === 'Terminal') {
      // For Terminal.app, find the tab by TTY and select it
      const script = `
        tell application "Terminal"
          activate
          set targetWindow to null
          set targetTab to null
          repeat with w in windows
            repeat with t in tabs of w
              if tty of t is "${tty}" then
                set targetWindow to w
                set targetTab to t
                exit repeat
              end if
            end repeat
            if targetWindow is not null then exit repeat
          end repeat
          if targetWindow is not null then
            set index of targetWindow to 1
            set selected tab of targetWindow to targetTab
          end if
        end tell
      `;
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    } else if (app === 'iTerm') {
      // For iTerm, activate and try to find session by TTY
      const script = `
        tell application "iTerm2"
          activate
          repeat with w in windows
            repeat with t in tabs of w
              repeat with s in sessions of t
                if tty of s is "${tty}" then
                  select s
                  return
                end if
              end repeat
            end repeat
          end repeat
        end tell
      `;
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    } else {
      // Generic fallback - just activate the app
      await execAsync(`osascript -e 'tell application "${app}" to activate'`);
    }
  } catch (error) {
    console.error('Error focusing terminal tab:', error.message);
  }

  return true;
});

// Open external URL
ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
  return true;
});

// ==========================================
// IPC Handlers - Git Operations
// ==========================================

// Select a repository folder
ipcMain.handle('select-repository', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Git Repository',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  const repoPath = result.filePaths[0];
  const isRepo = await isGitRepo(repoPath);

  if (!isRepo) {
    return { success: false, error: 'Selected folder is not a git repository' };
  }

  return await getRepoInfo(repoPath);
});

// Get repository info
ipcMain.handle('get-repo-info', async (event, repoPath) => {
  return await getRepoInfo(repoPath);
});

// List all branches
ipcMain.handle('list-branches', async (event, repoPath) => {
  return await listBranches(repoPath);
});

// List all worktrees
ipcMain.handle('list-worktrees', async (event, repoPath) => {
  return await listWorktrees(repoPath);
});

// Create a new worktree
ipcMain.handle('create-worktree', async (event, repoPath, branch, targetPath, createBranch = false) => {
  // If no targetPath provided, generate one
  const finalPath = targetPath || generateWorktreePath(repoPath, branch);
  return await createWorktree(repoPath, branch, finalPath, createBranch);
});

// Remove a worktree
ipcMain.handle('remove-worktree', async (event, repoPath, worktreePath, force = false) => {
  return await removeWorktree(repoPath, worktreePath, force);
});

// Prune stale worktrees
ipcMain.handle('prune-worktrees', async (event, repoPath) => {
  return await pruneWorktrees(repoPath);
});

// ==========================================
// IPC Handlers - File Import
// ==========================================

// Import files (for context/architecture)
ipcMain.handle('import-files', async (event, options = {}) => {
  const filters = options.filters || [
    { name: 'Text Files', extensions: ['md', 'txt', 'json', 'yaml', 'yml'] },
    { name: 'Mermaid', extensions: ['mmd', 'mermaid'] },
    { name: 'All Files', extensions: ['*'] }
  ];

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: options.title || 'Import Files',
    filters,
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  // Read file contents
  const files = await Promise.all(
    result.filePaths.map(async (filePath) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return {
          path: filePath,
          name: path.basename(filePath),
          content,
        };
      } catch (error) {
        return {
          path: filePath,
          name: path.basename(filePath),
          error: error.message,
        };
      }
    })
  );

  return { success: true, files };
});

// Read a single file
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
