// Type definitions for GroupChatLLM v3
export interface AvailableModel {
  id: string;           // "gpt-4o", "claude-3.5", etc.
  provider: string;     // "openai", "anthropic", "google"
  model_name: string;   // Actual model identifier
  role: string;         // "The Strategist", "The Creative", etc.
  icon: string;         // "🧠", "🎭", "🔬"
  description: string;  // Model's prompt prefix
  collaboration_style: string;
  color_theme: string;  // For glassmorphic styling
}

export interface CreateSessionRequest {
  mission: string;
  selected_models?: string[];  // Legacy format
  panelists?: Array<{        // New format
    model_id: string;
    persona_id?: string;
    custom_persona?: CustomPersona;
  }>;
}

export interface CustomPersona {
  role: string;
  icon: string;
  prompt_prefix: string;
  collaboration_style: string;
  color_theme: string;
  provider: string;
  model_name: string;
}

export interface CreateSessionResponse {
  session_id: string;
  panelists: Array<{
    id: string;
    role: string;
    icon: string;
    model: string;
  }>;
}

export interface ResponseData {
  model: string;        // Model source identifier
  content: string;      // Streaming text chunk
  type: MessageType;    // "response", "synthesis", "analysis", "system"
  complete: boolean;    // Is this model done?
  synapse?: {          // Collaboration detected!
    detected: boolean;
    building_on: string;  // Message ID being built upon
    type: string;         // "building", "synthesis", etc.
    strength?: number;    // 0-1 strength score
  };
  metadata?: any;
}

export type MessageType = "response" | "synthesis" | "analysis" | "system";

export type ModelState = "thinking" | "responding" | "complete" | "error" | "standby";

export interface StreamingMessage {
  id: string;
  model: string;
  content: string;
  isComplete: boolean;
  synapseConnection?: string;
  timestamp: number;
  type: MessageType;
}

export interface SynapseConnection {
  from: string;
  to: string;
  type: string;
  strength?: number;
  timestamp: number;
}

export interface CollaborationStats {
  total_messages: number;
  total_synapses: number;
  collaboration_score?: number;
}

// SSE Event types
export type SSEEvent = 
  | { event: 'connected', data: { session_id: string, message: string } }
  | { event: 'response', data: ResponseData }
  | { event: 'model_complete', data: { model: string, timestamp: string } }
  | { event: 'all_complete', data: { session_id: string, stats: CollaborationStats } }
  | { event: 'error', data: { error: string, session_id: string } };

export interface SessionState {
  sessionId: string | null;
  isActive: boolean;
  panelists: Array<{
    id: string;
    role: string;
    icon: string;
    model: string;
    color_theme: string;
  }>;
  mission: string;
}