import React from 'react';

function TerminalTitleBar({ title, onClose, onMinimize, onMaximize }) {
  return (
    <div className="terminal-title-bar">
      {/* Traffic light buttons */}
      <div className="traffic-lights">
        <button
          className="traffic-light red"
          onClick={onClose}
          aria-label="Close"
        />
        <button
          className="traffic-light yellow"
          onClick={onMinimize}
          aria-label="Minimize"
        />
        <button
          className="traffic-light green"
          onClick={onMaximize}
          aria-label="Maximize"
        />
      </div>

      {/* Window title */}
      <div className="window-title">
        <span>{title}</span>
      </div>

      {/* Spacer to balance the layout */}
      <div className="traffic-lights" style={{ visibility: 'hidden' }}>
        <div className="traffic-light" />
        <div className="traffic-light" />
        <div className="traffic-light" />
      </div>
    </div>
  );
}

export default TerminalTitleBar;
