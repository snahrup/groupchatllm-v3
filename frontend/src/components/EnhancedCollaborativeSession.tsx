import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaborativeStream } from '../hooks/useCollaborativeStream';
import { ModelState, StreamingMessage } from '../types';
import { soundEffects } from '../utils/soundEffects';
import { TypewriterMessageQueue } from './TypewriterComponents';

interface EnhancedCollaborativeSessionProps {
  sessionId: string;
  onReturnToDashboard: () => void;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  model?: string;
  timestamp: number;
}

export const EnhancedCollaborativeSession: React.FC<EnhancedCollaborativeSessionProps> = ({ 
  sessionId, 
  onReturnToDashboard 
}) => {
  const [userInput, setUserInput] = useState('');
  const [messageQueue, setMessageQueue] = useState<ConversationMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showModelDetails, setShowModelDetails] = useState(false);
  
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

  // Enhanced model mapping
  const getModelInfo = (model: string) => {
    const modelMap: Record<string, { name: string; icon: string; expertise: string; color: string }> = {
      'gpt-4o': { 
        name: 'The Strategist', 
        icon: '🎯', 
        expertise: 'Strategic Planning & Analysis',
        color: 'from-blue-500 to-blue-600'
      },
      'claude-3.5': { 
        name: 'The Creative', 
        icon: '🎨', 
        expertise: 'Creative Innovation',
        color: 'from-purple-500 to-pink-500'
      },
      'gemini-1.5': { 
        name: 'The Analyst', 
        icon: '🔬', 
        expertise: 'Data Analysis & Research',
        color: 'from-green-500 to-teal-500'
      },
      'gpt-4': { 
        name: 'The Architect', 
        icon: '🏗️', 
        expertise: 'System Architecture',
        color: 'from-indigo-500 to-blue-500'
      },
      'claude-3': { 
        name: 'The Synthesizer', 
        icon: '🔗', 
        expertise: 'Idea Integration',
        color: 'from-orange-500 to-red-500'
      },
      'gemini-2.0': { 
        name: 'The Explorer', 
        icon: '🚀', 
        expertise: 'Innovation & Discovery',
        color: 'from-cyan-500 to-blue-500'
      }
    };

    // Handle UUIDs by using first part or falling back to default
    const modelKey = Object.keys(modelMap).find(key => 
      model.toLowerCase().includes(key) || key.includes(model.toLowerCase())
    );
    
    if (modelKey) {
      return modelMap[modelKey];
    }
    
    // Fallback for UUIDs
    return {
      name: `AI Expert ${model.slice(0, 8)}`,
      icon: '🤖',
      expertise: 'Collaborative Intelligence',
      color: 'from-gray-500 to-gray-600'
    };
  };

  // Queue-based message processing - add completed messages to queue
  useEffect(() => {
    messages.forEach((message, model) => {
      if (message.isComplete && message.content.trim()) {
        const messageId = `${model}-${message.timestamp}`;
        
        setMessageQueue(prev => {
          const exists = prev.some(msg => msg.id === messageId);
          if (!exists) {
            const newMessage: ConversationMessage = {
              id: messageId,
              type: 'ai',
              content: message.content,
              model: model,
              timestamp: message.timestamp
            };
            
            return [...prev, newMessage];
          }
          return prev;
        });
      }
    });
  }, [messages]);

  // Auto-scroll with smooth behavior
  useEffect(() => {
    if (messagesEndRef.current && !isPaused) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messageQueue, isPaused]);

  // Sound effects control
  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userInput,
      timestamp: Date.now()
    };
    
    setMessageQueue(prev => [...prev, userMessage]);
    sendMessage(userInput);
    
    if (soundEnabled) soundEffects.messageSent();
    setUserInput('');
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleSpeedChange = (newSpeed: 'slow' | 'normal' | 'fast') => {
    setSpeed(newSpeed);
  };

  return (
    <div className="min-h-screen relative">
      {/* Glassmorphic Background */}
      <div className="bokeh-background">
        <motion.div 
          className="bokeh bokeh-1"
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -50, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="bokeh bokeh-2"
          animate={{
            x: [0, -40, 60, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
        <motion.div 
          className="bokeh bokeh-3"
          animate={{
            x: [0, 30, -50, 0],
            y: [0, -40, 20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 6
          }}
        />
        <motion.div 
          className="bokeh bokeh-4"
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 30, -45, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 9
          }}
        />
      </div>

      {/* Main Interface */}
      <div className="relative z-10 min-h-screen flex flex-col">
        
        {/* Header with Controls */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-hero p-4 m-4 rounded-2xl"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Collaborative AI Session
              </h1>
              <div className="flex items-center gap-4 text-sm text-white/70">
                <span>Session: {sessionId.slice(0, 8)}...</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                {stats && (
                  <span>{stats.total_messages} messages • {stats.total_synapses} collaborations</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Speed Control */}
              <div className="flex items-center gap-2">
                <span className="text-white/70 text-sm">Pace:</span>
                <div className="flex gap-1">
                  {(['slow', 'normal', 'fast'] as const).map((speedOption) => (
                    <button
                      key={speedOption}
                      onClick={() => handleSpeedChange(speedOption)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all ${
                        speed === speedOption 
                          ? 'bg-white/20 text-white' 
                          : 'bg-white/10 text-white/60 hover:bg-white/15'
                      }`}
                    >
                      {speedOption === 'slow' ? '🐌 Thoughtful' : 
                       speedOption === 'normal' ? '📖 Reading' : 
                       '⚡ Quick'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pause Control */}
              <button
                onClick={togglePause}
                className={`px-4 py-2 rounded-lg transition-all ${
                  isPaused 
                    ? 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-300'
                    : 'bg-white/10 border border-white/20 text-white hover:bg-white/15'
                }`}
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all"
                title={soundEnabled ? 'Disable sound' : 'Enable sound'}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>

              {/* Model Details Toggle */}
              <button
                onClick={() => setShowModelDetails(!showModelDetails)}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all"
              >
                {showModelDetails ? 'Hide Details' : 'Show Details'}
              </button>

              {/* Return Button */}
              <button
                onClick={onReturnToDashboard}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 transition-all"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 p-4">
          
          {/* Left: Conversation Area */}
          <div className="flex-1 flex flex-col">
            
            {/* Messages Area with Typewriter Queue */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 glass-card p-6 rounded-2xl mb-4 overflow-y-auto"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
              {messageQueue.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white/50">
                    <div className="text-4xl mb-4">💬</div>
                    <div className="text-lg">Ready for collaboration</div>
                    <div className="text-sm mt-2">Ask your question to begin the discussion</div>
                  </div>
                </div>
              ) : (
                <>
                  <TypewriterMessageQueue
                    messages={messageQueue}
                    speed={speed}
                    isPaused={isPaused}
                    getModelInfo={getModelInfo}
                    onQueueComplete={() => {
                      if (soundEnabled) soundEffects.allCompleted();
                    }}
                  />
                  
                  {/* Active Models Indicator */}
                  {Array.from(messages.entries()).some(([_, message]) => !message.isComplete && message.content.trim()) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex justify-center"
                    >
                      <div className="glass-card px-4 py-3 rounded-2xl border border-blue-400/20">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full"
                          />
                          <div className="text-white/80 text-sm">
                            AI experts are analyzing and preparing responses...
                          </div>
                          <div className="flex gap-1">
                            {Array.from(messages.entries())
                              .filter(([_, message]) => !message.isComplete && message.content.trim())
                              .map(([model, _]) => (
                                <div
                                  key={model}
                                  className={`w-6 h-6 rounded-lg bg-gradient-to-r ${getModelInfo(model).color} 
                                           flex items-center justify-center text-xs animate-pulse`}
                                >
                                  {getModelInfo(model).icon}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="glass-hero p-4 rounded-2xl">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Continue directing the panel..."
                  className="flex-1 px-4 py-3 glass-input rounded-xl"
                  disabled={isPaused}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isPaused}
                  className="px-6 py-3 glass-button rounded-xl disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Right: Model Status & Controls */}
          {showModelDetails && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-80 glass-card p-6 rounded-2xl"
            >
              <h3 className="text-lg font-semibold text-white mb-4">AI Expert Panel</h3>
              
              <div className="space-y-4">
                {Array.from(modelStates.entries()).map(([model, state]) => {
                  const modelInfo = getModelInfo(model);
                  return (
                    <div key={model} className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${modelInfo.color} 
                                       flex items-center justify-center text-sm`}>
                          {modelInfo.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white text-sm">
                            {modelInfo.name}
                          </div>
                          <div className="text-xs text-white/60">
                            {modelInfo.expertise}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            state === 'thinking' ? 'bg-yellow-500/20 text-yellow-300' :
                            state === 'responding' ? 'bg-blue-500/20 text-blue-300' :
                            state === 'complete' ? 'bg-green-500/20 text-green-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {state}
                          </div>
                        </div>
                      </div>
                      
                      {messages.has(model) && !messages.get(model)!.isComplete && (
                        <div className="text-xs text-white/60">
                          {messages.get(model)!.content.length} characters
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Collaboration Stats */}
              {synapses.length > 0 && (
                <div className="mt-6 glass-card p-4 rounded-xl">
                  <div className="text-sm font-medium text-white mb-2">
                    🔗 Collaboration Events
                  </div>
                  <div className="text-sm text-white/70">
                    {synapses.length} synapse{synapses.length !== 1 ? 's' : ''} detected
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};