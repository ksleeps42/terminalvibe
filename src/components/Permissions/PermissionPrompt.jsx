import React from 'react';

function PermissionPrompt({ onRequestPermission, onSkip }) {
  return (
    <div className="permission-overlay">
      <div className="permission-card">
        {/* Icon */}
        <div className="permission-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="permission-title">
          Screen Recording Permission
        </h2>

        {/* Description */}
        <p className="permission-description">
          Terminal Vibe needs screen recording access to capture live previews
          of your terminal windows. This allows you to see real-time screenshots
          of your active terminals in the dashboard.
        </p>

        {/* Instructions */}
        <div className="text-left bg-cyber-purple/50 rounded-lg p-4 mb-6 text-sm">
          <p className="text-gray-300 font-medium mb-2">To enable:</p>
          <ol className="list-decimal list-inside text-gray-400 space-y-1">
            <li>Click "Open System Preferences" below</li>
            <li>Find "Terminal Vibe" in the list</li>
            <li>Check the box to grant permission</li>
            <li>Restart Terminal Vibe</li>
          </ol>
        </div>

        {/* Primary Button */}
        <button
          onClick={onRequestPermission}
          className="permission-button"
        >
          Open System Preferences
        </button>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="permission-skip"
        >
          Continue without screenshots
        </button>

        {/* Note */}
        <p className="text-xs text-gray-600 mt-4">
          You can enable this later in macOS System Preferences →
          Security & Privacy → Privacy → Screen Recording
        </p>
      </div>
    </div>
  );
}

export default PermissionPrompt;
