import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterTextProps {
  text: string;
  speed: number; // characters per second
  onComplete?: () => void;
  className?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed, 
  onComplete, 
  className = "" 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 1000 / speed); // Convert speed (chars/sec) to delay (ms)

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete) {
      // Small delay before calling onComplete to feel more natural
      const completeTimer = setTimeout(onComplete, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <div className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="text-blue-300"
        >
          |
        </motion.span>
      )}
    </div>
  );
};

interface MessageQueueItem {
  id: string;
  type: 'user' | 'ai';
  content: string;
  model?: string;
  timestamp: number;
}

interface TypewriterMessageQueueProps {
  messages: MessageQueueItem[];
  speed: 'slow' | 'normal' | 'fast';
  isPaused: boolean;
  getModelInfo: (model: string) => any;
  onQueueComplete?: () => void;
}

export const TypewriterMessageQueue: React.FC<TypewriterMessageQueueProps> = ({
  messages,
  speed,
  isPaused,
  getModelInfo,
  onQueueComplete
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedMessages, setDisplayedMessages] = useState<MessageQueueItem[]>([]);

  // Speed settings in characters per second
  const speedSettings = {
    slow: 2,    // Very slow, deliberate pace
    normal: 5,  // Comfortable reading pace  
    fast: 12    // Quick but still readable
  };

  const currentSpeed = speedSettings[speed];

  const handleMessageComplete = () => {
    if (currentMessageIndex < messages.length - 1) {
      // Add delay between messages based on speed
      const delayBetweenMessages = speed === 'slow' ? 2000 : speed === 'normal' ? 1000 : 500;
      
      setTimeout(() => {
        if (!isPaused) {
          setCurrentMessageIndex(prev => prev + 1);
        }
      }, delayBetweenMessages);
    } else if (onQueueComplete) {
      onQueueComplete();
    }
  };

  // Reset when messages change or when unpaused
  useEffect(() => {
    if (messages.length > displayedMessages.length) {
      // New messages added, continue from where we left off
      setCurrentMessageIndex(displayedMessages.length);
    }
  }, [messages, displayedMessages.length]);

  // Handle pause/resume
  useEffect(() => {
    if (isPaused) {
      // When paused, don't advance
      return;
    }
  }, [isPaused]);

  // Build the list of messages to display (completed + current)
  const messagesToDisplay = messages.slice(0, currentMessageIndex + 1);
  const currentMessage = messages[currentMessageIndex];

  return (
    <div className="space-y-6">
      {/* Completed Messages */}
      {messagesToDisplay.slice(0, -1).map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[80%] p-4 rounded-2xl ${
            message.type === 'user' 
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30' 
              : 'glass-card'
          }`}>
            {message.type === 'ai' && message.model && (
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getModelInfo(message.model).color} 
                               flex items-center justify-center text-lg`}>
                  {getModelInfo(message.model).icon}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {getModelInfo(message.model).name}
                  </div>
                  <div className="text-xs text-white/60">
                    {getModelInfo(message.model).expertise}
                  </div>
                </div>
              </div>
            )}
            <div className="text-white leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
            <div className="text-xs text-white/40 mt-2">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Current Typing Message */}
      {currentMessage && currentMessageIndex < messages.length && !isPaused && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex ${currentMessage.type === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[80%] p-4 rounded-2xl ${
            currentMessage.type === 'user' 
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30' 
              : 'glass-card border border-blue-400/20'
          }`}>
            {currentMessage.type === 'ai' && currentMessage.model && (
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${getModelInfo(currentMessage.model).color} 
                               flex items-center justify-center text-lg`}>
                  {getModelInfo(currentMessage.model).icon}
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {getModelInfo(currentMessage.model).name}
                  </div>
                  <div className="text-xs text-blue-300 flex items-center gap-1">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                    />
                    Speaking...
                  </div>
                </div>
              </div>
            )}
            <TypewriterText
              text={currentMessage.content}
              speed={currentSpeed}
              onComplete={handleMessageComplete}
              className="text-white leading-relaxed whitespace-pre-wrap"
            />
            <div className="text-xs text-white/40 mt-2">
              {new Date(currentMessage.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Paused Indicator */}
      {isPaused && currentMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <div className="glass-card px-4 py-2 rounded-full">
            <div className="flex items-center gap-2 text-yellow-300 text-sm">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Conversation paused
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};