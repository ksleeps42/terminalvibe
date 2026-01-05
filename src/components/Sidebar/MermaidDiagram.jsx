import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#1a1a2e',
    primaryBorderColor: '#00f0ff',
    primaryTextColor: '#ffffff',
    lineColor: '#6b7280',
    secondaryColor: '#2d2d44',
    tertiaryColor: '#0a0a0f',
    background: '#0a0a0f',
    mainBkg: '#1a1a2e',
    nodeBorder: '#3b82f6',
    clusterBkg: '#1a1a2e',
    titleColor: '#ffffff',
    edgeLabelBackground: '#1a1a2e',
  },
  flowchart: {
    curve: 'basis',
    padding: 15,
  },
  securityLevel: 'loose',
});

function MermaidDiagram({ definition, activeNodes = [] }) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!definition || !containerRef.current) {
      setRendered(false);
      return;
    }

    const renderDiagram = async () => {
      try {
        setError(null);
        containerRef.current.innerHTML = '';

        // Generate unique ID for this render
        const id = `mermaid-${Date.now()}`;

        // Render the diagram
        const { svg } = await mermaid.render(id, definition);
        containerRef.current.innerHTML = svg;

        // Highlight active nodes after rendering
        setTimeout(() => {
          activeNodes.forEach(nodeId => {
            // Try various selectors to find the node
            const selectors = [
              `[id*="${nodeId}"]`,
              `[id*="${nodeId.toLowerCase()}"]`,
              `.node[id*="${nodeId}"]`,
            ];

            selectors.forEach(selector => {
              const nodes = containerRef.current.querySelectorAll(selector);
              nodes.forEach(node => {
                node.classList.add('mermaid-node-active');
              });
            });
          });
        }, 100);

        setRendered(true);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(err.message || 'Failed to render diagram');
        setRendered(false);
      }
    };

    renderDiagram();
  }, [definition, activeNodes]);

  if (!definition) {
    return (
      <div className="mermaid-container">
        <div className="text-center text-gray-500 py-8">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm">No diagram defined</div>
          <div className="text-xs mt-1 text-gray-600">
            Add a Mermaid definition in Settings
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mermaid-container">
        <div className="text-red-400 text-sm p-4">
          <div className="font-semibold mb-2">Diagram Error</div>
          <div className="text-xs text-red-300 font-mono bg-red-900/20 p-2 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mermaid-container">
      <div
        ref={containerRef}
        className={`mermaid-diagram transition-opacity duration-300 ${
          rendered ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default MermaidDiagram;
