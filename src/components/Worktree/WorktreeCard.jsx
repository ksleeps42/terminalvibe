import React, { useState } from 'react';

const { ipcRenderer } = window.require('electron');

function WorktreeCard({ worktree, terminals = [], onRemove, onAssignTerminal }) {
  const [showTerminalDropdown, setShowTerminalDropdown] = useState(false);

  const assignedTerminal = terminals.find(t => t.id === worktree.terminalSourceId);

  const handleOpenInTerminal = async () => {
    // Open a new terminal at the worktree path
    // For macOS, we can use AppleScript or open command
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
  };

  const handleCopyPath = () => {
    navigator.clipboard.writeText(worktree.path);
  };

  return (
    <div className={`worktree-card ${worktree.prunable ? 'prunable' : ''}`}>
      <div className="worktree-card-header">
        <div className="worktree-branch-badge">
          <span className="branch-icon">⎇</span>
          {worktree.branch || 'detached'}
        </div>
        <div className="worktree-card-actions">
          <button
            className="worktree-action-btn"
            onClick={handleCopyPath}
            title="Copy path"
          >
            📋
          </button>
          <button
            className="worktree-action-btn"
            onClick={onRemove}
            title="Remove worktree"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="worktree-card-body">
        <div className="worktree-name">{worktree.name}</div>
        <div className="worktree-path" title={worktree.path}>
          {worktree.path}
        </div>

        {worktree.prunable && (
          <div className="worktree-warning">
            ⚠️ Stale - directory may be missing
          </div>
        )}

        {worktree.locked && (
          <div className="worktree-badge locked">🔒 Locked</div>
        )}
      </div>

      <div className="worktree-card-footer">
        {/* Terminal Assignment */}
        <div className="worktree-terminal-section">
          {assignedTerminal ? (
            <div className="assigned-terminal">
              <span className="terminal-label">Terminal:</span>
              <span className="terminal-name">{assignedTerminal.name}</span>
              <button
                className="unassign-btn"
                onClick={() => onAssignTerminal(null)}
                title="Unassign terminal"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="terminal-dropdown-container">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowTerminalDropdown(!showTerminalDropdown)}
              >
                Assign Terminal ▾
              </button>
              {showTerminalDropdown && (
                <div className="terminal-dropdown">
                  {terminals.length === 0 ? (
                    <div className="terminal-dropdown-empty">
                      No terminals detected
                    </div>
                  ) : (
                    terminals.map(terminal => (
                      <div
                        key={terminal.id}
                        className="terminal-dropdown-item"
                        onClick={() => {
                          onAssignTerminal(terminal.id);
                          setShowTerminalDropdown(false);
                        }}
                      >
                        {terminal.thumbnail && (
                          <img
                            src={terminal.thumbnail}
                            alt=""
                            className="terminal-thumbnail"
                          />
                        )}
                        <span className="terminal-item-name">{terminal.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="btn btn-ghost btn-sm"
          onClick={handleOpenInTerminal}
          title="Open in Terminal"
        >
          Open Terminal
        </button>
      </div>
    </div>
  );
}

export default WorktreeCard;
