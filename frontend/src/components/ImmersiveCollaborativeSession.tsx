import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaborativeStream } from '../hooks/useCollaborativeStream';
import { getModelInfo } from '../utils/modelInfo';
import { soundEffects } from '../utils/soundEffects';

interface ImmersiveCollaborativeSessionProps {
  sessionId: string;
  onReturnToDashboard: () => void;
}

interface ModelNode {
  id: string;
  x: number;
  y: number;
  angle: number;
  status: 'idle' | 'thinking' | 'typing' | 'complete';
  currentMessage?: string;
  messagePreview?: string;
}

interface AccomplishmentItem {
  id: string;
  text: string;
  timestamp: number;
  contributors: string[];
}

export const ImmersiveCollaborativeSession: React.FC<ImmersiveCollaborativeSessionProps> = ({
  sessionId,
  onReturnToDashboard
}) => {
  const [userInput, setUserInput] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [accomplishments, setAccomplishments] = useState<AccomplishmentItem[]>([]);
  const [modelNodes, setModelNodes] = useState<Record<string, ModelNode>>({});
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    modelStates,
    synapses,
    isConnected,
    sendMessage,
    stats
  } = useCollaborativeStream(sessionId);

  // Initialize model positions in a circle
  useEffect(() => {
    const models = ['gpt-4o', 'gpt-4', 'claude-3.5', 'claude-3', 'gemini-1.5', 'gemini-2.0'];
    const angleStep = (2 * Math.PI) / models.length;
    const radius = 250;

    const nodes: Record<string, ModelNode> = {};
    models.forEach((model, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      nodes[model] = {
        id: model,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        angle: angle,
        status: 'idle'
      };
    });
    setModelNodes(nodes);
  }, []);

  // Update model nodes based on streaming state
  useEffect(() => {
    setModelNodes(prev => {
      const updated = { ...prev };
      
      // Update status based on model states
      modelStates.forEach((state, model) => {
        if (updated[model]) {
          if (state === 'thinking') {
            updated[model].status = 'thinking';
          } else if (state === 'responding') {
            updated[model].status = 'typing';
          } else if (state === 'complete') {
            updated[model].status = 'complete';
          }
        }
      });

      // Update message content
      messages.forEach((msg, model) => {
        if (updated[model]) {
          updated[model].currentMessage = msg.content;
          updated[model].messagePreview = msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '');
        }
      });

      return updated;
    });
  }, [modelStates, messages]);

  // Extract key accomplishments from conversation
  useEffect(() => {
    const newAccomplishments: AccomplishmentItem[] = [];
    
    messages.forEach((msg, model) => {
      // Simple extraction - look for key phrases
      const keyPhrases = [
        'we should', 'we need to', 'important to', 'key factor',
        'recommendation', 'solution', 'approach', 'strategy'
      ];
      
      const sentences = msg.content.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (keyPhrases.some(phrase => sentence.toLowerCase().includes(phrase))) {
          const existingIndex = newAccomplishments.findIndex(a => 
            a.text.toLowerCase().trim() === sentence.toLowerCase().trim()
          );
          
          if (existingIndex === -1) {
            newAccomplishments.push({
              id: `${Date.now()}-${Math.random()}`,
              text: sentence.trim(),
              timestamp: Date.now(),
              contributors: [model]
            });
          } else {
            if (!newAccomplishments[existingIndex].contributors.includes(model)) {
              newAccomplishments[existingIndex].contributors.push(model);
            }
          }
        }
      });
    });
    
    setAccomplishments(newAccomplishments.slice(-5)); // Keep last 5
  }, [messages]);

  const handleSendMessage = () => {
    if (userInput.trim() && isConnected) {
      sendMessage(userInput);
      setUserInput('');
      if (soundEnabled) {
        soundEffects.playMessageSent();
      }
    }
  };

  const handleModelInterrupt = (modelId: string, action: 'interrupt' | 'elaborate' | 'critique') => {
    let prompt = '';
    switch (action) {
      case 'interrupt':
        prompt = `[To ${getModelInfo(modelId).brandName}] Please pause your current response. Let's hear from other perspectives first.`;
        break;
      case 'elaborate':
        prompt = `[To ${getModelInfo(modelId).brandName}] Can you elaborate more on that point?`;
        break;
      case 'critique':
        prompt = `[To other models] What are your thoughts on ${getModelInfo(modelId).brandName}'s approach?`;
        break;
    }
    
    if (prompt) {
      sendMessage(prompt);
      if (soundEnabled) {
        soundEffects.playModelThinking();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight 
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            transition={{
              duration: 20 + Math.random() * 30,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Main canvas area */}
      <div ref={canvasRef} className="relative w-full h-full flex items-center justify-center">
        {/* Center user node */}
        <div ref={centerRef} className="absolute z-20">
          <motion.div
            className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-white text-center">
              <div className="text-2xl mb-1">You</div>
              <div className="text-xs opacity-80">Director</div>
            </div>
          </motion.div>
        </div>

        {/* Model nodes */}
        {Object.values(modelNodes).map((node) => {
          const modelInfo = getModelInfo(node.id);
          const Logo = modelInfo.Logo;
          const isActive = node.status !== 'idle';
          const isSelected = selectedModel === node.id;
          
          return (
            <motion.div
              key={node.id}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                x: node.x,
                y: node.y,
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: isSelected ? 1.2 : 1,
                opacity: 1
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={`relative w-24 h-24 rounded-full ${modelInfo.bgGradient} bg-gradient-to-br p-1 cursor-pointer`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedModel(node.id)}
              >
                <div className="w-full h-full rounded-full bg-white/90 backdrop-blur flex flex-col items-center justify-center">
                  <Logo size={32} className={modelInfo.color} />
                  <div className={`text-xs mt-1 ${modelInfo.color} font-medium`}>
                    {modelInfo.brandName}
                  </div>
                </div>
                
                {/* Status indicator */}
                <AnimatePresence>
                  {node.status === 'thinking' && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <span className="text-xs">💭</span>
                    </motion.div>
                  )}
                  {node.status === 'typing' && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <span className="text-xs">✍️</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message preview bubble */}
                {node.messagePreview && (
                  <motion.div
                    className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-48 p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="text-xs text-gray-700 line-clamp-3">
                      {node.messagePreview}
                    </div>
                    
                    {/* Action buttons */}
                    {node.status === 'typing' && (
                      <div className="flex gap-1 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelInterrupt(node.id, 'interrupt');
                          }}
                          className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Pause
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelInterrupt(node.id, 'elaborate');
                          }}
                          className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Elaborate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModelInterrupt(node.id, 'critique');
                          }}
                          className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                          Discuss
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          );
        })}

        {/* Synapse connections */}
        <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          {synapses.map((synapse, index) => {
            const fromNode = modelNodes[synapse.from];
            const toNode = modelNodes[synapse.to];
            
            if (!fromNode || !toNode) return null;
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            return (
              <motion.line
                key={index}
                x1={centerX + fromNode.x}
                y1={centerY + fromNode.y}
                x2={centerX + toNode.x}
                y2={centerY + toNode.y}
                stroke="url(#synapse-gradient)"
                strokeWidth="2"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1 }}
              />
            );
          })}
          <defs>
            <linearGradient id="synapse-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Accomplishments Panel */}
      <motion.div
        className="absolute top-4 right-4 w-96 max-h-96 bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-2xl"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
          <span>🎯</span> Discussion Progress
        </h3>
        
        <div className="space-y-2 overflow-y-auto max-h-80">
          {accomplishments.length === 0 ? (
            <p className="text-white/60 text-sm">Key insights will appear here as the discussion progresses...</p>
          ) : (
            accomplishments.map((item) => (
              <motion.div
                key={item.id}
                className="bg-white/10 rounded-lg p-3"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                <p className="text-white text-sm">{item.text}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white/60">Contributors:</span>
                  <div className="flex gap-1">
                    {item.contributors.map((contributor) => {
                      const info = getModelInfo(contributor);
                      const Logo = info.Logo;
                      return (
                        <div
                          key={contributor}
                          className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                          title={info.brandName}
                        >
                          <Logo size={12} className="text-white" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between text-sm text-white/80">
            <span>Models Active: {modelStates.size}</span>
            <span>Synapses: {synapses.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Control Bar */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-xl border-t border-white/10"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="max-w-4xl mx-auto p-4">
          {/* Top controls */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onReturnToDashboard}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
            >
              ← Back to Dashboard
            </button>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
              
              <div className="text-white/80 text-sm">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </div>
            </div>
          </div>
          
          {/* Message input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Direct the conversation..."
              className="flex-1 px-4 py-3 bg-white/10 backdrop-blur text-white placeholder-white/50 rounded-lg border border-white/20 focus:border-white/40 focus:outline-none"
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || !isConnected}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Send
            </button>
          </div>
          
          {/* Quick actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setUserInput('What are the key takeaways so far?')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-all"
            >
              📊 Summarize
            </button>
            <button
              onClick={() => setUserInput('Let\'s explore alternative approaches')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-all"
            >
              🔄 Alternatives
            </button>
            <button
              onClick={() => setUserInput('What are the potential challenges?')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-all"
            >
              ⚠️ Challenges
            </button>
            <button
              onClick={() => setUserInput('How can we implement this?')}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full transition-all"
            >
              🚀 Implementation
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};