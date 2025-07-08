import React, { useEffect, useState } from 'react';
import { SynapseConnection } from '../types';

interface SynapseAnimationProps {
  synapses: SynapseConnection[];
  containerRef: React.RefObject<HTMLElement>;
}

export const SynapseAnimation: React.FC<SynapseAnimationProps> = ({ 
  synapses, 
  containerRef 
}) => {
  const [activeSynapses, setActiveSynapses] = useState<SynapseConnection[]>([]);
  
  useEffect(() => {
    // Add new synapses with a fade-in animation
    const newSynapses = synapses.filter(
      synapse => !activeSynapses.some(
        active => active.from === synapse.from && active.to === synapse.to
      )
    );
    
    if (newSynapses.length > 0) {
      setActiveSynapses(prev => [...prev, ...newSynapses]);
      
      // Remove synapse after animation duration
      setTimeout(() => {
        setActiveSynapses(prev => 
          prev.filter(active => 
            !newSynapses.some(
              newSynapse => newSynapse.from === active.from && newSynapse.to === active.to
            )
          )
        );
      }, 3000); // Animation duration: 3 seconds
    }
  }, [synapses, activeSynapses]);
  
  if (activeSynapses.length === 0) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {activeSynapses.map((synapse, index) => (
        <SynapseLine
          key={`${synapse.from}-${synapse.to}-${synapse.timestamp}`}
          synapse={synapse}
          containerRef={containerRef}
          index={index}
        />
      ))}
    </div>
  );
};

interface SynapseLineProps {
  synapse: SynapseConnection;
  containerRef: React.RefObject<HTMLElement>;
  index: number;
}

const SynapseLine: React.FC<SynapseLineProps> = ({ synapse, containerRef, index }) => {
  const [coordinates, setCoordinates] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  
  useEffect(() => {
    // Calculate line coordinates based on message positions
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const fromElement = container.querySelector(`[data-model="${synapse.from}"]`);
    const toElement = container.querySelector(`[data-model="${synapse.to}"]`);
    
    if (fromElement && toElement) {
      const containerRect = container.getBoundingClientRect();
      const fromRect = fromElement.getBoundingClientRect();
      const toRect = toElement.getBoundingClientRect();
      
      setCoordinates({
        x1: fromRect.right - containerRect.left,
        y1: fromRect.top + fromRect.height / 2 - containerRect.top,
        x2: toRect.left - containerRect.left,
        y2: toRect.top + toRect.height / 2 - containerRect.top,
      });
    }
  }, [synapse, containerRef]);
  
  if (!coordinates) return null;
  
  const { x1, y1, x2, y2 } = coordinates;
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 10 + index }}
    >
      {/* Glow effect */}
      <defs>
        <filter id={`glow-${index}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#667eea" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#764ba2" stopOpacity="1" />
          <stop offset="100%" stopColor="#f093fb" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Connection line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={`url(#gradient-${index})`}
        strokeWidth="3"
        filter={`url(#glow-${index})`}
        className="animate-pulse"
        style={{
          animation: 'synapse-draw 1s ease-out forwards, synapse-fade 3s ease-out forwards'
        }}
      />
      
      {/* Animated particles along the line */}
      <circle
        r="4"
        fill="#ffffff"
        className="animate-ping"
        style={{
          animation: `synapse-travel-${index} 2s linear infinite`
        }}
      >
        <animateMotion
          dur="2s"
          repeatCount="1"
          path={`M ${x1} ${y1} L ${x2} ${y2}`}
        />
      </circle>
      
      {/* Connection indicator at target */}
      <circle
        cx={x2}
        cy={y2}
        r="8"
        fill="rgba(118, 75, 162, 0.3)"
        stroke="#764ba2"
        strokeWidth="2"
        className="animate-ping"
        style={{
          animation: 'synapse-pulse 1s ease-out 1s forwards'
        }}
      />
    </svg>
  );
};

// Add the required CSS animations to the component's style
const synapseStyles = `
  @keyframes synapse-draw {
    from {
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
    }
    to {
      stroke-dasharray: 1000;
      stroke-dashoffset: 0;
    }
  }
  
  @keyframes synapse-fade {
    0%, 70% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  
  @keyframes synapse-pulse {
    from {
      r: 8;
      opacity: 0.8;
    }
    to {
      r: 20;
      opacity: 0;
    }
  }
`;

// Inject styles if not already present
if (typeof window !== 'undefined' && !document.getElementById('synapse-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'synapse-styles';
  styleElement.textContent = synapseStyles;
  document.head.appendChild(styleElement);
}
