import React, { useState } from 'react';
import { NewDashboard } from './components/NewDashboard';
import { EnhancedCollaborativeSession } from './components/EnhancedCollaborativeSession';
import './styles/glassmorphic.css';

function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleSessionCreate = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleReturnToDashboard = () => {
    setCurrentSessionId(null);
  };

  return (
    <div className="App">
      {currentSessionId ? (
        <EnhancedCollaborativeSession 
          sessionId={currentSessionId}
          onReturnToDashboard={handleReturnToDashboard}
        />
      ) : (
        <NewDashboard onSessionCreate={handleSessionCreate} />
      )}
    </div>
  );
}

export default App;
