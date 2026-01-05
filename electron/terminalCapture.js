import { desktopCapturer, systemPreferences, shell } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Terminal app identifiers - must match at START of window name
const TERMINAL_APPS = [
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
];

// Words that indicate this is NOT a terminal window
const EXCLUDED_PATTERNS = [
  'screenshot',
  'screen recording',
  'preview',
  'finder',
  'desktop',
  'notification',
];

// Cache for thumbnails to reduce CPU usage
const thumbnailCache = new Map();
const CACHE_TTL = 1000; // 1 second cache

// Track terminal content to detect changes (for working vs idle detection)
const terminalContentCache = new Map();
const CONTENT_CHANGE_THRESHOLD = 3; // Consider "working" if content changed in last 3 checks

/**
 * Check if macOS screen recording permission is granted
 */
export function checkScreenCapturePermission() {
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('screen');
    return status === 'granted';
  }
  return true; // Non-macOS platforms don't need this permission
}

/**
 * Open System Preferences to the screen recording section
 */
export function openScreenCapturePreferences() {
  if (process.platform === 'darwin') {
    shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
  }
}

/**
 * Get list of terminal windows - lightweight mode (no thumbnails)
 */
export async function getTerminalWindows(includeThumbnails = false) {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: includeThumbnails ? { width: 400, height: 300 } : { width: 1, height: 1 },
      fetchWindowIcons: true
    });

    // Strict filter for terminal applications
    const terminals = sources.filter(source => {
      const name = source.name.toLowerCase();

      // Exclude non-terminal windows
      if (EXCLUDED_PATTERNS.some(pattern => name.includes(pattern))) {
        return false;
      }

      // Must start with a known terminal app name
      return TERMINAL_APPS.some(app => {
        const appLower = app.toLowerCase();
        return name.startsWith(appLower) || name.includes(` ${appLower}`) || name.includes(`- ${appLower}`);
      });
    });

    return terminals.map(source => ({
      id: source.id,
      name: source.name,
      displayId: source.display_id,
      thumbnail: includeThumbnails && source.thumbnail ? source.thumbnail.toDataURL() : null,
      appIcon: source.appIcon ? source.appIcon.toDataURL() : null
    }));
  } catch (error) {
    console.error('Error getting terminal windows:', error);
    return [];
  }
}

/**
 * Capture a specific terminal window's thumbnail
 */
export async function captureTerminalThumbnail(sourceId, size = { width: 800, height: 600 }) {
  // Check cache first
  const cacheKey = `${sourceId}-${size.width}x${size.height}`;
  const cached = thumbnailCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: size,
      fetchWindowIcons: false
    });

    const source = sources.find(s => s.id === sourceId);
    if (!source) {
      return null;
    }

    const data = source.thumbnail ? source.thumbnail.toDataURL() : null;

    // Cache the result
    thumbnailCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    console.error('Error capturing terminal thumbnail:', error);
    return null;
  }
}

/**
 * Get all available windows (not just terminals) for debugging
 */
export async function getAllWindows() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window'],
      thumbnailSize: { width: 100, height: 100 },
      fetchWindowIcons: true
    });

    return sources.map(source => ({
      id: source.id,
      name: source.name
    }));
  } catch (error) {
    console.error('Error getting windows:', error);
    return [];
  }
}

/**
 * Clear the thumbnail cache
 */
export function clearCache() {
  thumbnailCache.clear();
}

/**
 * Get tabs from Terminal.app using AppleScript
 */
