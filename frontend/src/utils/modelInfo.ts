import { OpenAILogo, ClaudeLogo, GeminiLogo } from '../components/logos/ModelLogos';

export interface ModelInfo {
  name: string;
  brandName: string;
  provider: string;
  color: string;
  bgGradient: string;
  expertise: string;
  Logo: React.FC<{ className?: string; size?: number }>;
}

// Map of model identifiers to their brand information
const modelBrandMap: Record<string, ModelInfo> = {
  // OpenAI Models
  'gpt-4o': {
    name: 'ChatGPT 4',
    brandName: 'ChatGPT',
    provider: 'OpenAI',
    color: 'text-teal-600',
    bgGradient: 'from-teal-500 to-cyan-600',
    expertise: 'Strategic Planning & Analysis',
    Logo: OpenAILogo
  },
  'gpt-4': {
    name: 'ChatGPT 4',
    brandName: 'ChatGPT',
    provider: 'OpenAI',
    color: 'text-teal-600',
    bgGradient: 'from-teal-600 to-cyan-700',
    expertise: 'System Architecture & Design',
    Logo: OpenAILogo
  },
  
  // Anthropic Models
  'claude-3.5': {
    name: 'Claude 3.5 Sonnet',
    brandName: 'Claude',
    provider: 'Anthropic',
    color: 'text-orange-600',
    bgGradient: 'from-orange-500 to-amber-600',
    expertise: 'Creative Innovation & Synthesis',
    Logo: ClaudeLogo
  },
  'claude-3': {
    name: 'Claude 3',
    brandName: 'Claude',
    provider: 'Anthropic',
    color: 'text-orange-600',
    bgGradient: 'from-amber-600 to-orange-700',
    expertise: 'Idea Integration & Synthesis',
    Logo: ClaudeLogo
  },
  
  // Google Models
  'gemini-1.5': {
    name: 'Gemini 1.5 Pro',
    brandName: 'Gemini',
    provider: 'Google',
    color: 'text-blue-600',
    bgGradient: 'from-blue-500 to-indigo-600',
    expertise: 'Data Analysis & Research',
    Logo: GeminiLogo
  },
  'gemini-2.0': {
    name: 'Gemini 2.0',
    brandName: 'Gemini',
    provider: 'Google',
    color: 'text-blue-600',
    bgGradient: 'from-indigo-500 to-purple-600',
    expertise: 'Innovation & Discovery',
    Logo: GeminiLogo
  }
};

// Function to get model info from either UUID or friendly name
export const getModelInfo = (modelId: string): ModelInfo => {
  // First check if it's a direct match
  if (modelBrandMap[modelId]) {
    return modelBrandMap[modelId];
  }
  
  // Check if the UUID contains any known model identifier
  const modelIdLower = modelId.toLowerCase();
  for (const [key, info] of Object.entries(modelBrandMap)) {
    if (modelIdLower.includes(key) || key.includes(modelIdLower)) {
      return info;
    }
  }
  
  // Default fallback
  return {
    name: 'AI Assistant',
    brandName: 'AI Model',
    provider: 'Unknown',
    color: 'text-gray-600',
    bgGradient: 'from-gray-500 to-gray-600',
    expertise: 'Collaborative Intelligence',
    Logo: OpenAILogo // Default to OpenAI logo
  };
};

// Helper function to get just the brand name
export const getModelBrandName = (modelId: string): string => {
  return getModelInfo(modelId).brandName;
};

// Helper function to get the model's color
export const getModelColor = (modelId: string): string => {
  return getModelInfo(modelId).color;
};

// Helper function to get the background gradient
export const getModelGradient = (modelId: string): string => {
  return getModelInfo(modelId).bgGradient;
};
