import { chatApi } from '@/api';
import type { AIConfig } from '@/types';
import type { Message } from '@/types';
import type { InteractiveRequest } from '../types';

interface InteractiveAgentResponse {
  stage: 'need_form' | 'final_prompt';
  form?: {
    title: string;
    description: string;
    fields: Array<{
      type: 'single' | 'multiple' | 'text';
      label: string;
      name: string;
      options?: string[];
      required?: boolean;
    }>;
  };
  optimized_prompt?: string;
}

export class InteractiveAgent {
  private config: AIConfig;
  private conversationHistory: Message[];

  constructor(config: AIConfig) {
    this.config = config;
    this.conversationHistory = [];
  }

  // 重置对话历史（用于新的会话）
  resetHistory(): void {
    this.conversationHistory = [];
  }

  // 添加对话记录
  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({ 
      role, 
      content,
      id: `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString()
    });
  }

  async execute(input: string, formAnswer?: Record<string, any>): Promise<{
    success: boolean;
    output?: string;
    request?: InteractiveRequest;
    error?: string;
  }> {
    try {
      // 构建包含历史对话的用户提示
      const contextPrompt = this.buildContextPrompt(input, formAnswer);
      
      // 添加用户输入到历史
      this.addToHistory('user', contextPrompt);

      const response = await chatApi.sendMessage(
        [
          { id: 'system', role: 'assistant', content: '你是一个专业的提示词优化助手。', createdAt: new Date().toISOString() },
          // 包含完整的对话历史
          ...this.conversationHistory.slice(0, -1), // 排除刚刚添加的用户消息
          { id: 'current-user', role: 'user', content: contextPrompt, createdAt: new Date().toISOString() },
        ],
        this.config
      );

      if (response.code !== 200) {
        throw new Error(response.message || '请求失败');
      }

      // 添加 AI 响应到历史
      this.addToHistory('assistant', response.data.content);

      // 尝试解析 AI 返回的 JSON
      let aiResponse: InteractiveAgentResponse;
      try {
        // 清理可能的 markdown 代码块标记
        const cleanedContent = response.data.content
          .replace(/```json\s*/g, '')
          .replace(/```\s*$/g, '')
          .trim();
        
        aiResponse = JSON.parse(cleanedContent);
      } catch (parseError) {
        // 如果解析失败，可能是直接返回了优化后的提示词
        return {
          success: true,
          output: response.data.content,
        };
      }

      if (aiResponse.stage === 'need_form' && aiResponse.form) {
        // 需要用户填写表单
        const request: InteractiveRequest = {
          message: aiResponse.form.title,
          title: aiResponse.form.title,
          description: aiResponse.form.description,
          form: aiResponse.form,
          fields: [], // 使用旧版格式
        };

        return {
          success: true,
          request,
        };
      } else if (aiResponse.stage === 'final_prompt' && aiResponse.optimized_prompt) {
        // 直接返回优化后的提示词
        return {
          success: true,
          output: aiResponse.optimized_prompt,
        };
      } else {
        throw new Error('AI 返回的格式不正确');
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  // 构建包含历史上下文的提示
  private buildContextPrompt(input: string, formAnswer?: Record<string, any>): string {
    const systemPrompt = `你是一个"提示词优化 Agent"，专门帮助用户把原始 Prompt 优化为高质量、可直接用于大模型的 Prompt。

你的工作流程必须严格遵循以下规则：

一、你不能直接向用户提问。
二、如果你认为还需要额外信息，必须输出【表单描述 JSON】，由前端来渲染并向用户收集。
三、当信息足够时，直接输出最终优化后的 Prompt。

四、你必须在每一轮输出中明确指定当前阶段：
- stage = "need_form" 表示需要用户补充信息
- stage = "final_prompt" 表示信息已足够，输出最终 Prompt

五、当 stage = "need_form" 时，返回以下 JSON 结构（不能输出任何多余文本）：

{
  "stage": "need_form",
  "form": {
    "title": "表单标题",
    "description": "为什么需要这些信息",
    "fields": [
      {
        "type": "single" | "multiple" | "text",
        "label": "字段展示名称",
        "name": "字段唯一 key",
        "options": ["选项1", "选项2"],
        "required": true
      }
    ]
  }
}

六、当 stage = "final_prompt" 时，返回：

{
  "stage": "final_prompt",
  "optimized_prompt": "最终优化后的 Prompt 文本"
}

七、你要像一个资深前端工程师 + Prompt Engineer 一样思考，优先询问：
- 使用场景
- 输出形式
- 受众
- 约束条件
- 语气 / 风格

八、重要：请记住之前的对话历史，避免重复询问用户已经提供过的信息。

原始提示词：
{{raw_prompt}}

如果存在用户补充信息（JSON）：
{{form_answer}}`;

    return systemPrompt
      .replace('{{raw_prompt}}', input)
      .replace('{{form_answer}}', formAnswer ? JSON.stringify(formAnswer, null, 2) : '无');
  }
}
