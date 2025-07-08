import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { CollaborativeSession } from './components/CollaborativeSession';

type AppState = 'dashboard' | 'session';

function App() {
  const [currentView, setCurrentView] = useState<AppState>('dashboard');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const handleSessionStart = (sessionId: string) => {
    console.log('Starting session:', sessionId);
    setActiveSessionId(sessionId);
    setCurrentView('session');
  };

  const handleReturnToDashboard = () => {
    console.log('Returning to dashboard');
    setActiveSessionId(null);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      {/* Add a subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />
      
      <div className="relative z-10">
        {currentView === 'dashboard' ? (
          <Dashboard onSessionStart={handleSessionStart} />
        ) : (
          <CollaborativeSession 
            sessionId={activeSessionId!}
            onReturnToDashboard={handleReturnToDashboard}
          />
        )}
      </div>
    </div>
  );
}

export default App;