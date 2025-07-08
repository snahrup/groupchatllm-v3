import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

// OpenAI Logo (ChatGPT)
export const OpenAILogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
  </svg>
);

// Claude (Anthropic) Logo
export const ClaudeLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.89 17.668l2.758-13.497h1.654l-3.68 17.12c-.28 1.303-.888 2.295-1.825 2.977-.922.667-2.045 1-3.37 1-1.339 0-2.4-.341-3.184-1.024-.768-.682-1.153-1.596-1.153-2.742 0-.378.056-.764.168-1.157l.048-.168L6.547 20.154c-.402 1.12-.975 1.955-1.718 2.508-.728.537-1.611.806-2.65.806-.67 0-1.262-.134-1.776-.402C.134 22.903 0 22.625 0 22.264c0-.214.044-.421.131-.621.103-.216.252-.324.448-.324.18 0 .324.048.43.145.123.096.26.144.415.144.324 0 .616-.152.875-.455.26-.319.479-.783.659-1.393l3.657-13.13h1.627l-2.531 9.895c-.131.506-.196.923-.196 1.25 0 .537.159.95.478 1.24.334.29.806.434 1.417.434.69 0 1.282-.242 1.775-.726.494-.499.854-1.225 1.08-2.178L12.11 4.17h1.675L11.42 12.6l-.048.168c-.112.425-.168.81-.168 1.157 0 .915.32 1.628.96 2.14.64.497 1.532.746 2.677.746.658 0 1.246-.2 1.764-.598.533-.415.925-1.016 1.176-1.802l.108-.743z"/>
  </svg>
);

// Google Gemini Logo
export const GeminiLogo: React.FC<LogoProps> = ({ className = "", size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <defs>
      <linearGradient id="gemini-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4285F4" />
        <stop offset="100%" stopColor="#1A73E8" />
      </linearGradient>
      <linearGradient id="gemini-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#34A853" />
        <stop offset="100%" stopColor="#0D8043" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="7" r="5" fill="url(#gemini-gradient-1)" />
    <circle cx="12" cy="17" r="5" fill="url(#gemini-gradient-2)" />
    <rect x="7" y="7" width="10" height="10" fill="white" opacity="0.3" />
  </svg>
);

// Model Info with proper names and colors
export const MODEL_INFO = {
  'gpt-4o': {
    name: 'ChatGPT-4o',
    fullName: 'OpenAI ChatGPT-4 Optimized',
    logo: OpenAILogo,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    borderColor: 'border-green-500',
    expertise: 'Strategic Planning & Analysis',
    personality: 'The Strategist'
  },
  'gpt-4': {
    name: 'ChatGPT-4',
    fullName: 'OpenAI ChatGPT-4',
    logo: OpenAILogo,
    color: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-500',
    textColor: 'text-teal-600',
    borderColor: 'border-teal-500',
    expertise: 'System Architecture & Design',
    personality: 'The Architect'
  },
  'claude-3.5': {
    name: 'Claude 3.5',
    fullName: 'Anthropic Claude 3.5 Sonnet',
    logo: ClaudeLogo,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-500',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-500',
    expertise: 'Creative Innovation & Ideas',
    personality: 'The Creative'
  },
  'claude-3': {
    name: 'Claude 3',
    fullName: 'Anthropic Claude 3 Opus',
    logo: ClaudeLogo,
    color: 'from-amber-600 to-orange-700',
    bgColor: 'bg-amber-600',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-600',
    expertise: 'Synthesis & Integration',
    personality: 'The Synthesizer'
  },
  'gemini-1.5': {
    name: 'Gemini 1.5',
    fullName: 'Google Gemini 1.5 Pro',
    logo: GeminiLogo,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    expertise: 'Data Analysis & Research',
    personality: 'The Analyst'
  },
  'gemini-2.0': {
    name: 'Gemini 2.0',
    fullName: 'Google Gemini 2.0 Ultra',
    logo: GeminiLogo,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-500',
    expertise: 'Innovation & Discovery',
    personality: 'The Explorer'
  }
};

// Helper function to get model info (handles UUIDs)
export const getModelInfo = (modelId: string) => {
  // Check if it's a direct match
  if (MODEL_INFO[modelId as keyof typeof MODEL_INFO]) {
    return MODEL_INFO[modelId as keyof typeof MODEL_INFO];
  }

  // Try to find a match by checking if the modelId contains any of our known model keys
  const modelKey = Object.keys(MODEL_INFO).find(key => 
    modelId.toLowerCase().includes(key) || key.includes(modelId.toLowerCase())
  );

  if (modelKey) {
    return MODEL_INFO[modelKey as keyof typeof MODEL_INFO];
  }

  // Fallback for unknown models (likely UUIDs)
  return {
    name: `AI Model`,
    fullName: `AI Model ${modelId.slice(0, 8)}`,
    logo: OpenAILogo, // Default to OpenAI logo
    color: 'from-gray-500 to-gray-600',
    bgColor: 'bg-gray-500',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-500',
    expertise: 'Collaborative Intelligence',
    personality: 'The Collaborator'
  };
};

export type ModelInfoType = ReturnType<typeof getModelInfo>;

// Export a function to get model logo by key
export const getModelLogo = (modelKey: string) => {
  const info = getModelInfo(modelKey);
  return info.logo;
<<<<<<< HEAD
};
=======
};
>>>>>>> 2c0b36048df983f7ddc9b5347e47c846cf1dbed3
