import { useState } from 'react';
import { NewDashboard } from './components/NewDashboard';
import { EnhancedCollaborativeSession } from './components/EnhancedCollaborativeSession';
import { ImmersiveCollaborativeSession } from './components/ImmersiveCollaborativeSession';
import './styles/glassmorphic.css';
import './styles/immersive.css';

type SessionMode = 'enhanced' | 'immersive';

function App() {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<SessionMode>('enhanced');

  const handleSessionCreate = (sessionId: string, mode: SessionMode = 'enhanced') => {
    setCurrentSessionId(sessionId);
    setSessionMode(mode);
  };

  const handleReturnToDashboard = () => {
    setCurrentSessionId(null);
    setSessionMode('enhanced');
  };

  return (
    <div className="App">
      {currentSessionId ? (
        sessionMode === 'immersive' ? (
          <ImmersiveCollaborativeSession 
            sessionId={currentSessionId}
            onReturnToDashboard={handleReturnToDashboard}
          />
        ) : (
          <EnhancedCollaborativeSession 
            sessionId={currentSessionId}
            onReturnToDashboard={handleReturnToDashboard}
          />
        )
      ) : (
        <NewDashboard 
          onSessionCreate={handleSessionCreate} 
        />
      )}
    </div>
  );
}

export default App;
