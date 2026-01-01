// Grok API Client Setup for TenderSwarm agents

interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GrokCompletionOptions {
  model?: string;
  messages: GrokMessage[];
  temperature?: number;
  max_tokens?: number;
}

class GrokClient {
  private apiKey: string;
  private baseURL: string = 'https://api.x.ai/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROK_API_KEY || '';
  }

  async chat(options: GrokCompletionOptions) {
    const {
      model = 'grok-4',
      messages,
      temperature = 0.7,
      max_tokens = 1000,
    } = options;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error calling Grok API:', error);
      throw error;
    }
  }

  async getCompletion(prompt: string, systemPrompt?: string) {
    const messages: GrokMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.chat({ messages });
    return response.choices[0].message.content;
  }
}

// Export singleton instance
export const grok = new GrokClient();

// Export helper function for quick completions
export const getGrokCompletion = async (prompt: string, systemPrompt?: string) => {
  const response = await fetch('/api/grok', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      systemPrompt,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'API error');
  }

  const data = await response.json();
  return data.completion;
};