export async function getTerminalTabs() {
  if (process.platform !== 'darwin') return [];

  try {
    // First check if Terminal is running
    const { stdout: runningCheck } = await execAsync(
      `osascript -e 'application "Terminal" is running'`
    ).catch(() => ({ stdout: 'false' }));

    if (runningCheck.trim() !== 'true') {
      return [];
    }

    // AppleScript to get all Terminal windows and their tabs
    // Use %%% as entry delimiter and ||| as field delimiter
    // Also grab the last line of content to detect input prompts
    const script = `
      tell application "Terminal"
        set output to ""
        repeat with w in windows
          set windowId to id of w
          repeat with t in tabs of w
            set tabTitle to custom title of t
            if tabTitle is "" then set tabTitle to name of w
            set tabTTY to tty of t
            set tabBusy to busy of t
            set tabProcs to processes of t
            set lastProc to ""
            if (count of tabProcs) > 0 then
              set lastProc to item -1 of tabProcs
            end if
            -- Get last 200 chars of history to check for prompts (reduced for performance)
            set tabContent to ""
            try
              set fullContent to history of t
              set contentLen to count of characters of fullContent
              if contentLen > 200 then
                set tabContent to text (contentLen - 199) thru contentLen of fullContent
              else
                set tabContent to fullContent
              end if
            end try
            if output is not "" then
              set output to output & "%%%"
            end if
            set output to output & windowId & "|||" & tabTitle & "|||" & tabTTY & "|||" & tabBusy & "|||" & lastProc & "|||" & tabContent
          end repeat
        end repeat
        return output
      end tell
    `;

    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);

    if (!stdout.trim()) return [];

    // Simple patterns for questions that need user response (red state)
    const QUESTION_PATTERNS = [
      /\?\s*$/m,                         // Line ends with ?
      /\(y\/n\)/i,                       // (y/n)
      /\[y\/n\]/i,                       // [y/n]
      /do you want to/i,                 // Do you want to...
      /would you like to/i,              // Would you like to...
      /are you sure/i,                   // Are you sure?
      /^\s*❯\s*\d+\./m,                  // ❯ 1. (selection cursor on numbered option)
    ];

    // Check if content has a question needing response
    function hasQuestion(content) {
      if (!content) return false;
      const lastPart = content.slice(-200);
      return QUESTION_PATTERNS.some(pattern => pattern.test(lastPart));
    }

    // Determine if terminal is actively working
    // Primary signal: content changes. Secondary: busy flag for grace period only
    function isTerminalWorking(tty, content, process, isBusy, title) {
      if (!content || !tty) return false;

      const contentHash = content.slice(-100); // Use last 100 chars as signature
      const cached = terminalContentCache.get(tty);
      const now = Date.now();

      if (!cached) {
        terminalContentCache.set(tty, { hash: contentHash, lastChange: now, changeCount: 0 });
        return false; // First check - don't assume working
      }

      if (cached.hash !== contentHash) {
        // Content changed - definitely working
        terminalContentCache.set(tty, { hash: contentHash, lastChange: now, changeCount: cached.changeCount + 1 });
        return true;
      } else {
        // Content stable - only consider working if recently changed
        const timeSinceChange = now - cached.lastChange;

        // Check if this looks like an AI process (for slightly longer grace period)
        const searchText = `${process || ''} ${title || ''}`;
        const isAIProcess = /claude|aider|copilot|cursor|gpt/i.test(searchText);

        // Grace period: 2s for AI tools, 1s for others
        // After grace period, terminal is idle regardless of busy flag
        const graceMs = isAIProcess ? 2000 : 1000;

        if (timeSinceChange > graceMs) {
          cached.changeCount = 0;
          return false; // Stable too long = idle
        }

        return cached.changeCount > 0;
      }
    }

    // Parse the output - split by %%% for entries, ||| for fields
    const tabs = stdout.trim().split('%%%').map((item, index) => {
      const parts = item.split('|||');
      const [windowId, title, tty, busy, process, content] = parts;
      const ttyClean = tty?.trim();
      const processClean = process?.trim();
      const isBusy = busy?.trim() === 'true';

      // Detection priority:
      // 1. Is terminal working? (busy flag + content changes) → working (orange)
      // 2. Is there a question prompt? → needs-attention (red)
      // 3. Otherwise → idle (blue)
      const titleClean = title?.trim();
      const contentChanging = isTerminalWorking(ttyClean, content, processClean, isBusy, titleClean);
      const hasQuestionPrompt = hasQuestion(content);

      return {
        id: `terminal-tab-${ttyClean || index}`,
        windowId: windowId?.trim(),
        title: titleClean || 'Terminal',
        tty: ttyClean,
        busy: isBusy,
        process: processClean || 'zsh',
        contentChanging,      // True if terminal is actively working
        hasQuestion: hasQuestionPrompt,  // True if there's a question prompt
        app: 'Terminal'
      };
    }).filter(tab => tab.windowId && tab.tty);

    return tabs;
  } catch (error) {
    // Terminal.app might not be running
    console.log('Could not get Terminal tabs:', error.message);
    return [];
  }
}

/**
 * Get tabs from iTerm2 using AppleScript
 */
export async function getITermTabs() {
  if (process.platform !== 'darwin') return [];

  try {
    // First check if iTerm is running
    const { stdout: runningCheck } = await execAsync(
      `osascript -e 'application "iTerm2" is running'`
    ).catch(() => ({ stdout: 'false' }));

    if (runningCheck.trim() !== 'true') {
      return [];
    }

    // Use %%% as entry delimiter and ||| as field delimiter
    const script = `
      tell application "iTerm2"
        set output to ""
        repeat with w in windows
          set windowId to id of w
          repeat with t in tabs of w
            repeat with s in sessions of t
              set sessionName to name of s
              set sessionTTY to tty of s
              if output is not "" then
                set output to output & "%%%"
              end if
              set output to output & windowId & "|||" & sessionName & "|||" & sessionTTY
            end repeat
          end repeat
        end repeat
        return output
      end tell
    `;

    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);

    if (!stdout.trim()) return [];

    const tabs = stdout.trim().split('%%%').map((item, index) => {
      const parts = item.split('|||');
      const [windowId, title, tty] = parts;
      return {
        id: `iterm-tab-${tty?.trim() || index}`,
        windowId: windowId?.trim(),
        title: title?.trim() || 'iTerm',
        tty: tty?.trim(),
        busy: false, // iTerm doesn't expose this easily
        app: 'iTerm'
      };
    }).filter(tab => tab.windowId && tab.tty);

    return tabs;
  } catch (error) {
    console.log('Could not get iTerm tabs:', error.message);
    return [];
  }
}

/**
 * Get all terminal tabs from all supported apps
 */
export async function getAllTerminalTabs() {
  const [terminalTabs, itermTabs] = await Promise.all([
    getTerminalTabs(),
    getITermTabs()
  ]);

  return [...terminalTabs, ...itermTabs];
}
