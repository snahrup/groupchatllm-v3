import React, { useState, useEffect, useRef } from 'react';
import { useCollaborativeStream } from '../hooks/useCollaborativeStream';
import { ModelState, StreamingMessage } from '../types';
import { DebugPanel } from './DebugPanel';
import { SynapseAnimation } from './SynapseAnimation';
import { ModelThinkingIndicator } from './ModelThinkingIndicator';
import { soundEffects } from '../utils/soundEffects';

interface CollaborativeSessionProps {
  sessionId: string;
  onReturnToDashboard: () => void;
}

export const CollaborativeSession: React.FC<CollaborativeSessionProps> = ({ 
  sessionId, 
  onReturnToDashboard 
}) => {
  const [userInput, setUserInput] = useState('What are the most important factors we should consider first?');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'ai';
    content: string;
    model?: string;
    timestamp: number;
  }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    modelStates,
    synapses,
    isConnected,
    error,
    sendMessage,
    disconnect,
    stats
  } = useCollaborativeStream(sessionId);

  // Update sound effects when setting changes
  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory, messages]);

  // Play sound effects for synapse detection and model completion
  const previousSynapseCount = useRef(0);
  const previousCompletedModels = useRef(new Set<string>());
  
  useEffect(() => {
    // Check for new synapses
    if (synapses.length > previousSynapseCount.current) {
      soundEffects.synapseDetected();
      previousSynapseCount.current = synapses.length;
    }
  }, [synapses]);

  // Track model completion for sound effects
  useEffect(() => {
    modelStates.forEach((state, model) => {
      if (state === 'complete' && !previousCompletedModels.current.has(model)) {
        soundEffects.modelCompleted();
        previousCompletedModels.current.add(model);
      }
    });
    
    // Check if all models are complete
    const allModels = Array.from(modelStates.values());
    const completedModels = allModels.filter(state => state === 'complete');
    
    if (allModels.length > 0 && completedModels.length === allModels.length) {
      // Brief delay to let individual completion sounds finish
      setTimeout(() => {
        if (Array.from(modelStates.values()).every(state => state === 'complete')) {
          soundEffects.allCompleted();
        }
      }, 500);
    }
  }, [modelStates]);

  const handleSendMessage = () => {
    console.log('[CollaborativeSession] handleSendMessage called');
    console.log('[CollaborativeSession] userInput:', userInput);
    console.log('[CollaborativeSession] sessionId:', sessionId);
    
    if (!userInput.trim()) {
      console.log('[CollaborativeSession] Empty input, returning');
      return;
    }
    
    // Add user message to history
    setConversationHistory(prev => [...prev, {
      type: 'user',
      content: userInput,
      timestamp: Date.now()
    }]);

    console.log('[CollaborativeSession] Calling sendMessage');
    sendMessage(userInput);
    soundEffects.messageSent();
    setUserInput('');
  };

  // Convert streaming messages to conversation history when complete
  useEffect(() => {
    console.log('[CollaborativeSession] Processing messages for conversation history');
    console.log('[CollaborativeSession] Current messages:', Array.from(messages.entries()));
    
    const completedModels: string[] = [];
    
    messages.forEach((message, model) => {
      console.log(`[CollaborativeSession] Checking message from ${model}:`, {
        isComplete: message.isComplete,
        content: message.content.substring(0, 50) + '...',
        contentLength: message.content.length
      });
      
      if (message.isComplete && message.content.trim()) {
        completedModels.push(model);
        
        setConversationHistory(prev => {
          // Check if this message already exists
          const exists = prev.some(msg => 
            msg.type === 'ai' && 
            msg.model === model && 
            msg.content === message.content
          );
          
          if (!exists) {
            console.log(`[CollaborativeSession] Adding completed message from ${model}`);
            const newMessage = {
              type: 'ai' as const,
              content: message.content,
              model: model,
              timestamp: message.timestamp
            };
            return [...prev, newMessage];
          } else {
            console.log(`[CollaborativeSession] Message from ${model} already exists in conversation`);
          }
          return prev;
        });
      }
    });
    
    // Note: We don't remove completed messages from the streaming map here
    // as they might be useful for display purposes during transition
  }, [messages]);
  const getModelIcon = (model: string) => {
    // Handle both UUID and friendly names
    const modelIcons: Record<string, string> = {
      'gpt-4o': '🧠',
      'claude-3.5': '🎭', 
      'gemini-1.5': '🔬',
      'gpt-4': '🧠',
      'claude-3': '🎭',
      'gemini-2.0': '🔬',
      'system': '⚙️'
    };
    
    // If it's a UUID, try to map based on common patterns
    if (model.length > 20) {
      // This is likely a UUID, return a default icon
      return '🤖';
    }
    
    return modelIcons[model] || '🤖';
  };

  const getModelName = (model: string) => {
    const modelNames: Record<string, string> = {
      'gpt-4o': 'The Strategist',
      'claude-3.5': 'The Creative', 
      'gemini-1.5': 'The Analyst',
      'gpt-4': 'The Architect',
      'claude-3': 'The Synthesizer',
      'gemini-2.0': 'The Explorer',
      'system': 'System'
    };
    
    // If it's a UUID, return a shortened version
    if (model.length > 20) {
      return `AI Model ${model.slice(0, 8)}...`;
    }
    
    return modelNames[model] || model;
  };

  const getStatusIcon = (state: ModelState) => {
    switch (state) {
      case 'thinking': return '💭';
      case 'responding': return '✍️';
      case 'complete': return '✅';
      case 'error': return '❌';
      default: return '⏸️';
    }
  };

  return (
    <div className="app-background">
      <div className="min-h-screen flex flex-col">
        
        {/* Header */}
        <div className="glass-card-secondary p-4 m-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">Collaborative Session</h1>
              <div className="text-sm opacity-70">
                Session: {sessionId.slice(0, 8)}... | 
                Connection: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="ml-3 text-xs glass-element px-2 py-1 rounded hover:bg-opacity-60 transition-all"
                  title={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
                >
                  {soundEnabled ? '🔊' : '🔇'}
                </button>
              </div>
              {!isConnected && messages.size === 0 && (
                <div className="text-xs text-yellow-500 mt-1">
                  💡 Send a message to connect to the AI panel
                </div>
              )}
            </div>
            <button
              onClick={onReturnToDashboard}
              className="glass-element px-4 py-2 rounded-lg hover:bg-opacity-60 transition-all"
            >
              ← Return to Dashboard
            </button>
          </div>
        </div>
        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 p-4">
          
          {/* Left: Chat Area */}
          <div className="flex-1 glass-card-primary p-6 rounded-lg">
            
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto mb-6 space-y-4 h-96 relative"
            >
              {/* Synapse Animations */}
              <SynapseAnimation 
                synapses={synapses} 
                containerRef={messagesContainerRef} 
              />
              
              {conversationHistory.length === 0 && messages.size === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center opacity-50">
                    <div className="text-4xl mb-4">💬</div>
                    <div className="text-lg">Start the conversation</div>
                    <div className="text-sm mt-2">Send a message below or press Enter</div>
                  </div>
                </div>
              )}
              
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs opacity-50 mb-2">
                  Debug: {conversationHistory.length} in history, {messages.size} streaming
                </div>
              )}
              
              {conversationHistory.map((msg, index) => {
                console.log(`[CollaborativeSession] Rendering conversation message ${index}:`, msg);
                return (
                  <div 
                    key={index} 
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    data-model={msg.type === 'ai' ? msg.model : undefined}
                  >
                    <div className={`max-w-[80%] p-4 rounded-lg ${
                      msg.type === 'user' 
                        ? 'glass-card-secondary ml-auto' 
                        : 'glass-element'
                    }`}>
                      {msg.type === 'ai' && (
                        <div className="flex items-center gap-2 mb-2 text-sm opacity-80">
                          <span>{getModelIcon(msg.model!)}</span>
                          <span>{getModelName(msg.model!)}</span>
                          <span className="text-xs opacity-60">• Complete</span>
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      {msg.type === 'ai' && (
                        <div className="text-xs opacity-60 mt-1">
                          {msg.content.length} characters
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Model Thinking Indicators */}
              {Array.from(modelStates.entries()).map(([model, state]) => (
                <ModelThinkingIndicator
                  key={`thinking-${model}`}
                  model={model}
                  state={state}
                  getModelIcon={getModelIcon}
                  getModelName={getModelName}
                />
              ))}
              
              {/* Active Streaming Messages */}
              {Array.from(messages.entries()).map(([model, message]) => {
                console.log('[CollaborativeSession] Rendering streaming message:', model, {
                  isComplete: message.isComplete,
                  content: message.content.substring(0, 50) + '...',
                  contentLength: message.content.length
                });
                
                // Show messages that are currently being streamed (not complete) and have content
                return !message.isComplete && message.content.trim() ? (
                  <div 
                    key={`streaming-${model}`} 
                    className="flex justify-start"
                    data-model={model}
                  >
                    <div className="max-w-[80%] p-4 glass-element rounded-lg border border-blue-300/30">
                      <div className="flex items-center gap-2 mb-2 text-sm opacity-80">
                        <span>{getModelIcon(model)}</span>
                        <span>{getModelName(model)}</span>
                        <span className="animate-pulse">✍️</span>
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {message.content.length} characters • Streaming...
                      </div>
                    </div>
                  </div>
                ) : null;
              })}
              
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Quick Message Suggestions */}
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() => setUserInput('What are the most important factors we should consider first?')}
                className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
              >
                🎯 Key Factors
              </button>
              <button
                onClick={() => setUserInput('Can you elaborate on that last point?')}
                className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
              >
                🔍 Elaborate
              </button>
              <button
                onClick={() => setUserInput('What are the potential risks and how can we mitigate them?')}
                className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
              >
                ⚠️ Risks
              </button>
              <button
                onClick={() => setUserInput('Let\'s summarize the key takeaways so far')}
                className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
              >
                📋 Summarize
              </button>
              <button
                onClick={() => setUserInput('What would be the next steps to move forward?')}
                className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
              >
                ➡️ Next Steps
              </button>
            </div>

            {/* Input Area */}
            <div className="flex gap-3">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    console.log('[CollaborativeSession] Enter key pressed');
                    handleSendMessage();
                  }
                }}
                placeholder="Direct the panel..."
                className="flex-1 px-4 py-3 glass-element rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                onClick={() => {
                  console.log('[CollaborativeSession] Send button clicked');
                  handleSendMessage();
                }}
                disabled={!userInput.trim()}
                className="px-6 py-3 glass-card-secondary rounded-lg disabled:opacity-50 
                         hover:scale-105 transition-all duration-200"
              >
                Send
              </button>
            </div>
          </div>
          {/* Right: Panelist Status */}
          <div className="w-80 glass-card-secondary p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">AI Panel Status</h3>
            
            <div className="space-y-4">
              {Array.from(modelStates.entries()).map(([model, state]) => (
                <div key={model} className="glass-element p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{getModelIcon(model)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{getModelName(model)}</div>
                      <div className="text-sm opacity-70">{model}</div>
                    </div>
                    <span className="text-lg">{getStatusIcon(state)}</span>
                  </div>
                  
                  <div className="text-sm opacity-80">
                    {state === 'thinking' && 'Processing your request...'}
                    {state === 'responding' && 'Actively responding...'}
                    {state === 'complete' && 'Response complete'}
                    {state === 'error' && 'Connection error'}
                    {state === 'standby' && 'Waiting for context'}
                  </div>
                  
                  {/* Show character count for active responses */}
                  {messages.has(model) && !messages.get(model)!.isComplete && (
                    <div className="text-xs opacity-60 mt-2">
                      {messages.get(model)!.content.length} characters
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Synapse Count */}
            {synapses.length > 0 && (
              <div className="mt-6 glass-element p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">🔗 Collaboration Events</div>
                <div className="text-sm opacity-80">
                  {synapses.length} synapse{synapses.length !== 1 ? 's' : ''} detected
                </div>
              </div>
            )}

            {/* Session Stats */}
            {stats && (
              <div className="mt-6 glass-element p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">📊 Session Stats</div>
                <div className="text-sm opacity-80 space-y-1">
                  <div>Messages: {stats.total_messages}</div>
                  <div>Collaborations: {stats.total_synapses}</div>
                </div>
              </div>
            )}
            
            {/* Debug Panel */}
            <DebugPanel sessionId={sessionId} />
          </div>
        </div>
      </div>
    </div>
  );
};