# Terminal Vibe Roadmap

## Current Status: v0.3.0 (MVP Complete)

---

## Completed Features

### Core Functionality
- [x] Electron app with menu bar tray
- [x] React + Vite + Tailwind frontend
- [x] Persistent configuration (electron-store)
- [x] Frameless window with custom drag region

### Terminal Monitoring
- [x] Real terminal screenshot capture (desktopCapturer)
- [x] macOS screen recording permission handling
- [x] Terminal window detection (Terminal, iTerm2, Warp, Hyper, etc.)
- [x] 5-second polling for live updates
- [x] Mock agents for demo mode

### UI/UX
- [x] Cyberpunk dark theme with gradients
- [x] macOS-style terminal cards with traffic lights
- [x] Status-based glowing borders (green/orange/red/gray)
- [x] Pulse animations for attention states
- [x] Configurable grid layout (2-5 columns)
- [x] Responsive design

### Audio Notifications
- [x] Web Audio API synthesizer
- [x] Ready tone (C-E-G major arpeggio)
- [x] Attention tone (singing bowl harmonics)
- [x] Enable/disable toggle with test buttons

### Project Management
- [x] Setup wizard (4-step onboarding)
- [x] Git repository selection and validation
- [x] Context file import (MD, JSON, YAML)
- [x] Mermaid architecture diagram support

### Git Worktree Management
- [x] List existing worktrees
- [x] Create worktrees from branches
- [x] Create worktrees with new branches
- [x] Remove worktrees
- [x] Prune stale worktrees
- [x] Terminal-to-worktree assignment

### Settings
- [x] Tabbed interface
- [x] Project configuration
- [x] Worktree manager integration
- [x] Audio settings
- [x] About page

---

## Next Up: v0.4.0

### High Priority

#### Agent Status Tracking
- [ ] Parse terminal output for status indicators
- [ ] Detect "DONE", "ERROR", "WAITING" patterns
- [ ] Auto-update agent status based on terminal content
- [ ] Custom regex patterns per agent

#### Worktree Integration
- [ ] Auto-detect which worktree a terminal is in (by cwd)
- [ ] Show worktree branch badge on terminal cards
- [ ] Quick-switch: click worktree to focus its terminal
- [ ] Worktree status indicators in sidebar

#### Agent Configuration UI
- [ ] Create/edit agents in Settings
- [ ] Assign tasks to agents
- [ ] Set agent colors/icons
- [ ] Agent grouping by project area

### Medium Priority

#### Keyboard Shortcuts
- [ ] `Cmd+1-9` to focus terminal by index
- [ ] `Cmd+N` to create new worktree
- [ ] `Cmd+,` to open settings
- [ ] `Cmd+R` to refresh terminals
- [ ] Global hotkey to show/hide window

#### Notifications
- [ ] macOS native notifications for status changes
- [ ] Notification center integration
- [ ] Notification preferences (which statuses trigger)

#### Multi-Project Support
- [ ] Project switcher
- [ ] Recent projects list
- [ ] Project templates

---

## Future: v0.5.0+

### Advanced Features

#### AI Integration
- [ ] Claude API integration for agent task parsing
- [ ] Auto-summarize terminal output
- [ ] Suggest next steps based on context
- [ ] Natural language commands

#### Collaboration
- [ ] Share project configuration
- [ ] Export/import worktree setups
- [ ] Team templates

#### Analytics
- [ ] Time tracking per worktree
- [ ] Agent productivity metrics
- [ ] Session history and logs

#### Cross-Platform
- [ ] Windows support
- [ ] Linux support
- [ ] Consistent terminal detection across platforms

### Polish

#### UI Enhancements
- [ ] Drag-and-drop terminal reordering
- [ ] Terminal card resizing
- [ ] Custom themes (light mode?)
- [ ] Terminal output preview on hover

#### Performance
- [ ] Lazy loading for large grids
- [ ] Screenshot caching improvements
- [ ] Background process optimization

---

## Technical Debt

### Should Address Soon
- [ ] Add TypeScript for type safety
- [ ] Unit tests for git operations
- [ ] E2E tests with Playwright
- [ ] Error boundaries in React
- [ ] Better error messages in UI

### Nice to Have
- [ ] Storybook for component documentation
- [ ] ESLint + Prettier config
- [ ] CI/CD pipeline
- [ ] Auto-update mechanism
- [ ] Crash reporting

---

## Ideas Backlog

- Terminal output recording/replay
- Integration with GitHub/GitLab for PR status
- Pomodoro timer integration
- Voice commands
- Touch Bar support (Mac)
- Stream deck integration
- REST API for external automation
- Plugin system for custom integrations

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| v0.1.0 | 2026-01-04 | Initial assembly, basic Electron app |
| v0.2.0 | 2026-01-04 | Terminal capture, audio, Mermaid, cyberpunk UI |
| v0.3.0 | 2026-01-04 | Git worktrees, setup wizard, enhanced settings |
| v0.3.1 | 2026-01-04 | Real terminal data, removed mock agents, live screenshots |

---

## Contributing

To work on the roadmap:
1. Pick an unchecked item
2. Create a worktree for the feature branch
3. Implement and test
4. PR with demo/screenshots
