import React, { useState } from 'react';

const { ipcRenderer } = window.require('electron');

function ContextImporter({ files = [], onChange }) {
  const [loading, setLoading] = useState(false);
  const [expandedFile, setExpandedFile] = useState(null);

  const handleImportFiles = async () => {
    setLoading(true);
    try {
      const result = await ipcRenderer.invoke('import-files', {
        title: 'Import Context Files',
        filters: [
          { name: 'Text Files', extensions: ['md', 'txt', 'json', 'yaml', 'yml'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.success && result.files.length > 0) {
        // Add new files, avoiding duplicates by path
        const existingPaths = new Set(files.map(f => f.path));
        const newFiles = result.files.filter(f => !existingPaths.has(f.path));
        onChange([...files, ...newFiles]);
      }
    } catch (err) {
      console.error('Error importing files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const toggleExpand = (index) => {
    setExpandedFile(expandedFile === index ? null : index);
  };

  const truncateContent = (content, maxLength = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="setup-step-content">
      <label className="setup-label">Context Files</label>
      <p className="setup-hint mb-3">
        Import documentation, architecture specs, or any reference files that provide context about your project.
      </p>

      <button
        className="btn btn-secondary"
        onClick={handleImportFiles}
        disabled={loading}
      >
        {loading ? 'Importing...' : 'Import Files'}
      </button>

      {files.length > 0 && (
        <div className="context-files-list">
          {files.map((file, index) => (
            <div key={file.path || index} className="context-file-item">
              <div className="context-file-header" onClick={() => toggleExpand(index)}>
                <div className="context-file-info">
                  <span className="context-file-icon">
                    {file.name.endsWith('.md') ? '📄' :
                     file.name.endsWith('.json') ? '📋' :
                     file.name.endsWith('.yaml') || file.name.endsWith('.yml') ? '⚙️' :
                     '📝'}
                  </span>
                  <span className="context-file-name">{file.name}</span>
                  <span className="context-file-size">
                    {file.content ? `${(file.content.length / 1024).toFixed(1)}KB` : ''}
                  </span>
                </div>
                <div className="context-file-actions">
                  <button
                    className="context-file-expand"
                    title={expandedFile === index ? 'Collapse' : 'Expand'}
                  >
                    {expandedFile === index ? '▼' : '▶'}
                  </button>
                  <button
                    className="context-file-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {expandedFile === index && file.content && (
                <div className="context-file-preview">
                  <pre>{file.content}</pre>
                </div>
              )}

              {expandedFile !== index && file.content && (
                <div className="context-file-snippet">
                  {truncateContent(file.content)}
                </div>
              )}

              {file.error && (
                <div className="context-file-error">
                  Error: {file.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div className="context-files-empty">
          <p>No files imported yet. Click "Import Files" to add documentation or context.</p>
        </div>
      )}
    </div>
  );
}

export default ContextImporter;
