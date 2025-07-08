import React from 'react';
import { ModelState } from '../types';

interface ModelThinkingIndicatorProps {
  model: string;
  state: ModelState;
  getModelIcon: (model: string) => string;
  getModelName: (model: string) => string;
}

export const ModelThinkingIndicator: React.FC<ModelThinkingIndicatorProps> = ({
  model,
  state,
  getModelIcon,
  getModelName
}) => {
  if (state !== 'thinking') return null;
  
  return (
    <div 
      className="flex justify-start mb-4"
      data-model={model}
    >
      <div className="max-w-[80%] p-4 glass-element rounded-lg border border-purple-300/30">
        <div className="flex items-center gap-3">
          <span className="text-xl">{getModelIcon(model)}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{getModelName(model)}</span>
              <span className="text-xs opacity-60">is thinking...</span>
            </div>
            <div className="flex gap-1">
              <div 
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              />
              <div 
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              />
              <div 
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
