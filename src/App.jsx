import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import PermissionPrompt from './components/Permissions/PermissionPrompt';
import SetupWizard from './components/Setup/SetupWizard';
import { useAudioNotifications } from './hooks/useAudioNotifications';

const { ipcRenderer } = window.require('electron');

// Simple status detection based on content changes and questions
function detectTerminalStatus(tab) {
  const { contentChanging, hasQuestion } = tab;

  // Priority 1: If content is actively changing, terminal is working
  if (contentChanging) {
    return 'working'; // Orange pulsing - actively generating output
  }

  // Priority 2: If there's a question prompt, needs attention
  if (hasQuestion) {
    return 'needs-attention'; // Red pulsing - waiting for user response
  }

  // Priority 3: Content stable, no question = idle
  return 'idle'; // Solid blue - waiting for new command
}

// Transform terminal tabs into display format (each tab = one terminal)
function tabsToAgents(tabs, savedAgents = []) {
  return tabs.map((tab, index) => {
    // Create stable ID from app + windowId + tab index
    const stableId = `${tab.app}-${tab.windowId}-${tab.tty || index}`;
    const saved = savedAgents.find(a => a.terminalSourceId === stableId);

    // Detect status from process info
    const status = detectTerminalStatus(tab);

    return {
      id: stableId,
      terminalName: tab.title || `${tab.app} - Tab ${index + 1}`,
      task: saved?.task || tab.title,
      status,
      process: tab.process,
      contentChanging: tab.contentChanging,
      hasQuestion: tab.hasQuestion,
      progress: 100,
      terminalSourceId: stableId,
      app: tab.app,
      windowId: tab.windowId,
      tty: tab.tty,
      tabIndex: index,
      index: index + 1,
    };
  });
}

// Default project config structure
const DEFAULT_CONFIG = {
  projectName: '',
  repositoryPath: '',
  architectureDiagramUrl: '',
  mermaidDefinition: '',
  contextFiles: [],
  agents: [],
  worktrees: [],
  terminalLabels: {}, // Custom labels keyed by terminal ID
  terminalOrder: [], // Custom order of terminal IDs
  audioEnabled: true,
};

