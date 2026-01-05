import React, { useState, useMemo } from 'react';

function CreateWorktreeModal({
  branches = [],
  existingWorktrees = [],
  onClose,
  onCreate,
  loading
}) {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [newBranchName, setNewBranchName] = useState('');
  const [createNewBranch, setCreateNewBranch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter branches that already have worktrees
  const usedBranches = new Set(existingWorktrees.map(wt => wt.branch));

  // Filter branches based on search
  const filteredBranches = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return branches
      .filter(b => b.toLowerCase().includes(term))
      .filter(b => !usedBranches.has(b));
  }, [branches, searchTerm, usedBranches]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const branch = createNewBranch ? newBranchName : selectedBranch;
    if (branch) {
      onCreate(branch, branch, createNewBranch);
    }
  };

  const isValid = createNewBranch
    ? newBranchName.trim().length > 0
    : selectedBranch.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create Worktree</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Toggle between existing branch and new branch */}
            <div className="worktree-mode-toggle">
              <button
                type="button"
                className={`mode-btn ${!createNewBranch ? 'active' : ''}`}
                onClick={() => setCreateNewBranch(false)}
              >
                Existing Branch
              </button>
              <button
                type="button"
                className={`mode-btn ${createNewBranch ? 'active' : ''}`}
                onClick={() => setCreateNewBranch(true)}
              >
                New Branch
              </button>
            </div>

            {createNewBranch ? (
              <div className="form-group">
                <label className="form-label">New Branch Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="feature/my-new-feature"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  autoFocus
                />
                <p className="form-hint">
                  A new branch will be created from the current HEAD
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Select Branch</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search branches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="branch-list">
                  {filteredBranches.length === 0 ? (
                    <div className="branch-list-empty">
                      {searchTerm ? 'No matching branches found' : 'All branches already have worktrees'}
                    </div>
                  ) : (
                    filteredBranches.map(branch => (
                      <div
                        key={branch}
                        className={`branch-item ${selectedBranch === branch ? 'selected' : ''}`}
                        onClick={() => setSelectedBranch(branch)}
                      >
                        <span className="branch-icon">⎇</span>
                        <span className="branch-name">{branch}</span>
                        {selectedBranch === branch && (
                          <span className="branch-check">✓</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {!createNewBranch && selectedBranch && (
              <div className="worktree-preview">
                <div className="preview-label">Worktree will be created at:</div>
                <code className="preview-path">
                  ../{selectedBranch.replace(/[\/\\]/g, '-')}
                </code>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid || loading}
            >
              {loading ? 'Creating...' : 'Create Worktree'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateWorktreeModal;
