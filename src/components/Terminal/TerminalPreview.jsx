import React from 'react';

function TerminalPreview({ screenshot, terminalName, status }) {
  // Generate mock terminal content for placeholder
  const mockLines = [
    '$ npm run build',
    'Building for production...',
    'Compiling TypeScript...',
    'Bundling assets...',
    status === 'ready' ? '✓ Build complete!' : '...',
  ];

  if (screenshot) {
    return (
      <div className="terminal-preview">
        <img
          src={screenshot}
          alt={`Terminal: ${terminalName}`}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className="terminal-preview">
      <div className="terminal-preview-placeholder">
        <div className="w-full h-full p-3 font-mono text-xs leading-relaxed">
          {mockLines.map((line, i) => (
            <div
              key={i}
              className={`
                ${line.startsWith('$') ? 'text-green-400' : ''}
                ${line.startsWith('✓') ? 'text-green-400' : ''}
                ${line === '...' ? 'animate-pulse' : ''}
              `}
              style={{ opacity: 0.4 + (i * 0.15) }}
            >
              {line}
            </div>
          ))}
          {status === 'working' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-block w-2 h-4 bg-green-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TerminalPreview;
