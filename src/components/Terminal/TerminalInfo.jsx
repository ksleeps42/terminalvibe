import React from 'react';

function TerminalInfo({ task, status }) {
  // Extract a clean display name from the task/terminal name
  const displayTask = task || 'Terminal';

  return (
    <div className="terminal-info">
      {/* Terminal/task description */}
      <div className="terminal-info-task" title={displayTask}>
        {displayTask}
      </div>

      {/* Status indicator */}
      <div className="terminal-info-status">
        <div className={`status-badge status-badge--${status}`}>
          <span className={`status-dot status-dot--${status}`} />
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}

export default TerminalInfo;
