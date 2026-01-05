import React, { useState } from 'react';

const APP_ICONS = {
  'terminal': '🖥️',
  'iterm': '🔲',
};

function TerminalWithTabs({ windowId, app, tabs, terminalLabels, onLabelChange, onFocusTab }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const icon = APP_ICONS[app.toLowerCase()] || APP_ICONS.terminal;

  // Get custom label for the window or use first tab's title
  const customLabel = terminalLabels?.[windowId];
  const defaultLabel = tabs[0]?.title || app;
  const displayLabel = customLabel || defaultLabel;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayLabel);

  const handleLabelClick = (e) => {
    e.stopPropagation();
    setEditValue(displayLabel);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== defaultLabel) {
      onLabelChange?.(windowId, trimmed);
    } else {
      onLabelChange?.(windowId, null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(displayLabel);
    }
  };

  return (
    <div className={`terminal-tabbed ${isExpanded ? 'expanded' : ''}`}>
      {/* Header */}
      <div className="terminal-tabbed-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="terminal-tabbed-icon">{icon}</div>

        <div className="terminal-tabbed-info">
          {isEditing ? (
            <input
              type="text"
              className="terminal-icon-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <div className="terminal-tabbed-label" onClick={handleLabelClick}>
              {displayLabel}
            </div>
          )}
          <div className="terminal-tabbed-count">{tabs.length} tabs</div>
        </div>

        <div className="terminal-tabbed-chevron">
          {isExpanded ? '▼' : '▶'}
        </div>

        <div className="terminal-tabbed-live">
          <span className="live-dot" />
        </div>
      </div>

      {/* Accordion Content - Tab List */}
      {isExpanded && (
        <div className="terminal-tabbed-content">
          {tabs.map((tab, index) => (
            <div
              key={tab.id}
              className={`terminal-tab-item ${tab.busy ? 'busy' : ''}`}
              onClick={() => onFocusTab?.(tab)}
            >
              <span className="terminal-tab-index">{index + 1}</span>
              <span className="terminal-tab-title">{tab.title || 'Shell'}</span>
              <span className="terminal-tab-process">{tab.process || 'zsh'}</span>
              {tab.busy && <span className="terminal-tab-busy">●</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TerminalWithTabs;
