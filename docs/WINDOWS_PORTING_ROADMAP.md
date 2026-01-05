# Windows Porting Roadmap

This document provides a comprehensive guide for porting Terminal Vibe from macOS to Windows. It identifies all platform-specific code, explains the required changes, and provides step-by-step implementation guidance.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Differences](#architecture-differences)
3. [Required Changes by Priority](#required-changes-by-priority)
4. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
5. [Phase 2: Terminal Detection](#phase-2-terminal-detection)
6. [Phase 3: Terminal Interaction](#phase-3-terminal-interaction)
7. [Phase 4: UI Adaptations](#phase-4-ui-adaptations)
8. [Phase 5: Build & Distribution](#phase-5-build--distribution)
9. [Testing Checklist](#testing-checklist)
10. [Resources & References](#resources--references)

---

## Overview

Terminal Vibe uses several macOS-specific APIs and technologies:

| Technology | macOS Usage | Windows Alternative |
|------------|-------------|---------------------|
| AppleScript (`osascript`) | Terminal automation | PowerShell / Win32 API |
| `systemPreferences.getMediaAccessStatus()` | Screen capture permissions | Not required on Windows |
| `titleBarStyle: 'hiddenInset'` | Native title bar | Custom frameless window |
| `vibrancy: 'dark'` | Blurred glass effect | Mica/Acrylic (Windows 11) or solid background |
| Terminal.app / iTerm2 | Default terminals | Windows Terminal / PowerShell / cmd.exe |

### Files Requiring Changes

| File | Changes Required | Effort |
|------|------------------|--------|
| `electron/terminalCapture.js` | Major rewrite | High |
| `electron/main.js` | Platform conditionals | Medium |
| `src/components/Worktree/WorktreeCard.jsx` | Platform conditionals | Low |
| `src/components/Permissions/PermissionPrompt.jsx` | Platform-specific text | Low |
| `package.json` | Build config for Windows | Low |

---

## Architecture Differences

### macOS Approach (Current)
```
┌─────────────────────────────────────────┐
│           Terminal Vibe App             │
├─────────────────────────────────────────┤
│ AppleScript (osascript)                 │
│   ├── Detect running Terminal.app       │
│   ├── Enumerate windows/tabs            │
│   ├── Get tab content/status            │
│   ├── Focus specific tabs               │
│   └── Open new terminal at path         │
├─────────────────────────────────────────┤
│ systemPreferences API                   │
│   └── Check screen recording permission │
├─────────────────────────────────────────┤
│ desktopCapturer API (cross-platform)    │
│   └── Capture terminal screenshots      │
└─────────────────────────────────────────┘
```

### Windows Approach (Target)
```
┌─────────────────────────────────────────┐
│           Terminal Vibe App             │
├─────────────────────────────────────────┤
│ wt.exe CLI / PowerShell                 │
│   ├── Open new tabs/windows             │
│   ├── Focus tabs (wt.exe focus-tab)     │
│   └── Set titles, profiles              │
├─────────────────────────────────────────┤
│ Win32 API (via win32-api or node-ffi)   │
│   ├── EnumWindows - find terminal windows│
│   ├── GetWindowText - get window titles │
│   ├── SetForegroundWindow - focus       │
│   └── GetWindowThreadProcessId          │
├─────────────────────────────────────────┤
│ ps-list / node-processlist              │
│   └── Detect running terminal processes │
├─────────────────────────────────────────┤
│ desktopCapturer API (cross-platform)    │
│   └── Capture terminal screenshots      │
└─────────────────────────────────────────┘
```

---

## Required Changes by Priority

### Critical (Blocks Core Functionality)
1. **Terminal Detection** - Replace AppleScript-based detection with Windows process/window enumeration
2. **Tab Enumeration** - Windows Terminal doesn't expose tabs via API; use window-based approach
3. **Window Focus** - Replace `osascript` with Win32 `SetForegroundWindow`
4. **Open Terminal at Path** - Replace AppleScript with `wt.exe` or PowerShell

### Important (Affects User Experience)
5. **Screen Capture Permissions** - Update UI text (Windows doesn't need manual permission)
6. **Window Styling** - Replace macOS vibrancy with Windows-appropriate styling
7. **Terminal App List** - Add Windows-specific terminals

### Nice to Have
8. **Build Configuration** - Add Windows targets to electron-builder
9. **Icons** - Create `.ico` version of app icon

---

## Phase 1: Core Infrastructure

### 1.1 Install Windows-Specific Dependencies

Add these to `package.json`:

```json
{
  "optionalDependencies": {
    "win32-api": "^21.0.0",
    "ps-list": "^8.1.1"
  }
}
```

**Why optional?** These packages only work on Windows and would fail to install on macOS.

### 1.2 Create Platform Utilities

Create a new file `electron/platform.js`:

```javascript
// electron/platform.js
export const isWindows = process.platform === 'win32';
export const isMac = process.platform === 'darwin';
export const isLinux = process.platform === 'linux';

// Terminal app identifiers by platform
export const TERMINAL_APPS = {
  darwin: [
    'Terminal',
    'iTerm2',
    'iTerm',
    'Warp',
    'Hyper',
    'Alacritty',
    'kitty',
    'WezTerm',
    'Tabby',
    'Rio',
  ],
  win32: [
    'Windows Terminal',
    'WindowsTerminal',
    'cmd',
    'Command Prompt',
    'PowerShell',
    'pwsh',
    'ConEmu',
    'ConEmu64',
    'Cmder',
    'Hyper',
    'Alacritty',
    'WezTerm',
    'Tabby',
    'Git Bash',
    'mintty',
  ],
  linux: [
    'gnome-terminal',
    'konsole',
    'xterm',
    'Alacritty',
    'kitty',
    'WezTerm',
    'Tabby',
    'Hyper',
    'Terminator',
  ]
};

export function getTerminalApps() {
  return TERMINAL_APPS[process.platform] || TERMINAL_APPS.linux;
}
```

### 1.3 Update Screen Capture Permission Handling

In `electron/terminalCapture.js`, the permission check already returns `true` for non-macOS. No code change needed, but update the UI:

**File:** `src/components/Permissions/PermissionPrompt.jsx`

The component should not show at all on Windows since `checkScreenCapturePermission()` returns `true`. However, update the help text for clarity:

```jsx
// Add platform detection
const isWindows = navigator.platform.indexOf('Win') > -1;

// In the component, show platform-appropriate text:
<p className="text-xs text-gray-600 mt-4">
  {isWindows ? (
    'Windows does not require special permissions for screen capture.'
  ) : (
    'You can enable this later in macOS System Preferences → Security & Privacy → Privacy → Screen Recording'
  )}
</p>
```

---

## Phase 2: Terminal Detection

### 2.1 Create Windows Terminal Detection Module

Create `electron/windowsTerminal.js`:

```javascript
// electron/windowsTerminal.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Windows terminal process names
const TERMINAL_PROCESSES = [
  'WindowsTerminal.exe',
  'cmd.exe',
  'powershell.exe',
  'pwsh.exe',
  'ConEmu.exe',
  'ConEmu64.exe',
  'Cmder.exe',
  'mintty.exe',
  'Hyper.exe',
  'alacritty.exe',
  'wezterm-gui.exe',
  'Tabby.exe',
];

/**
 * Get list of running terminal processes using tasklist
 */
export async function getRunningTerminals() {
  try {
    // Use tasklist to get running processes
    const { stdout } = await execAsync(
      'tasklist /FO CSV /NH',
      { encoding: 'utf8' }
    );

    const processes = stdout
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        // Parse CSV: "process.exe","PID","Session","Session#","Memory"
        const match = line.match(/"([^"]+)","(\d+)"/);
        if (match) {
          return { name: match[1], pid: parseInt(match[2]) };
        }
        return null;
      })
      .filter(Boolean);

    // Filter to terminal processes
    const terminals = processes.filter(p =>
      TERMINAL_PROCESSES.some(term =>
        p.name.toLowerCase() === term.toLowerCase()
      )
    );

    return terminals;
  } catch (error) {
    console.error('Error getting running terminals:', error);
    return [];
  }
}

/**
 * Open a new Windows Terminal tab at a specific path
 * Uses wt.exe CLI: https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments
 */
export async function openTerminalAtPath(dirPath) {
  try {
    // Escape the path for command line
    const escapedPath = dirPath.replace(/"/g, '\\"');

    // Try Windows Terminal first (most common modern choice)
    // -d sets the starting directory
    await execAsync(`wt.exe -d "${escapedPath}"`, { encoding: 'utf8' });
    return { success: true };
  } catch (error) {
    // Fallback to PowerShell if Windows Terminal not installed
    try {
      await execAsync(
        `start powershell -NoExit -Command "Set-Location '${escapedPath}'"`,
        { encoding: 'utf8' }
      );
      return { success: true };
    } catch (fallbackError) {
      // Final fallback: cmd.exe
      try {
        await execAsync(`start cmd /K "cd /d ${escapedPath}"`, { encoding: 'utf8' });
        return { success: true };
      } catch (cmdError) {
        return { success: false, error: cmdError.message };
      }
    }
  }
}

/**
 * Focus a terminal window by process ID
 * Requires win32-api package
 */
export async function focusTerminalWindow(pid) {
  try {
    // Dynamic import to avoid errors on non-Windows
    const { User32 } = await import('win32-api');
    const user32 = User32.load();

    // This is a simplified approach - in practice you'd need to:
    // 1. EnumWindows to find windows
    // 2. GetWindowThreadProcessId to match PID
    // 3. SetForegroundWindow to focus

    // For now, use PowerShell as a simpler approach:
    await execAsync(`
      powershell -Command "
        $process = Get-Process -Id ${pid} -ErrorAction SilentlyContinue
        if ($process) {
          $sig = '[DllImport(\\"user32.dll\\")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
          Add-Type -MemberDefinition $sig -Name NativeMethods -Namespace Win32
          [Win32.NativeMethods]::SetForegroundWindow($process.MainWindowHandle)
        }
      "
    `);
    return { success: true };
  } catch (error) {
    console.error('Error focusing terminal:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Alternative: Use wttab npm package for Windows Terminal control
 * npm install wttab
 *
 * Usage:
 *   import wttab from 'wttab';
 *   wttab.open({ title: 'My Tab', dir: '/path/to/dir' });
 */
```

### 2.2 Update terminalCapture.js for Cross-Platform

Modify `electron/terminalCapture.js`:

```javascript
// At the top, add imports
import { isWindows, isMac, getTerminalApps } from './platform.js';

// Replace the hardcoded TERMINAL_APPS array:
const TERMINAL_APPS = getTerminalApps();

// Update getTerminalTabs to be cross-platform:
export async function getTerminalTabs() {
  if (isMac) {
    return getMacTerminalTabs(); // Rename existing function
  } else if (isWindows) {
    return getWindowsTerminalTabs();
  }
  return []; // Linux - not yet implemented
}

// Rename existing getTerminalTabs to getMacTerminalTabs
async function getMacTerminalTabs() {
  // ... existing AppleScript implementation ...
}

// Add Windows implementation
async function getWindowsTerminalTabs() {
  // Windows Terminal doesn't expose tabs via API
  // Instead, return one "tab" per terminal window detected

  try {
    const { getRunningTerminals } = await import('./windowsTerminal.js');
    const terminals = await getRunningTerminals();

    return terminals.map((term, index) => ({
      id: `win-terminal-${term.pid}`,
      windowId: term.pid.toString(),
      title: term.name.replace('.exe', ''),
      tty: null, // Not available on Windows
      busy: false, // Would need more complex detection
      process: term.name,
      contentChanging: false,
      hasQuestion: false,
      app: term.name.replace('.exe', ''),
      pid: term.pid
    }));
  } catch (error) {
    console.error('Error getting Windows terminals:', error);
    return [];
  }
}
```

### 2.3 Limitations on Windows

**Important Note for Your Friend:**

Windows Terminal does not currently expose an API for:
- Enumerating tabs within a window
- Getting terminal content/history
- Detecting "busy" status
- Detecting prompts/questions

This is a known limitation. There's an [open feature request](https://github.com/microsoft/terminal/issues/16568) on the Windows Terminal GitHub for a programmatic API.

**Workarounds:**
1. Treat each terminal window as a single unit (no tab enumeration)
2. Use `desktopCapturer` screenshots to show what's happening (this works cross-platform)
3. Consider supporting WezTerm which has a CLI API: `wezterm cli list`

---

## Phase 3: Terminal Interaction

### 3.1 Update focus-terminal IPC Handler

**File:** `electron/main.js` (lines 190-262)

```javascript
// Replace the focus-terminal handler:
ipcMain.handle('focus-terminal', async (event, terminalName) => {
  if (process.platform === 'darwin') {
    // Existing macOS code
    const { exec } = await import('child_process');
    let appName = 'Terminal';
    const nameLower = (terminalName || '').toLowerCase();
    if (nameLower.includes('iterm')) appName = 'iTerm';
    exec(`osascript -e 'tell application "${appName}" to activate'`);
  } else if (process.platform === 'win32') {
    // Windows implementation
    const { focusTerminalWindow } = await import('./windowsTerminal.js');
    // If terminalName contains a PID, use it
    const pidMatch = terminalName?.match(/\d+/);
    if (pidMatch) {
      await focusTerminalWindow(parseInt(pidMatch[0]));
    }
  }
  return true;
});

// Replace the focus-terminal-tab handler:
ipcMain.handle('focus-terminal-tab', async (event, { app, windowId, tty, terminalName, pid }) => {
  if (process.platform === 'darwin') {
    // Existing macOS AppleScript code (keep as-is)
    // ...
  } else if (process.platform === 'win32') {
    // Windows: Focus by PID
    if (pid) {
      const { focusTerminalWindow } = await import('./windowsTerminal.js');
      await focusTerminalWindow(pid);
    }
  }
  return true;
});
```

### 3.2 Update WorktreeCard.jsx

**File:** `src/components/Worktree/WorktreeCard.jsx` (lines 10-25)

```jsx
const handleOpenInTerminal = async () => {
  const isWindows = navigator.platform.indexOf('Win') > -1;

  if (isWindows) {
    // Use IPC to open terminal (handled in main process)
    try {
      await ipcRenderer.invoke('open-terminal-at-path', worktree.path);
    } catch (err) {
      console.error('Failed to open terminal:', err);
    }
  } else {
    // macOS: existing AppleScript approach
    const script = `
      tell application "Terminal"
        do script "cd '${worktree.path}'"
        activate
      end tell
    `;
    try {
      const { exec } = window.require('child_process');
      exec(`osascript -e '${script}'`);
    } catch (err) {
      console.error('Failed to open terminal:', err);
    }
  }
};
```

### 3.3 Add New IPC Handler for Opening Terminal

**File:** `electron/main.js`

```javascript
// Add new handler for opening terminal at path
ipcMain.handle('open-terminal-at-path', async (event, dirPath) => {
  if (process.platform === 'darwin') {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const script = `
      tell application "Terminal"
        do script "cd '${dirPath}'"
        activate
      end tell
    `;
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return { success: true };
  } else if (process.platform === 'win32') {
    const { openTerminalAtPath } = await import('./windowsTerminal.js');
    return await openTerminalAtPath(dirPath);
  }
  return { success: false, error: 'Unsupported platform' };
});
```

---

## Phase 4: UI Adaptations

### 4.1 Update Window Options

**File:** `electron/main.js` (lines 73-85)

```javascript
function createWindow() {
  const windowOptions = {
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
    backgroundColor: '#0a0a0f',
  };

  // macOS-specific options
  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.vibrancy = 'dark';
  }

  // Windows-specific options
  if (process.platform === 'win32') {
    // Option 1: Use default Windows frame
    // (no changes needed)

    // Option 2: Custom frameless window (more work but matches macOS look)
    // windowOptions.frame = false;
    // windowOptions.titleBarStyle = 'hidden';
    // windowOptions.titleBarOverlay = {
    //   color: '#0a0a0f',
    //   symbolColor: '#ffffff',
    //   height: 32
    // };
  }

  mainWindow = new BrowserWindow(windowOptions);
  // ... rest of function
}
```

### 4.2 Update CSS for Windows Title Bar (Optional)

If using `titleBarOverlay`, add to `src/index.css`:

```css
/* Windows title bar overlay spacing */
@media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {
  .app-container {
    padding-top: 32px; /* Height of Windows title bar */
  }
}

/* Or use feature detection in JS and add a class */
.platform-windows .app-container {
  padding-top: 32px;
}
```

---

## Phase 5: Build & Distribution

### 5.1 Update package.json Build Configuration

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"sleep 2 && NODE_ENV=development electron .\"",
    "dev:win": "concurrently \"vite\" \"timeout /t 2 && set NODE_ENV=development && electron .\"",
    "build": "vite build",
    "build:mac": "vite build && electron-builder --mac",
    "build:win": "vite build && electron-builder --win",
    "build:all": "vite build && electron-builder --mac --win"
  },
  "build": {
    "appId": "com.terminalvibe.app",
    "productName": "Terminal Vibe",
    "mac": {
      "category": "public.app-category.developer-tools",
      "icon": "build/icon.icns",
      "target": ["dmg", "zip"]
    },
    "win": {
      "icon": "build/icon.ico",
      "target": [
        {
          "target": "nsis",
          "arch": ["x64", "arm64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "directories": {
      "output": "release"
    }
  }
}
```

### 5.2 Create Windows Icon

You'll need to create `build/icon.ico`. Options:

1. **Convert from PNG**: Use an online converter or ImageMagick:
   ```bash
   magick convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
   ```

2. **Create manually**: Use a tool like GIMP or Figma to export as `.ico` with multiple resolutions.

### 5.3 Code Signing (Optional but Recommended)

For distribution, Windows apps should be code-signed to avoid SmartScreen warnings:

```json
{
  "build": {
    "win": {
      "signingHashAlgorithms": ["sha256"],
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "password"
    }
  }
}
```

---

## Testing Checklist

### Environment Setup
- [ ] Windows 10/11 with Windows Terminal installed
- [ ] Node.js 18+ installed
- [ ] Git installed and in PATH
- [ ] Clone the repository

### Phase 1 Tests
- [ ] `npm install` completes without errors
- [ ] App launches with `npm run dev:win`
- [ ] No permission prompt appears (Windows doesn't need it)

### Phase 2 Tests
- [ ] Running terminals are detected
- [ ] Terminal windows appear in the dashboard
- [ ] Screenshots are captured via `desktopCapturer`

### Phase 3 Tests
- [ ] Clicking a terminal card focuses that terminal window
- [ ] "Open Terminal" button on worktree cards works
- [ ] New terminal opens at correct directory

### Phase 4 Tests
- [ ] Window styling looks appropriate
- [ ] No visual glitches with title bar
- [ ] App minimizes to system tray correctly

### Phase 5 Tests
- [ ] `npm run build:win` produces installer
- [ ] Installer works on clean Windows machine
- [ ] Portable `.exe` runs without installation

---

## Resources & References

### Official Documentation
- [Windows Terminal CLI](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments)
- [Windows Console Ecosystem Roadmap](https://learn.microsoft.com/en-us/windows/console/ecosystem-roadmap)
- [Electron Frameless Windows](https://www.electronjs.org/docs/latest/tutorial/window-customization)
- [Electron desktopCapturer](https://www.electronjs.org/docs/latest/api/desktop-capturer)

### npm Packages
- [win32-api](https://www.npmjs.com/package/win32-api) - Win32 API bindings for Node.js
- [node-pty](https://github.com/microsoft/node-pty) - Pseudo-terminal support (ConPTY on Windows)
- [ps-list](https://github.com/sindresorhus/ps-list) - Get running processes
- [wttab](https://www.npmjs.com/package/wttab) - Windows Terminal tab opener

### Community Resources
- [Windows Terminal GitHub Issues](https://github.com/microsoft/terminal/issues) - Feature requests and known issues
- [electron-builder Windows Guide](https://www.electron.build/configuration/win)
- [Focus-Window PowerShell Module](https://github.com/71/Focus-Window)

### Related Feature Requests
- [Windows Terminal Programmatic API Request](https://github.com/microsoft/terminal/issues/16568)
- [Open Program in New Tab](https://github.com/microsoft/terminal/issues/3977)

---

## Summary

| Phase | Effort | Description |
|-------|--------|-------------|
| 1 | Low | Core infrastructure & platform detection |
| 2 | High | Terminal detection (main challenge) |
| 3 | Medium | Terminal interaction (focus, open) |
| 4 | Low | UI adaptations |
| 5 | Low | Build configuration |

**Key Limitation:** Windows Terminal doesn't expose tabs via API, so the Windows version will show terminal windows rather than individual tabs. Screenshots via `desktopCapturer` will still work, which is the primary feature for monitoring agents.

**Recommended Approach:** Start with Phase 1-2 to get basic detection working, then iterate on the interaction features. The screenshot capture should work out-of-the-box since `desktopCapturer` is cross-platform.

Good luck!
