import React, { useState, useEffect, useCallback } from 'react';
import CreateWorktreeModal from './CreateWorktreeModal';
import WorktreeCard from './WorktreeCard';

const { ipcRenderer } = window.require('electron');

function WorktreeManager({
  repositoryPath,
  worktrees = [],
  terminals = [],
  onWorktreesChange,
  onAssignTerminal
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load branches when repository path changes
  useEffect(() => {
    if (repositoryPath) {
      loadBranches();
    }
  }, [repositoryPath]);

  const loadBranches = async () => {
    try {
      const result = await ipcRenderer.invoke('list-branches', repositoryPath);
      if (result.success) {
        setBranches(result.data.all);
      }
    } catch (err) {
      console.error('Error loading branches:', err);
    }
  };

  const refreshWorktrees = useCallback(async () => {
    if (!repositoryPath) return;
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('list-worktrees', repositoryPath);
      if (result.success) {
        // Merge with existing worktree metadata (assignments, etc.)
        const updatedWorktrees = result.data.map(wt => {
          const existing = worktrees.find(w => w.path === wt.path);
          return {
            ...wt,
            id: existing?.id || `wt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            agentId: existing?.agentId || null,
            terminalSourceId: existing?.terminalSourceId || null,
          };
        });
        onWorktreesChange(updatedWorktrees);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [repositoryPath, worktrees, onWorktreesChange]);

  const handleCreateWorktree = async (branch, name, createNewBranch) => {
    setLoading(true);
    setError(null);
    try {
      const result = await ipcRenderer.invoke(
        'create-worktree',
        repositoryPath,
        branch,
        null, // Let backend generate path
        createNewBranch
      );

      if (result.success) {
        await refreshWorktrees();
        setShowCreateModal(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWorktree = async (worktreePath, force = false) => {
    if (!confirm('Are you sure you want to remove this worktree? The files will be deleted.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await ipcRenderer.invoke('remove-worktree', repositoryPath, worktreePath, force);
      if (result.success) {
        await refreshWorktrees();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrune = async () => {
    setLoading(true);
    try {
      await ipcRenderer.invoke('prune-worktrees', repositoryPath);
      await refreshWorktrees();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter out main worktree for display
  const displayWorktrees = worktrees.filter(wt => !wt.isMain);

  if (!repositoryPath) {
    return (
      <div className="worktree-manager-empty">
        <p>No repository configured. Set up a repository in Settings to manage worktrees.</p>
      </div>
    );
  }

  return (
    <div className="worktree-manager">
      <div className="worktree-manager-header">
        <h3 className="worktree-manager-title">Git Worktrees</h3>
        <div className="worktree-manager-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handlePrune}
            disabled={loading}
            title="Clean up stale worktree references"
          >
            Prune
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
          >
            + Create Worktree
          </button>
        </div>
      </div>

      {error && (
        <div className="worktree-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {displayWorktrees.length === 0 ? (
        <div className="worktree-empty">
          <p>No worktrees yet. Create one to enable parallel development on different branches.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Worktree
          </button>
        </div>
      ) : (
        <div className="worktree-grid">
          {displayWorktrees.map((worktree) => (
            <WorktreeCard
              key={worktree.path}
              worktree={worktree}
              terminals={terminals}
              onRemove={() => handleRemoveWorktree(worktree.path)}
              onAssignTerminal={(terminalId) => onAssignTerminal(worktree.id, terminalId)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateWorktreeModal
          branches={branches}
          existingWorktrees={worktrees}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorktree}
          loading={loading}
        />
      )}
    </div>
  );
}

export default WorktreeManager;
