import React, { useState } from 'react';
import { audioSynth } from '../utils/audioSynth';
import WorktreeManager from './Worktree/WorktreeManager';

const DEFAULT_MERMAID = `graph TD
    A[Frontend] --> B[API Server]
    B --> C[Database]
    B --> D[Cache]
    A --> E[CDN]`;

function Settings({
  config,
  terminals = [],
  onSave,
  onClose,
  onOpenSetup,
  onWorktreesChange,
  onAssignTerminal
}) {
  const [projectName, setProjectName] = useState(config.projectName || '');
  const [diagramUrl, setDiagramUrl] = useState(config.architectureDiagramUrl || '');
  const [mermaidDefinition, setMermaidDefinition] = useState(config.mermaidDefinition || '');
  const [audioEnabled, setAudioEnabled] = useState(config.audioEnabled !== false);
  const [activeTab, setActiveTab] = useState('project');

  const handleSave = () => {
    onSave({
      ...config,
      projectName,
      architectureDiagramUrl: diagramUrl,
      mermaidDefinition,
      audioEnabled,
    });
    onClose();
  };

  const handleTestAudio = () => {
    audioSynth.setEnabled(true);
    audioSynth.playReadyTone();
  };

  const handleTestAttention = () => {
    audioSynth.setEnabled(true);
    audioSynth.playAttentionTone();
  };

  return (
    <div className="min-h-screen bg-cyber-dark">
      {/* Header */}
      <div className="settings-header">
        <h1 className="text-2xl font-bold text-gradient">Settings</h1>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'project' ? 'active' : ''}`}
          onClick={() => setActiveTab('project')}
        >
          Project
        </button>
        <button
          className={`settings-tab ${activeTab === 'worktrees' ? 'active' : ''}`}
          onClick={() => setActiveTab('worktrees')}
        >
          Worktrees
        </button>
        <button
          className={`settings-tab ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          Audio
        </button>
        <button
          className={`settings-tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      {/* Tab Content */}
      <div className="settings-content">
        {/* Project Tab */}
        {activeTab === 'project' && (
          <div className="settings-panel">
            <div className="space-y-6">
              {/* Repository Info */}
              {config.repositoryPath && (
                <div className="glass rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Repository
                      </label>
                      <p className="font-mono text-sm text-gray-400">
                        {config.repositoryPath}
                      </p>
                    </div>
                    <button
                      onClick={onOpenSetup}
                      className="btn btn-secondary btn-sm"
                    >
                      Reconfigure
                    </button>
                  </div>
                </div>
              )}

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                />
              </div>

              {/* Architecture Diagram URL */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Architecture Diagram URL (optional)
                </label>
                <input
                  type="url"
                  value={diagramUrl}
                  onChange={(e) => setDiagramUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  External link to your architecture docs
                </p>
              </div>

              {/* Mermaid Definition */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Architecture Diagram (Mermaid)
                </label>
                <textarea
                  value={mermaidDefinition}
                  onChange={(e) => setMermaidDefinition(e.target.value)}
                  placeholder={DEFAULT_MERMAID}
                  rows={8}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter Mermaid diagram syntax. The diagram will appear in the sidebar.
                  <a
                    href="https://mermaid.js.org/syntax/flowchart.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyber-accent ml-1 hover:underline"
                  >
                    Mermaid docs →
                  </a>
                </p>
              </div>

              {/* Context Files */}
              {config.contextFiles && config.contextFiles.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Imported Context Files
                  </label>
                  <div className="glass rounded-lg p-3">
                    {config.contextFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 py-1">
                        <span className="text-sm text-gray-400">📄</span>
                        <span className="text-sm text-gray-300">{file.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  className="btn btn-primary w-full py-3 text-lg"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Worktrees Tab */}
        {activeTab === 'worktrees' && (
          <div className="settings-panel-wide">
            <WorktreeManager
              repositoryPath={config.repositoryPath}
              worktrees={config.worktrees || []}
              terminals={terminals}
              onWorktreesChange={onWorktreesChange}
              onAssignTerminal={onAssignTerminal}
            />
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === 'audio' && (
          <div className="settings-panel">
            <div className="glass rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <label className="block text-lg font-medium text-gray-200">
                    Audio Notifications
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    Play sounds when agent status changes
                  </p>
                </div>
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    audioEnabled ? 'bg-green-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      audioEnabled ? 'left-8' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {audioEnabled && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Test the notification sounds:
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleTestAudio}
                      className="btn btn-secondary flex-1"
                    >
                      🎵 Ready Sound
                    </button>
                    <button
                      onClick={handleTestAttention}
                      className="btn btn-secondary flex-1"
                    >
                      🔔 Attention Sound
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                className="btn btn-primary w-full py-3 text-lg"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="settings-panel">
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎵</div>
              <h2 className="text-2xl font-bold text-gradient mb-2">Terminal Vibe</h2>
              <p className="text-gray-400 mb-4">
                Version 0.3.0
              </p>
              <p className="text-gray-500 max-w-md mx-auto">
                Monitor multiple terminal agents with style. Built for developers who vibe with parallel workflows.
              </p>
            </div>

            <div className="glass rounded-lg p-4 mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Features</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Real-time terminal screenshots</li>
                <li>✓ Git worktree management</li>
                <li>✓ Mermaid architecture diagrams</li>
                <li>✓ Audio notifications</li>
                <li>✓ Project context import</li>
              </ul>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-600">
                Electron + React + Vite + Tailwind
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
