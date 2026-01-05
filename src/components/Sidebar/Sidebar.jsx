import React from 'react';
import MermaidDiagram from './MermaidDiagram';
import ContextMonitor from './ContextMonitor';

function Sidebar({
  projectConfig,
  agents,
  terminalLabels,
  onAgentClick,
  onLabelChange,
  onOpenSettings,
}) {
  const {
    projectName,
    architectureDiagramUrl,
    mermaidDefinition,
  } = projectConfig;

  // Calculate stats from real terminals
  const totalTerminals = agents.length;
  const activeTerminals = agents.filter(a => a.status === 'working').length;
  const attentionNeeded = agents.filter(a => a.status === 'needs-attention').length;

  // Extract active task names for diagram highlighting
  const activeNodes = agents
    .filter(a => a.status === 'working' || a.status === 'needs-attention')
    .map(a => {
      // Extract keywords from task for node matching
      const words = a.task.toLowerCase().split(' ');
      return words.filter(w => w.length > 3);
    })
    .flat();

  return (
    <aside className="sidebar w-80 flex-shrink-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="dashboard-title text-2xl">Terminal Vibe</h1>
      </div>

      {/* Project Stats */}
      <div className="sidebar-section">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Active Project:</span>
            <span className="font-semibold text-white">
              {projectName || 'Unnamed Project'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Detected Terminals:</span>
            <span className="font-semibold text-cyan-400">{totalTerminals}</span>
          </div>
          {activeTerminals > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Active:</span>
              <span className="font-semibold text-green-400">{activeTerminals}</span>
            </div>
          )}
          {attentionNeeded > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">Need Attention:</span>
              <span className="font-semibold text-red-400">{attentionNeeded}</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Monitoring */}
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Terminal Sessions</h3>
        <ContextMonitor
          agents={agents}
          terminalLabels={terminalLabels}
          onAgentClick={onAgentClick}
          onLabelChange={onLabelChange}
        />
      </div>

      {/* Architecture Diagram */}
      {mermaidDefinition && (
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Architecture</h3>
          <MermaidDiagram
            definition={mermaidDefinition}
            activeNodes={activeNodes}
          />
        </div>
      )}

      {/* Architecture Link (if URL provided but no Mermaid) */}
      {architectureDiagramUrl && !mermaidDefinition && (
        <div className="sidebar-section">
          <h3 className="sidebar-section-title">Architecture</h3>
          <a
            href={architectureDiagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyber-accent hover:text-cyan-300 text-sm underline"
          >
            View architecture diagram →
          </a>
        </div>
      )}

      {/* Settings Button */}
      <div className="mt-auto pt-6">
        <button
          onClick={onOpenSettings}
          className="btn btn-secondary w-full flex items-center justify-center gap-2"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
