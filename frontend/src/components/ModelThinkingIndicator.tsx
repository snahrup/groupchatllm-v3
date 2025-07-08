import React from 'react';
import { ModelState } from '../types';
import { getModelInfo, getModelBrandName, getModelColor } from '../utils/modelInfo';

interface ModelThinkingIndicatorProps {
  model: string;
  state: ModelState;
}

export const ModelThinkingIndicator: React.FC<ModelThinkingIndicatorProps> = ({
  model,
  state
}) => {
  if (state !== 'thinking') return null;
  
  const modelInfo = getModelInfo(model);
  const Logo = modelInfo.Logo;
  
  return (
    <div 
      className="flex justify-start mb-4"
      data-model={model}
    >
      <div className="max-w-[80%] p-4 glass-element rounded-lg border border-purple-300/30">
        <div className="flex items-center gap-3">
          <Logo size={24} className={getModelColor(model)} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{getModelBrandName(model)}</span>
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
