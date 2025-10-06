import './basic.css';
import './webpage/style.css';
import './content-script';

import React, { useEffect, useState } from 'react';

import { LeadGenManager } from './webpage/leadgen';
import { WorkspaceManager } from './webpage/app';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize managers
        const workspaceManager = new WorkspaceManager();
        workspaceManager.init();

        console.log('App initialized successfully');
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    // Load HTML content from webpage
    fetch('./src/webpage/index.html')
      .then(response => response.text())
      .then(html => {
        // Insert HTML into DOM
        document.body.innerHTML = html;
        // Initialize app after HTML is loaded
        initApp();
      })
      .catch(error => {
        console.error('Failed to load HTML:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Loading Candidate Finder Workspace...</h2>
        <div style={{ margin: '20px 0' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return null; // HTML is loaded into DOM directly
};

export default App;
