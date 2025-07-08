import React from 'react';

export function DebugPanel({ sessionId }: { sessionId: string }) {
  const [backendStatus, setBackendStatus] = React.useState<any>(null);
  const [sessionDetails, setSessionDetails] = React.useState<any>(null);
  const [testMessage, setTestMessage] = React.useState('');
  
  const checkBackend = async () => {
    try {
      // Test health endpoint
      const healthRes = await fetch('/api/health');
      const health = await healthRes.json();
      
      // Get session details
      const detailsRes = await fetch(`/api/debug/${sessionId}/details`);
      const details = await detailsRes.json();
      setSessionDetails(details);
      
      // Test direct SSE connection
      const testUrl = `/api/chat/${sessionId}/stream?message=test`;
      
      setBackendStatus({
        health,
        sessionId,
        testUrl,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setBackendStatus({ error: error.toString() });
    }
  };
  
  const testSimpleSSE = () => {
    const url = '/api/test/test-sse';
    console.log('Testing simple SSE at:', url);
    
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      console.log('Simple SSE connection opened');
    };
    
    eventSource.onerror = (error) => {
      console.error('Simple SSE error:', error);
      eventSource.close();
    };
    
    eventSource.onmessage = (event) => {
      console.log('Simple SSE message:', event.data);
    };
    
    ['connected', 'response', 'all_complete'].forEach(eventType => {
      eventSource.addEventListener(eventType, (event) => {
        console.log(`Simple SSE [${eventType}]:`, event.data);
      });
    });
    
    setTimeout(() => {
      console.log('Closing simple SSE test');
      eventSource.close();
    }, 10000);
  };
  
  const testSSE = () => {
    const message = testMessage || 'Hello, AI panel!';
    const url = `/api/chat/${sessionId}/stream?message=${encodeURIComponent(message)}`;
    console.log('Testing SSE connection to:', url);
    
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };
    
    eventSource.onmessage = (event) => {
      console.log('SSE message:', event.data);
    };
    
    // Listen for specific event types
    ['connected', 'response', 'model_complete', 'all_complete', 'error'].forEach(eventType => {
      eventSource.addEventListener(eventType, (event) => {
        console.log(`SSE event [${eventType}]:`, event.data);
      });
    });
    
    // Close after 30 seconds
    setTimeout(() => {
      console.log('Closing test SSE connection');
      eventSource.close();
    }, 30000);
  };
  
  return (
    <div className="glass-card-secondary p-4 rounded-lg mt-4">
      <h3 className="text-lg font-semibold mb-2">Debug Panel</h3>
      
      <div className="space-y-2 text-sm">
        <div>Session ID: <code className="bg-black/20 px-1 rounded">{sessionId}</code></div>
        
        <button
          onClick={checkBackend}
          className="glass-element px-3 py-1 rounded hover:bg-opacity-60 transition-all"
        >
          Check Backend Status
        </button>
        
        {backendStatus && (
          <pre className="bg-black/20 p-2 rounded text-xs overflow-auto">
            {JSON.stringify(backendStatus, null, 2)}
          </pre>
        )}
        
        {sessionDetails && (
          <div className="mt-2">
            <div className="text-sm font-semibold">Session Details:</div>
            <pre className="bg-black/20 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(sessionDetails, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Test message"
            className="flex-1 bg-black/20 px-2 py-1 rounded"
          />
          <button
            onClick={testSSE}
            className="glass-element px-3 py-1 rounded hover:bg-opacity-60 transition-all"
          >
            Test SSE Connection
          </button>
        </div>
        
        <button
          onClick={testSimpleSSE}
          className="glass-element px-3 py-1 rounded hover:bg-opacity-60 transition-all mt-2"
        >
          Test Simple SSE (No Session)
        </button>
        
        <div className="text-xs opacity-70">
          Check browser console for SSE connection logs
        </div>
      </div>
    </div>
  );
}