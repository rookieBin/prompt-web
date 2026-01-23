import type { AIConfig } from '@/types';
import { chatApi } from '@/api';

export interface AgentResult {
  output: string;
  success: boolean;
  error?: string;
}

export abstract class BaseAgent {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  protected abstract getSystemPrompt(): string;

  async execute(input: string): Promise<AgentResult> {
    try {
      const response = await chatApi.sendMessage(
        [
          { id: 'system', role: 'assistant', content: this.getSystemPrompt(), createdAt: new Date().toISOString() },
          { id: 'user', role: 'user', content: input, createdAt: new Date().toISOString() }
        ],
        this.config
      );

      if (response.code !== 200) {
        return {
          output: '',
          success: false,
          error: response.message
        };
      }

      return {
        output: response.data.content,
        success: true
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '执行失败';
      return {
        output: '',
        success: false,
        error: errorMessage
      };
    }
  }
}
