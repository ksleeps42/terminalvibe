#!/bin/bash

# Terminal Vibe - Automated Setup Script
# Run this in your terminal-vibe directory

echo "🎵 Setting up Terminal Vibe..."

# Create directory structure
mkdir -p electron
mkdir -p src/components

# Create package.json
cat > package.json << 'EOF'
{
  "name": "terminal-vibe",
  "version": "0.1.0",
  "description": "Vibe check your development workflow - Monitor multiple terminal agents with style",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"vite\" \"electron .\"",
    "build": "vite build",
    "build:mac": "vite build && electron-builder --mac",
    "preview": "vite preview"
  },
  "keywords": ["terminal", "monitoring", "development", "agents", "workflow"],
  "author": "Kyle Sleeper <krsleeper@gmail.com>",
  "license": "MIT",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "electron-store": "^8.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "concurrently": "^8.2.2",
    "electron": "^28.1.0",
    "electron-builder": "^24.9.1",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.10"
  },
  "build": {
    "appId": "com.terminelvibe.app",
    "productName": "Terminal Vibe",
    "mac": {
      "category": "public.app-category.developer-tools",
      "icon": "build/icon.icns",
      "target": ["dmg", "zip"]
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "directories": {
      "output": "release"
    }
  }
}
EOF

# Create index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Terminal Vibe</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# Create vite.config.js
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
})
EOF

# Create tailwind.config.js
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Create postcss.config.js
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create electron/main.js
cat > electron/main.js << 'EOF'
const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;
let tray;

// Create menu bar app
function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png')); // We'll add icon later
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show Dashboard', 
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      }
    },
    { 
      label: 'Active Agents: 0', 
      enabled: false 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Terminal Vibe');
  tray.setContextMenu(contextMenu);
  
  // Click tray icon to show window
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    } else {
      createWindow();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
    backgroundColor: '#1a1a1a',
  });

  // Load Vite dev server in development, built files in production
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    // Don't quit, just hide window
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

app.whenReady().then(() => {
  createTray();
  createWindow();
});

