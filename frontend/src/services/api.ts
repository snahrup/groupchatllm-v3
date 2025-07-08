import { 
  AvailableModel, 
  CreateSessionRequest, 
  CreateSessionResponse 
} from '../types';

const API_BASE = '/api';

class ApiClient {
  
  async getHealth(): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  async getAvailableModels(): Promise<AvailableModel[]> {
    const response = await fetch(`${API_BASE}/panels/available-models`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const data = await response.json();
    return data.models || [];
  }

  async createSession(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const response = await fetch(`${API_BASE}/chat/sessions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }
    
    return response.json();
  }

}

export const apiClient = new ApiClient();