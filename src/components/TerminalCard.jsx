import React from 'react';
import TerminalTitleBar from './Terminal/TerminalTitleBar';
import TerminalPreview from './Terminal/TerminalPreview';
import TerminalInfo from './Terminal/TerminalInfo';

function TerminalCard({ agent, screenshot, onFocus, onClose }) {
  const { id, task, status, progress, terminalName, index } = agent;

  // Use actual terminal name from window title
  const windowTitle = terminalName || `Terminal ${index || id}`;

  const handleClick = () => {
    if (onFocus) {
      onFocus(agent);
    }
  };

  return (
    <div
      className={`terminal-card terminal-card--${status}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Glowing border effect */}
      <div className="terminal-glow" />

      {/* Window chrome container */}
      <div className="terminal-window">
        {/* macOS-style title bar */}
        <TerminalTitleBar
          title={windowTitle}
          onClose={(e) => {
            e.stopPropagation();
            onClose?.(agent);
          }}
          onMinimize={(e) => e.stopPropagation()}
          onMaximize={(e) => {
            e.stopPropagation();
            onFocus?.(agent);
          }}
        />

        {/* Terminal preview/screenshot area */}
        <TerminalPreview
          screenshot={screenshot}
          terminalName={terminalName || `Terminal ${id}`}
          status={status}
        />

        {/* Task and status info */}
        <TerminalInfo
          task={task}
          status={status}
          progress={progress}
        />
      </div>
    </div>
  );
}

export default TerminalCard;
