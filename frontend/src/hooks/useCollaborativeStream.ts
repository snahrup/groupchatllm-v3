import { useEffect, useState, useCallback, useRef } from 'react';
import { 
  StreamingMessage, 
  ModelState, 
  SynapseConnection, 
  ResponseData,
  CollaborationStats 
} from '../types';

interface UseCollaborativeStreamReturn {
  messages: Map<string, StreamingMessage>;
  modelStates: Map<string, ModelState>;
  synapses: SynapseConnection[];
  isConnected: boolean;
  error: string | null;
  sendMessage: (message: string) => void;
  disconnect: () => void;
  stats: CollaborationStats | null;
}

export const useCollaborativeStream = (sessionId: string | null): UseCollaborativeStreamReturn => {
  const [messages, setMessages] = useState<Map<string, StreamingMessage>>(new Map());
  const [modelStates, setModelStates] = useState<Map<string, ModelState>>(new Map());
  const [synapses, setSynapses] = useState<SynapseConnection[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CollaborationStats | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!sessionId) {
      setError('No active session');
      return;
    }

    // Clear previous messages and error
    setMessages(new Map());
    setError(null);
    
    // Reset all model states to thinking
    setModelStates(prev => {
      const updated = new Map(prev);
      prev.forEach((_, model) => {
        updated.set(model, 'thinking');
      });
      return updated;
    });
    
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // Create SSE connection
    const url = `/api/chat/${sessionId}/stream?message=${encodeURIComponent(message)}`;
    console.log('[SSE] Connecting to:', url);
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
    };
    
    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      setError('Connection error - check console');
      setIsConnected(false);
    };

    eventSource.addEventListener('connected', (event) => {
      console.log('[SSE] Connected event:', (event as MessageEvent).data);
      setIsConnected(true);
      setError(null);
      
      // Clear any previous messages when reconnecting
      setMessages(new Map());
      setSynapses([]);
    });

    eventSource.addEventListener('response', (event) => {
      try {
        const data: ResponseData = JSON.parse((event as MessageEvent).data);
        console.log('[SSE] Response event:', data);
        
        // Update streaming message
        setMessages(prev => {
          const updated = new Map(prev);
          const existing = updated.get(data.model) || { 
            id: `${data.model}-${Date.now()}`,
            model: data.model, 
            content: '', 
            isComplete: false,
            timestamp: Date.now(),
            type: data.type
          };
          
          const updatedMessage = {
            ...existing,
            content: existing.content + data.content,
            isComplete: data.complete,
            synapseConnection: data.synapse?.building_on,
            type: data.type,
            timestamp: existing.timestamp // Keep original timestamp
          };
          
          updated.set(data.model, updatedMessage);
          
          console.log(`[SSE] Updated message for ${data.model}:`, {
            contentLength: updatedMessage.content.length,
            isComplete: updatedMessage.isComplete,
            content: updatedMessage.content.substring(0, 100) + '...'
          });
          
          return updated;
        });
        
        // Update model state
        setModelStates(prev => {
          const updated = new Map(prev);
          updated.set(data.model, data.complete ? 'complete' : 'responding');
          return updated;
        });
        
        // Track synapses
        if (data.synapse?.detected && data.synapse.building_on) {
          setSynapses(prev => [...prev, {
            from: data.synapse!.building_on,
            to: data.model,
            type: 'building',
            timestamp: Date.now()
          }]);
        }
      } catch (error) {
        console.error('[SSE] Error parsing response:', error);
      }
    });

    eventSource.addEventListener('model_complete', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('[SSE] Model complete:', data);
        setModelStates(prev => {
          const updated = new Map(prev);
          updated.set(data.model, 'complete');
          return updated;
        });
      } catch (error) {
        console.error('[SSE] Error parsing model_complete event:', error);
      }
    });

    eventSource.addEventListener('all_complete', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.log('[SSE] All complete:', data);
        setStats(data.stats);
      } catch (error) {
        console.error('[SSE] Error parsing all_complete event:', error);
      }
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        console.error('[SSE] Error event:', data);
        setError(data.error || 'Stream error');
      } catch (error) {
        // Not a JSON error message
      }
    });
  }, [sessionId, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    modelStates,
    synapses,
    isConnected,
    error,
    sendMessage,
    disconnect,
    stats
  };
};