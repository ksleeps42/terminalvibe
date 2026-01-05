import React, { useState, useRef, useEffect } from 'react';

// Terminal app icons (emoji-based for simplicity)
const APP_ICONS = {
  'terminal': '🖥️',
  'iterm': '🔲',
  'warp': '⚡',
  'hyper': '💠',
  'alacritty': '🅰️',
  'kitty': '🐱',
  'wezterm': '🌐',
  'tabby': '📑',
  'rio': '🌊',
};

function getAppIcon(terminalName) {
  if (!terminalName) return APP_ICONS.terminal;
  const name = terminalName.toLowerCase();

  for (const [app, icon] of Object.entries(APP_ICONS)) {
    if (name.includes(app)) return icon;
  }
  return APP_ICONS.terminal;
}

// Use terminal window name directly as the default label
export function getDefaultLabel(terminalName) {
  if (!terminalName) return 'Terminal';
  return terminalName;
}

function TerminalIcon({
  agent,
  onFocus,
  onLabelChange,
  customLabel,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) {
  const { terminalName, index, id } = agent;
  const icon = getAppIcon(terminalName);
  const defaultLabel = getDefaultLabel(terminalName);
  const displayLabel = customLabel || defaultLabel;

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayLabel);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleFocusClick = (e) => {
    e.stopPropagation();
    if (onFocus) {
      onFocus(agent);
    }
  };

  const handleLabelClick = (e) => {
    e.stopPropagation();
    if (!isEditing) {
      setEditValue(displayLabel);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== defaultLabel && onLabelChange) {
      onLabelChange(id, trimmed);
    } else if (!trimmed || trimmed === defaultLabel) {
      // Clear custom label to use default
      onLabelChange?.(id, null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(displayLabel);
    }
  };

  // Get status from agent for glow color
  const status = agent.status || 'idle';

  const classNames = [
    'terminal-icon',
    `terminal-icon--${status}`,
    isDragging && 'dragging',
    isDragOver && 'drag-over',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      draggable={!isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Outer glow effect */}
      <div className="terminal-icon-glow" />

      {/* Clickable icon area - focuses terminal */}
      <div
        className="terminal-icon-emoji"
        onClick={handleFocusClick}
        role="button"
        tabIndex={0}
        title="Click to focus terminal"
      >
        {icon}
      </div>

      {/* Number badge */}
      <div className="terminal-icon-badge">
        {index}
      </div>

      {/* Editable Label - click to edit */}
      <div className="terminal-icon-info">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="terminal-icon-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div
            className="terminal-icon-name"
            onClick={handleLabelClick}
            title="Click to edit label"
          >
            {displayLabel}
          </div>
        )}
      </div>

      {/* Focus button */}
      <div
        className="terminal-icon-focus"
        onClick={handleFocusClick}
        role="button"
        tabIndex={0}
        title="Focus this terminal"
      >
        ↗
      </div>
    </div>
  );
}

export default TerminalIcon;