function App() {
  // Core state
  const [projectConfig, setProjectConfig] = useState(DEFAULT_CONFIG);
  const [terminals, setTerminals] = useState([]);
  const [terminalTabs, setTerminalTabs] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Permission state
  const [permissionStatus, setPermissionStatus] = useState(null); // null = checking, true = granted, false = denied
  const [skipPermission, setSkipPermission] = useState(false);

  // Transform terminal tabs into agents (each tab = one terminal icon)
  const displayAgents = useMemo(() => {
    return tabsToAgents(terminalTabs, projectConfig.agents);
  }, [terminalTabs, projectConfig.agents]);

  // Sort agents by custom order, otherwise maintain stable order by ID
  const orderedAgents = useMemo(() => {
    const order = projectConfig.terminalOrder || [];

    // Always sort by ID first for stability, then apply custom order
    const sorted = [...displayAgents].sort((a, b) => {
      // If we have custom order, use it
      if (order.length > 0) {
        const aIndex = order.indexOf(a.id);
        const bIndex = order.indexOf(b.id);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
      }
      // Fall back to stable sort by ID
      return a.id.localeCompare(b.id);
    });

    return sorted;
  }, [displayAgents, projectConfig.terminalOrder]);

  // Audio notifications hook
  useAudioNotifications(displayAgents, projectConfig.audioEnabled);

  // Check screen recording permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const hasPermission = await ipcRenderer.invoke('check-screen-permission');
        setPermissionStatus(hasPermission);
      } catch (error) {
        console.error('Error checking permission:', error);
        setPermissionStatus(false);
      }
    };
    checkPermission();
  }, []);

  // Load project config on mount
  useEffect(() => {
    loadProjectConfig();
  }, []);

  // Show setup wizard if no project is configured
  useEffect(() => {
    if (configLoaded && !projectConfig.projectName) {
      setShowSetupWizard(true);
    }
  }, [configLoaded, projectConfig.projectName]);

  // Discover terminals and tabs (lightweight - no screenshots)
  useEffect(() => {
    if (permissionStatus !== true && !skipPermission) return;

    const discoverTerminals = async () => {
      try {
        const [foundTerminals, foundTabs] = await Promise.all([
          ipcRenderer.invoke('get-terminal-windows'),
          ipcRenderer.invoke('get-terminal-tabs').catch(() => [])
        ]);
        setTerminals(foundTerminals);
        setTerminalTabs(foundTabs);
      } catch (error) {
        console.error('Error discovering terminals:', error);
      }
    };

    // Initial discovery
    discoverTerminals();

    // Poll every 2 seconds to reduce CPU load
    const interval = setInterval(discoverTerminals, 2000);
    return () => clearInterval(interval);
  }, [permissionStatus, skipPermission]);

  const loadProjectConfig = async () => {
    try {
      const config = await ipcRenderer.invoke('get-project-config');
      setProjectConfig({ ...DEFAULT_CONFIG, ...config });
      setConfigLoaded(true);
    } catch (error) {
      console.error('Error loading config:', error);
      setConfigLoaded(true);
    }
  };

  const saveProjectConfig = useCallback(async (config) => {
    try {
      const mergedConfig = { ...DEFAULT_CONFIG, ...config };
      await ipcRenderer.invoke('save-project-config', mergedConfig);
      setProjectConfig(mergedConfig);
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }, []);

  const handleSetupComplete = useCallback(async (setupConfig) => {
    // Merge setup config with existing config
    const newConfig = {
      ...projectConfig,
      projectName: setupConfig.projectName,
      repositoryPath: setupConfig.repositoryPath,
      contextFiles: setupConfig.contextFiles || [],
      mermaidDefinition: setupConfig.mermaidDefinition || '',
    };

    await saveProjectConfig(newConfig);
    setShowSetupWizard(false);
  }, [projectConfig, saveProjectConfig]);

  const handleSkipSetup = useCallback(() => {
    setShowSetupWizard(false);
  }, []);

  const handleWorktreesChange = useCallback((worktrees) => {
    const newConfig = { ...projectConfig, worktrees };
    saveProjectConfig(newConfig);
  }, [projectConfig, saveProjectConfig]);

  const handleAssignTerminalToWorktree = useCallback((worktreeId, terminalSourceId) => {
    const updatedWorktrees = projectConfig.worktrees.map(wt => {
      if (wt.id === worktreeId) {
        return { ...wt, terminalSourceId };
      }
      // Remove terminal from other worktrees
      if (terminalSourceId && wt.terminalSourceId === terminalSourceId) {
        return { ...wt, terminalSourceId: null };
      }
      return wt;
    });
    handleWorktreesChange(updatedWorktrees);
  }, [projectConfig.worktrees, handleWorktreesChange]);

  const assignAgentToTerminal = useCallback((terminalPid, agentId, task) => {
    const updatedAgents = [...projectConfig.agents];
    const existingAgent = updatedAgents.find(a => a.id === agentId);

    if (existingAgent) {
      existingAgent.terminalPid = terminalPid;
      existingAgent.task = task;
    } else {
      updatedAgents.push({
        id: agentId,
        terminalPid,
        task,
        status: 'idle',
        progress: 0
      });
    }

    saveProjectConfig({ ...projectConfig, agents: updatedAgents });
  }, [projectConfig, saveProjectConfig]);

  const handleFocusTerminal = useCallback(async (agent) => {
    // Pass app, windowId, and tty for precise tab focusing
    await ipcRenderer.invoke('focus-terminal-tab', {
      app: agent.app,
      windowId: agent.windowId,
      tty: agent.tty,
      terminalName: agent.terminalName,
    });
  }, []);

  const handleTerminalLabelChange = useCallback((terminalId, label) => {
    const newLabels = { ...projectConfig.terminalLabels };
    if (label) {
      newLabels[terminalId] = label;
    } else {
      delete newLabels[terminalId];
    }
    saveProjectConfig({ ...projectConfig, terminalLabels: newLabels });
  }, [projectConfig, saveProjectConfig]);

  const handleTerminalOrderChange = useCallback((newOrder) => {
    saveProjectConfig({ ...projectConfig, terminalOrder: newOrder });
  }, [projectConfig, saveProjectConfig]);

  const handleRequestPermission = useCallback(async () => {
    await ipcRenderer.invoke('open-screen-preferences');
  }, []);

  const handleSkipPermission = useCallback(() => {
    setSkipPermission(true);
  }, []);

  const handleOpenSetup = useCallback(() => {
    setShowSetupWizard(true);
  }, []);

  // Show permission prompt if needed
  if (permissionStatus === false && !skipPermission) {
    return (
      <PermissionPrompt
        onRequestPermission={handleRequestPermission}
        onSkip={handleSkipPermission}
      />
    );
  }

  // Show loading state while checking permission
  if (permissionStatus === null || !configLoaded) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🎵</div>
          <div className="text-gray-400">Loading Terminal Vibe...</div>
        </div>
      </div>
    );
  }

  // Show setup wizard
  if (showSetupWizard) {
    return (
      <SetupWizard
        initialConfig={projectConfig}
        onComplete={handleSetupComplete}
        onSkip={handleSkipSetup}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cyber-dark text-white">
      {showSettings ? (
        <Settings
          config={projectConfig}
          terminals={terminals}
          onSave={saveProjectConfig}
          onClose={() => setShowSettings(false)}
          onOpenSetup={handleOpenSetup}
          onWorktreesChange={handleWorktreesChange}
          onAssignTerminal={handleAssignTerminalToWorktree}
        />
      ) : (
        <Dashboard
          projectConfig={projectConfig}
          agents={orderedAgents}
          terminalLabels={projectConfig.terminalLabels}
          onOpenSettings={() => setShowSettings(true)}
          onFocusTerminal={handleFocusTerminal}
          onLabelChange={handleTerminalLabelChange}
          onOrderChange={handleTerminalOrderChange}
        />
      )}
    </div>
  );
}

export default App;
