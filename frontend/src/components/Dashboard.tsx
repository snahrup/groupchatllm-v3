import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { AvailableModel } from '../types';
import { getModelInfo } from '../utils/modelInfo';

interface DashboardProps {
  onSessionStart: (sessionId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSessionStart }) => {
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [mission, setMission] = useState('Help me design a scalable microservices architecture for a real-time collaborative platform');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    checkBackendStatus();
    loadAvailableModels();
  }, []);

  const checkBackendStatus = async () => {
    try {
      await apiClient.getHealth();
      setBackendStatus('connected');
    } catch (error) {
      setBackendStatus('error');
      console.error('Backend health check failed:', error);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const models = await apiClient.getAvailableModels();
      setAvailableModels(models);
    } catch (error) {
      console.error('Failed to load models:', error);
      setError('Could not load available AI models');
    }
  };
  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleCreateSession = async () => {
    if (!mission.trim()) {
      setError('Please enter a mission statement');
      return;
    }

    if (selectedModels.length === 0) {
      setError('Please select at least one AI expert');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.createSession({
        mission: mission.trim(),
        selected_models: selectedModels
      });
      
      onSessionStart(response.session_id);
    } catch (error) {
      setError(`Failed to create session: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-background">
      <div className="min-h-screen p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">GroupChatLLM v3</h1>
          <h2 className="text-xl opacity-80 mb-8">
            Collaborative AI Intelligence Orchestration
          </h2>
          
          {/* Backend Status */}
          <div className="glass-element inline-block px-6 py-3 rounded-full">
            <span className="text-sm">
              Backend: {
                backendStatus === 'checking' ? '🔄 Checking...' :
                backendStatus === 'connected' ? '✅ Connected' :
                '❌ Disconnected'
              }
            </span>
          </div>
        </div>
        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Panel - Mission Input */}
            <div className="glass-card-primary p-8">
              <h3 className="text-2xl font-semibold mb-6">Define the Mission</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3 opacity-80">
                  What is the panel's mission?
                </label>
                <textarea
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  placeholder="e.g., Develop a go-to-market strategy for our new AI-powered productivity app targeting remote teams..."
                  className="w-full h-32 px-4 py-3 glass-element rounded-lg resize-none text-sm 
                           placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  disabled={isLoading}
                />
                
                {/* Quick Mission Suggestions */}
                <div className="mt-3">
                  <div className="text-xs opacity-60 mb-2">Quick suggestions:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setMission('Help me design a scalable microservices architecture for a real-time collaborative platform')}
                      className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
                    >
                      🏗️ System Architecture
                    </button>
                    <button
                      onClick={() => setMission('Create a comprehensive marketing strategy for launching a new B2B SaaS product')}
                      className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
                    >
                      📈 Marketing Strategy
                    </button>
                    <button
                      onClick={() => setMission('Analyze the pros and cons of different database solutions for a high-traffic e-commerce platform')}
                      className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
                    >
                      🗄️ Database Analysis
                    </button>
                    <button
                      onClick={() => setMission('What are the key considerations for implementing AI ethics in a healthcare application?')}
                      className="text-xs px-3 py-1 glass-element rounded-full hover:bg-opacity-60 transition-all"
                    >
                      🤖 AI Ethics
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Right Panel - Expert Selection */}
            <div className="glass-card-primary p-8">
              <h3 className="text-2xl font-semibold mb-6">Choose Your Experts</h3>
              
              {/* Selected Panelists */}
              <div className="mb-6">
                <div className="text-sm font-medium mb-3 opacity-80">
                  Selected Panelists ({selectedModels.length})
                </div>
                <div className="flex flex-wrap gap-2 min-h-[60px] p-3 glass-element rounded-lg">
                  {selectedModels.map(modelId => {
                    const model = availableModels.find(m => m.id === modelId);
                    const modelInfo = getModelInfo(modelId);
                    const Logo = modelInfo.Logo;
                    return model ? (
                      <div key={modelId} className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full text-sm">
                        <Logo size={16} className={modelInfo.color} />
                        <span>{modelInfo.brandName}</span>
                      </div>
                    ) : null;
                  })}
                  {selectedModels.length === 0 && (
                    <div className="text-sm opacity-50 self-center">
                      Select experts from below
                    </div>
                  )}
                </div>
              </div>
              {/* Available Experts */}
              <div className="mb-6">
                <div className="text-sm font-medium mb-3 opacity-80">
                  Available Experts
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {availableModels.map(model => {
                    const modelInfo = getModelInfo(model.id);
                    const Logo = modelInfo.Logo;
                    return (
                    <div
                      key={model.id}
                      onClick={() => handleModelToggle(model.id)}
                      className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedModels.includes(model.id)
                          ? 'glass-card-secondary border-2 border-blue-300'
                          : 'glass-element hover:bg-opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Logo size={32} className={modelInfo.color} />
                        <div>
                          <div className="font-medium">{modelInfo.brandName}</div>
                          <div className="text-xs opacity-70">{modelInfo.name}</div>
                        </div>
                      </div>
                      <div className="text-sm opacity-80 leading-relaxed">
                        {modelInfo.expertise}
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="text-center mt-8">
            <button
              onClick={handleCreateSession}
              disabled={isLoading || !mission.trim() || selectedModels.length === 0 || backendStatus !== 'connected'}
              className="px-8 py-4 glass-card-secondary rounded-full font-medium text-lg 
                       disabled:opacity-50 disabled:cursor-not-allowed
                       hover:scale-105 transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {isLoading ? '🔄 Creating Session...' : '🚀 Begin Collaborative Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};