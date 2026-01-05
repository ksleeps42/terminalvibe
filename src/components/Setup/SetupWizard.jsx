import React, { useState } from 'react';
import RepositoryPicker from './RepositoryPicker';
import ContextImporter from './ContextImporter';

const { ipcRenderer } = window.require('electron');

const STEPS = [
  { id: 'name', title: 'Project Name', description: 'Give your project a name' },
  { id: 'repository', title: 'Repository', description: 'Select your git repository' },
  { id: 'context', title: 'Import Context', description: 'Import documentation and context files (optional)' },
  { id: 'architecture', title: 'Architecture', description: 'Define your system architecture (optional)' },
];

function SetupWizard({ initialConfig = {}, onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState({
    projectName: initialConfig.projectName || '',
    repositoryPath: initialConfig.repositoryPath || '',
    repositoryInfo: null,
    contextFiles: initialConfig.contextFiles || [],
    mermaidDefinition: initialConfig.mermaidDefinition || '',
    ...initialConfig,
  });

  const updateConfig = (updates) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case 'name':
        return config.projectName.trim().length > 0;
      case 'repository':
        return config.repositoryPath.length > 0;
      case 'context':
      case 'architecture':
        return true; // Optional steps
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete setup
      onComplete(config);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'name':
        return (
          <div className="setup-step-content">
            <label className="setup-label">Project Name</label>
            <input
              type="text"
              className="setup-input"
              placeholder="My Awesome Project"
              value={config.projectName}
              onChange={(e) => updateConfig({ projectName: e.target.value })}
              autoFocus
            />
            <p className="setup-hint">
              This name will be displayed in the dashboard header and sidebar.
            </p>
          </div>
        );

      case 'repository':
        return (
          <RepositoryPicker
            repositoryPath={config.repositoryPath}
            repositoryInfo={config.repositoryInfo}
            onSelect={(path, info) => updateConfig({
              repositoryPath: path,
              repositoryInfo: info
            })}
          />
        );

      case 'context':
        return (
          <ContextImporter
            files={config.contextFiles}
            onChange={(files) => updateConfig({ contextFiles: files })}
          />
        );

      case 'architecture':
        return (
          <div className="setup-step-content">
            <label className="setup-label">Architecture Diagram (Mermaid)</label>
            <p className="setup-hint mb-3">
              Define your system architecture using Mermaid syntax. This will be displayed in the sidebar.
            </p>
            <div className="setup-architecture-actions">
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  const result = await ipcRenderer.invoke('import-files', {
                    title: 'Import Mermaid Diagram',
                    filters: [
                      { name: 'Mermaid', extensions: ['mmd', 'mermaid', 'md'] },
                      { name: 'All Files', extensions: ['*'] }
                    ]
                  });
                  if (result.success && result.files.length > 0) {
                    updateConfig({ mermaidDefinition: result.files[0].content });
                  }
                }}
              >
                Import .mmd File
              </button>
            </div>
            <textarea
              className="setup-textarea"
              placeholder={`graph TD
  A[Frontend] --> B[API Gateway]
  B --> C[Auth Service]
  B --> D[Data Service]
  C --> E[(Database)]
  D --> E`}
              value={config.mermaidDefinition}
              onChange={(e) => updateConfig({ mermaidDefinition: e.target.value })}
              rows={12}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="setup-wizard">
      <div className="setup-wizard-container">
        {/* Header */}
        <div className="setup-header">
          <h1 className="setup-title">Setup Terminal Vibe</h1>
          <p className="setup-subtitle">Configure your project to get started</p>
        </div>

        {/* Progress */}
        <div className="setup-progress">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`setup-progress-step ${
                index < currentStep ? 'completed' : ''
              } ${index === currentStep ? 'active' : ''}`}
            >
              <div className="setup-progress-dot">
                {index < currentStep ? '✓' : index + 1}
              </div>
              <span className="setup-progress-label">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="setup-content">
          <h2 className="setup-step-title">{STEPS[currentStep].title}</h2>
          <p className="setup-step-description">{STEPS[currentStep].description}</p>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="setup-navigation">
          <div className="setup-nav-left">
            {onSkip && currentStep === 0 && (
              <button className="btn btn-ghost" onClick={onSkip}>
                Skip Setup
              </button>
            )}
            {currentStep > 0 && (
              <button className="btn btn-secondary" onClick={handleBack}>
                ← Back
              </button>
            )}
          </div>
          <div className="setup-nav-right">
            {(STEPS[currentStep].id === 'context' || STEPS[currentStep].id === 'architecture') && (
              <button className="btn btn-ghost" onClick={handleNext}>
                Skip
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === STEPS.length - 1 ? 'Finish Setup' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SetupWizard;
