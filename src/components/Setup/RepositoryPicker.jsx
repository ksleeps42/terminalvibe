import React, { useState, useEffect } from 'react';

const { ipcRenderer } = window.require('electron');

function RepositoryPicker({ repositoryPath, repositoryInfo, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingWorktrees, setExistingWorktrees] = useState([]);

  useEffect(() => {
    if (repositoryPath) {
      loadWorktrees();
    }
  }, [repositoryPath]);

  const loadWorktrees = async () => {
    if (!repositoryPath) return;
    try {
      const result = await ipcRenderer.invoke('list-worktrees', repositoryPath);
      if (result.success) {
        setExistingWorktrees(result.data);
      }
    } catch (err) {
      console.error('Error loading worktrees:', err);
    }
  };

  const handleSelectRepository = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await ipcRenderer.invoke('select-repository');

      if (result.canceled) {
        setLoading(false);
        return;
      }

      if (!result.success) {
        setError(result.error || 'Failed to select repository');
        setLoading(false);
        return;
      }

      onSelect(result.data.path, result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-step-content">
      <label className="setup-label">Git Repository</label>

      <div className="repo-picker">
        <button
          className="btn btn-secondary repo-picker-btn"
          onClick={handleSelectRepository}
          disabled={loading}
        >
          {loading ? 'Selecting...' : 'Choose Folder'}
        </button>

        {repositoryPath && (
          <div className="repo-picker-path">
            <span className="repo-path">{repositoryPath}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="setup-error">
          {error}
        </div>
      )}

      {repositoryInfo && (
        <div className="repo-info">
          <div className="repo-info-item">
            <span className="repo-info-label">Repository:</span>
            <span className="repo-info-value">{repositoryInfo.name}</span>
          </div>
          <div className="repo-info-item">
            <span className="repo-info-label">Current Branch:</span>
            <span className="repo-info-value repo-branch">{repositoryInfo.currentBranch}</span>
          </div>
          {repositoryInfo.remoteUrl && (
            <div className="repo-info-item">
              <span className="repo-info-label">Remote:</span>
              <span className="repo-info-value repo-remote">{repositoryInfo.remoteUrl}</span>
            </div>
          )}
        </div>
      )}

      {existingWorktrees.length > 1 && (
        <div className="repo-worktrees">
          <h4 className="repo-worktrees-title">Existing Worktrees ({existingWorktrees.length})</h4>
          <ul className="repo-worktrees-list">
            {existingWorktrees.map((wt, index) => (
              <li key={index} className="repo-worktree-item">
                <span className="repo-worktree-branch">{wt.branch || 'detached'}</span>
                <span className="repo-worktree-path">{wt.path}</span>
                {wt.isMain && <span className="repo-worktree-badge">main</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="setup-hint">
        Select the root directory of your git repository. Terminal Vibe will use this to manage worktrees for parallel development.
      </p>
    </div>
  );
}

export default RepositoryPicker;
