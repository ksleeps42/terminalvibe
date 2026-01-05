import React, { useState, useRef, useEffect } from 'react';
import { getDefaultLabel } from '../TerminalIcon';

const STATUS_COLORS = {
  'ready': 'text-green-400',
  'working': 'text-cyan-400',
  'needs-attention': 'text-red-400',
  'idle': 'text-gray-500',
};

function ContextMonitorItem({ agent, index, terminalLabels, onAgentClick, onLabelChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const customLabel = terminalLabels?.[agent.id];
  const defaultLabel = getDefaultLabel(agent.terminalName);
  const displayLabel = customLabel || defaultLabel;
  const [editValue, setEditValue] = useState(displayLabel);
  const inputRef = useRef(null);
  const statusColor = STATUS_COLORS[agent.status] || 'text-gray-400';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleLabelClick = (e) => {
    e.stopPropagation();
    setEditValue(displayLabel);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== defaultLabel) {
      onLabelChange?.(agent.id, trimmed);
    } else {
      onLabelChange?.(agent.id, null);
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

  const handleFocusClick = (e) => {
    if (!isEditing) {
      onAgentClick?.(agent);
    }
  };

  return (
    <div
      className="context-item cursor-pointer"
      onClick={handleFocusClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => !isEditing && e.key === 'Enter' && onAgentClick?.(agent)}
      title={`Click to focus: ${agent.terminalName}`}
    >
      {/* Terminal number */}
      <span className="context-item-number">
        {index + 1}:
      </span>

      {/* Editable label */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="context-item-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className={`context-item-name ${statusColor}`}
          onClick={handleLabelClick}
          title="Click to edit name"
        >
          {displayLabel}
        </span>
      )}

      {/* Active indicator */}
      <span className={`context-item-dot ${statusColor}`}>
        <span className="dot-pulse" />
      </span>
    </div>
  );
}

function ContextMonitor({ agents, terminalLabels, onAgentClick, onLabelChange }) {
  if (agents.length === 0) {
    return (
      <div className="context-list">
        <div className="context-item-empty">
          No terminals detected
        </div>
      </div>
    );
  }

  return (
    <div className="context-list">
      {agents.map((agent, index) => (
        <ContextMonitorItem
          key={agent.id}
          agent={agent}
          index={index}
          terminalLabels={terminalLabels}
          onAgentClick={onAgentClick}
          onLabelChange={onLabelChange}
        />
      ))}
    </div>
  );
}

export default ContextMonitor;
