import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewDashboardProps {
  onSessionCreate: (sessionId: string) => void;
}

interface PersonaRecommendation {
  id: string;
  name: string;
  icon: string;
  expertise: string;
  description: string;
  color: string;
}

export const NewDashboard: React.FC<NewDashboardProps> = ({ onSessionCreate }) => {
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<PersonaRecommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Smart persona recommendations based on user input
  const analyzeInput = (input: string) => {
    const keywords = input.toLowerCase();
    const suggestions: PersonaRecommendation[] = [];

    // Strategy & Planning
    if (keywords.includes('strategy') || keywords.includes('plan') || keywords.includes('business') || keywords.includes('growth')) {
      suggestions.push({
        id: 'strategic-panel',
        name: 'Strategic Planning Panel',
        icon: '🎯',
        expertise: 'Business Strategy & Planning',
        description: 'GPT-4o, Claude 3.5, Gemini - Expert strategists for comprehensive planning',
        color: 'from-blue-500 to-purple-600'
      });
    }

    // Creative & Innovation
    if (keywords.includes('creative') || keywords.includes('design') || keywords.includes('innovation') || keywords.includes('brainstorm')) {
      suggestions.push({
        id: 'creative-panel',
        name: 'Creative Innovation Panel',
        icon: '🎨',
        expertise: 'Creative Thinking & Innovation',
        description: 'Claude 3.5, GPT-4o, Gemini - Visionary minds for breakthrough ideas',
        color: 'from-pink-500 to-orange-500'
      });
    }

    // Technical & Engineering
    if (keywords.includes('technical') || keywords.includes('code') || keywords.includes('develop') || keywords.includes('architecture')) {
      suggestions.push({
        id: 'technical-panel',
        name: 'Technical Architecture Panel',
        icon: '⚡',
        expertise: 'Technical Design & Engineering',
        description: 'GPT-4, Claude 3.5, Gemini - Engineering excellence and best practices',
        color: 'from-green-500 to-teal-600'
      });
    }

    // Analysis & Research
    if (keywords.includes('analyze') || keywords.includes('research') || keywords.includes('data') || keywords.includes('study')) {
      suggestions.push({
        id: 'analysis-panel',
        name: 'Analysis & Research Panel',
        icon: '🔬',
        expertise: 'Deep Analysis & Research',
        description: 'Gemini 1.5, GPT-4o, Claude 3 - Data-driven insights and thorough analysis',
        color: 'from-indigo-500 to-blue-600'
      });
    }

    // Default comprehensive panel if no specific match
    if (suggestions.length === 0) {
      suggestions.push({
        id: 'comprehensive-panel',
        name: 'Comprehensive Expert Panel',
        icon: '🌟',
        expertise: 'Multi-Disciplinary Collaboration',
        description: 'All 6 AI experts - Complete collaborative intelligence for any challenge',
        color: 'from-purple-500 to-pink-500'
      });
    }

    return suggestions.slice(0, 3); // Max 3 recommendations
  };

  // Analyze input with debounce
  useEffect(() => {
    if (userInput.trim().length > 10) {
      setIsAnalyzing(true);
      const timer = setTimeout(() => {
        const recs = analyzeInput(userInput);
        setRecommendations(recs);
        setShowRecommendations(true);
        setIsAnalyzing(false);
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setShowRecommendations(false);
      setRecommendations([]);
    }
  }, [userInput]);

  const handleCreateSession = async (panelType: string) => {
    // Create session with selected panel
    try {
      const response = await fetch('/api/chat/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mission: userInput,
          panel_type: panelType,
          selected_models: getModelsForPanel(panelType)
        })
      });
      
      const data = await response.json();
      onSessionCreate(data.session_id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const getModelsForPanel = (panelType: string): string[] => {
    switch (panelType) {
      case 'strategic-panel': return ['gpt-4o', 'claude-3.5', 'gemini-1.5'];
      case 'creative-panel': return ['claude-3.5', 'gpt-4o', 'gemini-2.0'];
      case 'technical-panel': return ['gpt-4', 'claude-3.5', 'gemini-1.5'];
      case 'analysis-panel': return ['gemini-1.5', 'gpt-4o', 'claude-3'];
      default: return ['gpt-4o', 'claude-3.5', 'gemini-1.5', 'gpt-4', 'claude-3', 'gemini-2.0'];
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Bokeh Background */}
      <div className="bokeh-background fixed inset-0 z-0">
        <motion.div 
          className="bokeh bokeh-1"
          animate={{
            x: [0, 100, -50, 0],
            y: [0, -100, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="bokeh bokeh-2"
          animate={{
            x: [0, -80, 120, 0],
            y: [0, 80, -60, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />
        <motion.div 
          className="bokeh bokeh-3"
          animate={{
            x: [0, 60, -100, 0],
            y: [0, -80, 40, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 10
          }}
        />
        <motion.div 
          className="bokeh bokeh-4"
          animate={{
            x: [0, -120, 80, 0],
            y: [0, 60, -90, 0],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 15
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Group<span className="text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">Chat</span>LLM
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Experience the power of collaborative AI intelligence.
            <br />
            Multiple expert minds working together on your challenge.
          </p>
        </motion.div>

        {/* Hero Input Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-4xl"
        >
          <div className="glass-hero p-8 rounded-3xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">
                What would you like to explore together?
              </h2>
              <p className="text-white/70">
                Describe your challenge, goal, or question - we'll assemble the perfect AI expert panel
              </p>
            </div>

            <div className="relative">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Help me design a scalable microservices architecture for my startup..."
                className="w-full h-32 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 
                         text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 
                         focus:ring-blue-400/50 focus:border-transparent transition-all duration-300
                         text-lg leading-relaxed"
                style={{ minHeight: '120px' }}
              />
              
              {isAnalyzing && (
                <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white/60">
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white/60 rounded-full" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {[
                "🎯 Strategic planning",
                "🎨 Creative brainstorming", 
                "⚡ Technical architecture",
                "🔬 Data analysis",
                "📝 Content strategy"
              ].map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => setUserInput(suggestion.split(' ').slice(1).join(' ') + ' for my project')}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 
                           text-white/80 hover:text-white transition-all duration-300 text-sm
                           hover:scale-105 backdrop-blur-sm"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* AI Panel Recommendations */}
        <AnimatePresence>
          {showRecommendations && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-6xl mt-8"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Recommended Expert Panels
                </h3>
                <p className="text-white/70">
                  Choose the AI collaboration that best fits your needs
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleCreateSession(rec.id)}
                    className="glass-card p-6 rounded-2xl cursor-pointer hover:scale-105 
                             transition-all duration-300 group border border-white/20"
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${rec.color} 
                                   flex items-center justify-center text-2xl mb-4 
                                   group-hover:scale-110 transition-transform`}>
                      {rec.icon}
                    </div>
                    
                    <h4 className="text-xl font-semibold text-white mb-2">
                      {rec.name}
                    </h4>
                    
                    <p className="text-blue-300 text-sm font-medium mb-3">
                      {rec.expertise}
                    </p>
                    
                    <p className="text-white/70 text-sm leading-relaxed">
                      {rec.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-white/50">
                        Click to start collaboration
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center 
                                    group-hover:bg-white/20 transition-colors">
                        <span className="text-white text-sm">→</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
