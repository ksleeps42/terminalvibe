# Terminal Vibe

**A lightweight ambient monitor for your AI coding sessions.**

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)

---

## What is Terminal Vibe?

Terminal Vibe is a sleek desktop companion that gives you **at-a-glance visibility** into all your terminal sessions. Perfect for developers running multiple Claude Code instances, Aider sessions, or any AI-assisted coding workflows across different worktrees.

Instead of constantly switching between terminals to check status, Terminal Vibe shows you:

- **Blue glow** — Terminal is idle, waiting for your next command
- **Orange pulse** — AI is actively working (coding, thinking, generating)
- **Red pulse** — Terminal needs your attention (question, prompt, or error)

## Why Terminal Vibe?

When you're orchestrating multiple AI agents across different git worktrees, context-switching kills productivity. Terminal Vibe sits quietly in the corner and lets you know exactly when each terminal needs you—and when it doesn't.

**Stay in flow. Let the vibes tell you when to switch.**

## Features

- **Zero-config detection** — Automatically discovers all Terminal.app and iTerm2 sessions
- **Real-time status** — Content-based detection updates every 2 seconds
- **Ambient audio cues** — Optional singing bowl notification when a terminal needs attention
- **Drag-to-reorder** — Arrange terminals in the order that makes sense for your workflow
- **Lightweight** — Minimal CPU footprint, runs silently in the background
- **Click-to-focus** — Jump straight to any terminal with a single click

## Quick Start

```bash
# Clone the repo
git clone https://github.com/ksleeps42/terminalvibewindows.git
cd terminalvibewindows

# Install dependencies
npm install

# Run in development mode
npm run dev
```

On first launch, macOS will ask for Screen Recording permission—this is required to detect terminal windows.

## How It Works

Terminal Vibe uses AppleScript to query Terminal.app and iTerm2 for:
- Tab titles and TTY identifiers
- Running processes
- Recent terminal output (last 200 chars)
- Busy state flags

It then analyzes this data to determine if the terminal is actively outputting (working), waiting for input (needs attention), or idle.

## Tech Stack

- **Electron** — Cross-platform desktop app
- **React** — UI components
- **Vite** — Fast development builds
- **TailwindCSS** — Styling
- **Web Audio API** — Ambient sound notifications

## Configuration

Terminal Vibe stores its config in `~/.terminal-vibe/config.json`. You can customize:
- Project name and repository path
- Audio notifications on/off
- Custom terminal labels
- Terminal display order

## Requirements

- macOS (uses AppleScript for terminal detection)
- Node.js 18+
- Terminal.app or iTerm2

## License

MIT

---

*Built for developers who run multiple AI coding agents and want to stay in the zone.*