app.on('window-all-closed', () => {
  // Keep app running in menu bar
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

// IPC handlers for terminal monitoring
ipcMain.handle('get-terminals', async () => {
  // TODO: Implement terminal detection
  return [];
});

ipcMain.handle('get-project-config', async () => {
  return store.get('projectConfig', {
    projectName: '',
    agents: []
  });
});

ipcMain.handle('save-project-config', async (event, config) => {
  store.set('projectConfig', config);
  return true;
});

ipcMain.handle('focus-terminal', async (event, pid) => {
  // TODO: Implement terminal focus via AppleScript
  console.log('Focus terminal:', pid);
  return true;
});
EOF

# Create src/main.jsx
cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# Create src/index.css
cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
EOF

# Create src/App.jsx
cat > src/App.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';

const { ipcRenderer } = window.require('electron');

function App() {
  const [projectConfig, setProjectConfig] = useState({
    projectName: '',
    architectureDiagramUrl: '',
    agents: []
  });
  const [terminals, setTerminals] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadProjectConfig();
    discoverTerminals();
    
    // Poll for terminal updates every 2 seconds
    const interval = setInterval(discoverTerminals, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadProjectConfig = async () => {
    const config = await ipcRenderer.invoke('get-project-config');
    setProjectConfig(config);
  };

  const saveProjectConfig = async (config) => {
    await ipcRenderer.invoke('save-project-config', config);
    setProjectConfig(config);
  };

  const discoverTerminals = async () => {
    const foundTerminals = await ipcRenderer.invoke('get-terminals');
    setTerminals(foundTerminals);
  };

  const assignAgentToTerminal = (terminalPid, agentId, task) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {showSettings ? (
        <Settings 
          config={projectConfig}
          onSave={saveProjectConfig}
          onClose={() => setShowSettings(false)}
        />
      ) : (
        <Dashboard 
          projectConfig={projectConfig}
          terminals={terminals}
          onAssignAgent={assignAgentToTerminal}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
    </div>
  );
}

export default App;
EOF

# Create src/components/Dashboard.jsx
cat > src/components/Dashboard.jsx << 'EOF'
import React from 'react';
import TerminalCard from './TerminalCard';

function Dashboard({ projectConfig, terminals, onAssignAgent, onOpenSettings }) {
  const activeAgents = projectConfig.agents.filter(a => a.status !== 'idle').length;
  const totalTerminals = terminals.length;

  // Mock data for demo purposes
  const mockAgents = [
    { id: '1', task: 'building database webhook', status: 'working', progress: 67 },
    { id: '2', task: 'building feature 4', status: 'working', progress: 80 },
    { id: '3', task: 'building feature 4', status: 'working', progress: 24 },
    { id: '4', task: 'building paywall integration', status: 'working', progress: 32 },
    { id: '5', task: 'no task assigned', status: 'idle', progress: 0 },
    { id: '6', task: 'building paywall integration', status: 'needs-attention', progress: 95 },
    { id: '7', task: 'building feature 4', status: 'working', progress: 34 },
    { id: '8', task: 'updated landing page', status: 'ready', progress: 100 },
    { id: '9', task: 'building feature 4', status: 'working', progress: 34 },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Terminal Vibe</h1>
          <div className="space-y-1 text-gray-300">
            <p>Active Project: <span className="text-white font-semibold">{projectConfig.projectName || 'PROJECT NAME'}</span></p>
            <p>Active Terminals: <span className="text-white font-semibold">{totalTerminals}</span></p>
            <p>Active Agents: <span className="text-white font-semibold">{activeAgents || mockAgents.filter(a => a.status !== 'idle').length}</span></p>
          </div>
          
          <div className="mt-6 space-y-1">
            <h3 className="text-lg font-semibold mb-2">Context Monitoring</h3>
            {mockAgents.map((agent, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-400 w-8">{i + 1}:</span>
                <span className="text-white">{agent.progress}%</span>
                {agent.status === 'needs-attention' && <span className="text-red-400">Needs Attention</span>}
                {agent.status === 'ready' && <span className="text-green-400">Ready to deploy</span>}
                {agent.status === 'idle' && <span className="text-gray-500">Idle</span>}
              </div>
            ))}
          </div>

          {projectConfig.architectureDiagramUrl && (
            <div className="mt-4">
              <p className="text-gray-400">Architecture Link: 
                <a href={projectConfig.architectureDiagramUrl} className="text-blue-400 ml-2 underline">
                  link to mermaid diagram
                </a>
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Terminal Grid */}
      <div className="grid grid-cols-3 gap-6">
        {mockAgents.map((agent) => (
          <TerminalCard
            key={agent.id}
            agent={agent}
            onAssign={(task) => onAssignAgent(agent.id, agent.id, task)}
          />
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
EOF

# Create src/components/TerminalCard.jsx
cat > src/components/TerminalCard.jsx << 'EOF'
import React from 'react';

function TerminalCard({ agent, onAssign }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'border-green-500 bg-green-500/10';
      case 'working': return 'border-orange-500 bg-orange-500/10';
      case 'needs-attention': return 'border-red-500 bg-red-500/10';
      case 'idle': return 'border-gray-600 bg-gray-800/50';
      default: return 'border-gray-600 bg-gray-800/50';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ready': return 'Ready to deploy';
      case 'working': return 'Actively working';
      case 'needs-attention': return 'Needs attention';
      case 'idle': return 'Idle';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`relative rounded-lg border-2 overflow-hidden transition-all hover:scale-105 cursor-pointer ${getStatusColor(agent.status)}`}>
      {/* Terminal Preview Area */}
      <div className="aspect-video bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-2">🎵</div>
          <div className="text-sm text-gray-400 font-mono">
            Terminal {agent.id}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 bg-gray-900/50">
        <div className="mb-2">
          <div className="text-sm text-gray-400 mb-1">Agent task:</div>
          <div className="font-semibold">{agent.task}</div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-gray-400">Status: </span>
            <span className={
              agent.status === 'ready' ? 'text-green-400' :
              agent.status === 'working' ? 'text-orange-400' :
              agent.status === 'needs-attention' ? 'text-red-400' :
              'text-gray-400'
            }>
              {getStatusLabel(agent.status)}
            </span>
          </div>
          
          {agent.status === 'working' && (
            <div className="text-sm text-gray-400">
              {agent.progress}%
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {agent.status === 'working' && (
          <div className="mt-3 w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default TerminalCard;
EOF

# Create src/components/Settings.jsx
cat > src/components/Settings.jsx << 'EOF'
import React, { useState } from 'react';

function Settings({ config, onSave, onClose }) {
  const [projectName, setProjectName] = useState(config.projectName || '');
  const [diagramUrl, setDiagramUrl] = useState(config.architectureDiagramUrl || '');

  const handleSave = () => {
    onSave({
      ...config,
      projectName,
      architectureDiagramUrl: diagramUrl
    });
    onClose();
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-2xl"
        >
          ✕
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="This Is My App"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Architecture Diagram URL (optional)
          </label>
          <input
            type="url"
            value={diagramUrl}
            onChange={(e) => setDiagramUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <p className="text-sm text-gray-400 mt-1">
            Link to your Mermaid diagram or architecture docs
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-800">
        <h2 className="text-xl font-semibold mb-4">About Terminal Vibe</h2>
        <p className="text-gray-400">
          Version 0.1.0 - Monitor multiple terminal agents with style
        </p>
        <p className="text-gray-400 mt-2">
          Built with ❤️ for developers who vibe with parallel workflows
        </p>
      </div>
    </div>
  );
}

export default Settings;
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules
dist
release
.DS_Store
*.log
EOF

echo "✅ All files created!"
echo ""
echo "Next steps:"
echo "1. npm install"
echo "2. npm run dev"
echo ""
echo "🎵 Terminal Vibe is ready to rock!"
