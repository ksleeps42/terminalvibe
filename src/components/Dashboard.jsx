import React, { useState, useCallback } from 'react';
import TerminalIcon from './TerminalIcon';
import Sidebar from './Sidebar/Sidebar';

function Dashboard({
  projectConfig,
  agents,
  terminalLabels,
  onOpenSettings,
  onFocusTerminal,
  onLabelChange,
  onOrderChange,
}) {
  const [gridColumns, setGridColumns] = useState(4);
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const handleTerminalClick = (agent) => {
    if (onFocusTerminal) {
      onFocusTerminal(agent);
    }
  };

  // Drag and drop handlers
  const handleDragStart = useCallback((e, agentId) => {
    setDraggedId(agentId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', agentId);
  }, []);

  const handleDragOver = useCallback((e, agentId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (agentId !== draggedId) {
      setDragOverId(agentId);
    }
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDragOverId(null);
  }, []);

  const handleDrop = useCallback((e, targetId) => {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    // Create new order
    const currentOrder = agents.map(a => a.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    // Remove dragged item and insert at target position
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    onOrderChange?.(newOrder);
    setDraggedId(null);
  }, [draggedId, agents, onOrderChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const hasContent = agents.length > 0;

  return (
    <div className="dashboard">
      {/* Window Drag Region */}
      <div className="window-drag-region" />

      {/* Sidebar */}
      <Sidebar
        projectConfig={projectConfig}
        agents={agents}
        terminalLabels={terminalLabels}
        onAgentClick={handleTerminalClick}
        onLabelChange={onLabelChange}
        onOpenSettings={onOpenSettings}
      />

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Grid Controls */}
        <div className="grid-controls">
          <span className="grid-controls-label">Grid:</span>
          {[3, 4, 5, 6].map((cols) => (
            <button
              key={cols}
              className={`grid-control-btn ${gridColumns === cols ? 'active' : ''}`}
              onClick={() => setGridColumns(cols)}
            >
              {cols}
            </button>
          ))}
        </div>

        {hasContent ? (
          <>
            {/* Terminal Windows - Icon Grid */}
            {agents.length > 0 && (
              <div
                className="terminal-grid"
                style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
              >
                {agents.map((agent) => (
                  <TerminalIcon
                    key={agent.id}
                    agent={agent}
                    customLabel={terminalLabels?.[agent.id]}
                    onFocus={handleTerminalClick}
                    onLabelChange={onLabelChange}
                    isDragging={draggedId === agent.id}
                    isDragOver={dragOverId === agent.id}
                    onDragStart={(e) => handleDragStart(e, agent.id)}
                    onDragOver={(e) => handleDragOver(e, agent.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, agent.id)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🖥️</div>
            <div className="empty-state-title">No terminals detected</div>
            <div className="empty-state-text">
              Open a terminal app (Terminal, iTerm, Warp, etc.) to see it here
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
