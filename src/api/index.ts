import type { 
  Prompt, 
  User, 
  AIConfig, 
  Message, 
  ApiResponse, 
  PaginationParams, 
  PaginationResponse 
} from '../types';

// API基础配置 - 方便后续对接后端时修改
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// 请求封装 - 模拟后端接口，后续可以轻松替换为真实API调用
class ApiClient {
  constructor(_baseURL: string) {
    // baseURL 预留给后续真实 API 使用
  }

  // 通用请求方法 - 后续对接后端时只需修改这个方法
  private async request<T>(
    _endpoint: string,
    _options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300));

    // 这里暂时使用localStorage模拟数据
    // 后续对接后端时，可以改为：
    // const response = await fetch(`${this.baseURL}${endpoint}`, {
    //   ...options,
    //   headers: {
    //     'Content-Type': 'application/json',
    //     ...options?.headers,
    //   },
    // });
    // return response.json();

    // 模拟响应
    return {
      code: 200,
      message: 'success',
      data: {} as T,
    };
  }

  // GET请求
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST请求
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT请求
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// 创建API客户端实例（预留给后续真实 API 使用）
void new ApiClient(API_BASE_URL);

// 提示词相关API
export const promptApi = {
  // 获取提示词列表（分页）
  getPrompts: async (params: PaginationParams): Promise<ApiResponse<PaginationResponse<Prompt>>> => {
    // 模拟数据
    const stored = localStorage.getItem('prompts');
    const allPrompts: Prompt[] = stored ? JSON.parse(stored) : getMockPrompts();
    
    const { page, pageSize } = params;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const list = allPrompts.slice(start, end);
    
    return {
      code: 200,
      message: 'success',
      data: {
        list,
        total: allPrompts.length,
        page,
        pageSize,
      },
    };
  },

  // 获取提示词详情
  getPromptById: async (id: string): Promise<ApiResponse<Prompt>> => {
    const stored = localStorage.getItem('prompts');
    const prompts: Prompt[] = stored ? JSON.parse(stored) : getMockPrompts();
    const prompt = prompts.find(p => p.id === id);
    
    if (!prompt) {
      return {
        code: 404,
        message: 'Prompt not found',
        data: {} as Prompt,
      };
    }

    // 增加查看数
    prompt.viewCount += 1;
    localStorage.setItem('prompts', JSON.stringify(prompts));

    return {
      code: 200,
      message: 'success',
      data: prompt,
    };
  },

  // 创建提示词
  createPrompt: async (prompt: Omit<Prompt, 'id' | 'viewCount' | 'favoriteCount' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Prompt>> => {
    const stored = localStorage.getItem('prompts');
    const prompts: Prompt[] = stored ? JSON.parse(stored) : getMockPrompts();
    
    const newPrompt: Prompt = {
      ...prompt,
      id: Date.now().toString(),
      viewCount: 0,
      favoriteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    prompts.unshift(newPrompt);
    localStorage.setItem('prompts', JSON.stringify(prompts));

    return {
      code: 200,
      message: 'success',
      data: newPrompt,
    };
  },

  // 收藏/取消收藏提示词
  toggleFavorite: async (id: string): Promise<ApiResponse<{ favorited: boolean }>> => {
    const stored = localStorage.getItem('prompts');
    const prompts: Prompt[] = stored ? JSON.parse(stored) : getMockPrompts();
    const prompt = prompts.find(p => p.id === id);
    
    if (!prompt) {
      return {
        code: 404,
        message: 'Prompt not found',
        data: { favorited: false },
      };
    }

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const index = favorites.indexOf(id);
    
    if (index > -1) {
      favorites.splice(index, 1);
      prompt.favoriteCount = Math.max(0, prompt.favoriteCount - 1);
    } else {
      favorites.push(id);
      prompt.favoriteCount += 1;
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    localStorage.setItem('prompts', JSON.stringify(prompts));

    return {
      code: 200,
      message: 'success',
      data: { favorited: index === -1 },
    };
  },

  // 检查是否已收藏
  isFavorited: (id: string): boolean => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    return favorites.includes(id);
  },
};

// 用户相关API
export const userApi = {
  // 获取当前用户信息
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const stored = localStorage.getItem('currentUser');
    const user: User = stored ? JSON.parse(stored) : {
      id: '1',
      username: '用户',
      avatar: undefined,
    };

    return {
      code: 200,
      message: 'success',
      data: user,
    };
  },

  // 更新用户信息
  updateUser: async (user: Partial<User>): Promise<ApiResponse<User>> => {
    const stored = localStorage.getItem('currentUser');
    const currentUser: User = stored ? JSON.parse(stored) : {
      id: '1',
      username: '用户',
    };

    const updatedUser = { ...currentUser, ...user };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    return {
      code: 200,
      message: 'success',
      data: updatedUser,
    };
  },
};

// AI配置相关API
export const aiConfigApi = {
  // 获取AI配置
  getConfig: (): AIConfig | null => {
    const stored = localStorage.getItem('aiConfig');
    return stored ? JSON.parse(stored) : null;
  },

  // 保存AI配置
  saveConfig: (config: AIConfig): void => {
    localStorage.setItem('aiConfig', JSON.stringify(config));
  },

  // 获取默认配置
  getDefaultConfig: (): AIConfig => {
    return {
      apiKey: '',
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
    };
  },
};

// AI对话相关API
export const chatApi = {
  // 发送消息 - 对接真实AI API（OpenAI兼容）
  sendMessage: async (messages: Message[], config: AIConfig): Promise<ApiResponse<Message>> => {
    if (!config.apiKey || !config.baseURL) {
      return {
        code: 400,
        message: '请先配置API Key和Base URL',
        data: {} as Message,
      };
    }

    try {
      // 提取系统提示词
      const systemPrompt = messages.find(msg => msg.id === 'system-prompt' || (msg.id === 'system' && msg.role === 'assistant'));
      const systemContent = systemPrompt?.content.replace('系统提示词：\n', '').replace('提示词内容：\n', '').trim() || '';

      // 转换消息格式为OpenAI格式
      const openAIMessages: any[] = [];

      // 如果有系统提示词，添加到消息列表开头
      if (systemContent) {
        openAIMessages.push({
          role: 'system',
          content: systemContent,
        });
      }

      // 处理用户和助手消息
      const conversationMessages = messages
        .filter(msg => {
          // 过滤掉系统提示消息（已经单独处理）
          if (msg.id === 'system' || msg.id === 'system-prompt') {
            return false;
          }
          return true;
        })
        .map(msg => {
          // 检查是否有图片
          const hasImages = msg.images && msg.images.length > 0;
          const isVisionModel = config.model.includes('vision') || config.model.includes('gpt-4');

          if (hasImages && isVisionModel) {
            // Vision模型需要特殊格式
            const content: any[] = [];
            
            // 添加文本内容
            if (msg.content) {
              content.push({
                type: 'text',
                text: msg.content,
              });
            }

            // 添加图片
            msg.images?.forEach(image => {
              const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
              content.push({
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              });
            });

            return {
              role: msg.role,
              content: content,
            };
          } else {
            // 普通文本消息
            return {
              role: msg.role,
              content: msg.content,
            };
          }
        });

      openAIMessages.push(...conversationMessages);

      const requestBody: any = {
        model: config.model,
        messages: openAIMessages,
      };

      if (config.temperature !== undefined) {
        requestBody.temperature = config.temperature;
      }
      if (config.maxTokens !== undefined) {
        requestBody.max_tokens = config.maxTokens;
      }

      const response = await fetch(`${config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.choices[0]?.message?.content || '无响应内容',
        createdAt: new Date().toISOString(),
      };

      return {
        code: 200,
        message: 'success',
        data: aiMessage,
      };
    } catch (error: any) {
      return {
        code: 500,
        message: error.message || 'AI API调用失败',
        data: {} as Message,
      };
    }
  },
};

// 模拟数据生成函数
function getMockPrompts(): Prompt[] {
  const mockPrompts: Prompt[] = [
    {
      id: '1',
      title: '代码审查助手',
      author: '开发者A',
      authorId: 'user1',
      description: '帮助审查代码，找出潜在问题和改进建议',
      content: '你是一个专业的代码审查助手。请仔细审查以下代码，找出潜在的问题、安全漏洞、性能优化点，并提供改进建议。\n\n代码：\n{code}',
      tags: ['编程', '代码审查', '开发'],
      viewCount: 1250,
      favoriteCount: 89,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      title: '产品文案撰写',
      author: '文案师B',
      authorId: 'user2',
      description: '生成吸引人的产品描述和营销文案',
      content: '你是一个专业的产品文案撰写专家。请根据以下产品信息，撰写吸引人的产品描述和营销文案。\n\n产品信息：\n{productInfo}',
      tags: ['文案', '营销', '产品'],
      viewCount: 980,
      favoriteCount: 67,
      createdAt: '2024-01-14T15:30:00Z',
      updatedAt: '2024-01-14T15:30:00Z',
    },
    {
      id: '3',
      title: '技术文档生成',
      author: '技术写作者C',
      authorId: 'user3',
      description: '自动生成清晰、结构化的技术文档',
      content: '你是一个专业的技术文档撰写专家。请根据以下技术信息，生成清晰、结构化的技术文档，包括概述、功能说明、使用示例等。\n\n技术信息：\n{techInfo}',
      tags: ['文档', '技术', '写作'],
      viewCount: 756,
      favoriteCount: 45,
      createdAt: '2024-01-13T09:20:00Z',
      updatedAt: '2024-01-13T09:20:00Z',
    },
    {
      id: '4',
      title: '数据分析报告',
      author: '数据分析师D',
      authorId: 'user4',
      description: '分析数据并生成专业的分析报告',
      content: '你是一个专业的数据分析师。请分析以下数据，生成专业的分析报告，包括数据趋势、关键洞察和建议。\n\n数据：\n{data}',
      tags: ['数据分析', '报告', '商业'],
      viewCount: 634,
      favoriteCount: 52,
      createdAt: '2024-01-12T14:10:00Z',
      updatedAt: '2024-01-12T14:10:00Z',
    },
    {
      id: '5',
      title: '创意写作助手',
      author: '作家E',
      authorId: 'user5',
      description: '帮助创作小说、故事等创意内容',
      content: '你是一个富有创意的写作助手。请根据以下主题或要求，创作引人入胜的故事或文章。\n\n主题：\n{topic}',
      tags: ['写作', '创意', '文学'],
      viewCount: 892,
      favoriteCount: 78,
      createdAt: '2024-01-11T11:45:00Z',
      updatedAt: '2024-01-11T11:45:00Z',
    },
    {
      id: '6',
      title: '邮件撰写助手',
      author: '商务专员F',
      authorId: 'user6',
      description: '帮助撰写专业、得体的商务邮件',
      content: '你是一个专业的商务邮件撰写助手。请根据以下场景和要求，撰写专业、得体的商务邮件。\n\n场景：\n{scenario}',
      tags: ['商务', '邮件', '沟通'],
      viewCount: 1120,
      favoriteCount: 95,
      createdAt: '2024-01-10T09:15:00Z',
      updatedAt: '2024-01-10T09:15:00Z',
    },
    {
      id: '7',
      title: '代码重构建议',
      author: '架构师G',
      authorId: 'user7',
      description: '提供代码重构和优化建议',
      content: '你是一个经验丰富的代码架构师。请分析以下代码，提供重构建议和优化方案。\n\n代码：\n{code}',
      tags: ['编程', '重构', '优化'],
      viewCount: 856,
      favoriteCount: 64,
      createdAt: '2024-01-09T14:20:00Z',
      updatedAt: '2024-01-09T14:20:00Z',
    },
    {
      id: '8',
      title: '社交媒体内容',
      author: '运营H',
      authorId: 'user8',
      description: '生成吸引人的社交媒体内容',
      content: '你是一个专业的社交媒体运营专家。请根据以下主题和目标受众，生成吸引人的社交媒体内容。\n\n主题：\n{topic}',
      tags: ['运营', '社交媒体', '内容'],
      viewCount: 1245,
      favoriteCount: 102,
      createdAt: '2024-01-08T16:30:00Z',
      updatedAt: '2024-01-08T16:30:00Z',
    },
    {
      id: '9',
      title: 'API文档生成',
      author: '后端开发I',
      authorId: 'user9',
      description: '自动生成API接口文档',
      content: '你是一个专业的API文档撰写专家。请根据以下API信息，生成清晰、完整的API文档。\n\nAPI信息：\n{apiInfo}',
      tags: ['API', '文档', '开发'],
      viewCount: 678,
      favoriteCount: 48,
      createdAt: '2024-01-07T10:45:00Z',
      updatedAt: '2024-01-07T10:45:00Z',
    },
    {
      id: '10',
      title: '用户故事撰写',
      author: '产品经理J',
      authorId: 'user10',
      description: '帮助撰写清晰的用户故事',
      content: '你是一个专业的产品经理。请根据以下需求，撰写清晰的用户故事，包括角色、目标、价值。\n\n需求：\n{requirement}',
      tags: ['产品', '用户故事', '需求'],
      viewCount: 934,
      favoriteCount: 71,
      createdAt: '2024-01-06T13:20:00Z',
      updatedAt: '2024-01-06T13:20:00Z',
    },
    {
      id: '11',
      title: '测试用例生成',
      author: '测试工程师K',
      authorId: 'user11',
      description: '自动生成测试用例',
      content: '你是一个专业的测试工程师。请根据以下功能描述，生成全面的测试用例。\n\n功能：\n{feature}',
      tags: ['测试', 'QA', '质量'],
      viewCount: 567,
      favoriteCount: 39,
      createdAt: '2024-01-05T11:10:00Z',
      updatedAt: '2024-01-05T11:10:00Z',
    },
    {
      id: '12',
      title: '数据库设计建议',
      author: 'DBA L',
      authorId: 'user12',
      description: '提供数据库设计和优化建议',
      content: '你是一个资深的数据库管理员。请分析以下需求，提供数据库设计和优化建议。\n\n需求：\n{requirement}',
      tags: ['数据库', '设计', '优化'],
      viewCount: 723,
      favoriteCount: 56,
      createdAt: '2024-01-04T15:30:00Z',
      updatedAt: '2024-01-04T15:30:00Z',
    },
    {
      id: '13',
      title: 'UI/UX设计评审',
      author: '设计师M',
      authorId: 'user13',
      description: '提供UI/UX设计评审和建议',
      content: '你是一个专业的UI/UX设计师。请评审以下设计，提供改进建议和最佳实践。\n\n设计：\n{design}',
      tags: ['设计', 'UI', 'UX'],
      viewCount: 1089,
      favoriteCount: 83,
      createdAt: '2024-01-03T09:25:00Z',
      updatedAt: '2024-01-03T09:25:00Z',
    },
    {
      id: '14',
      title: '性能优化方案',
      author: '性能工程师N',
      authorId: 'user14',
      description: '提供系统性能优化方案',
      content: '你是一个专业的性能优化工程师。请分析以下系统信息，提供性能优化方案。\n\n系统信息：\n{systemInfo}',
      tags: ['性能', '优化', '系统'],
      viewCount: 645,
      favoriteCount: 47,
      createdAt: '2024-01-02T14:15:00Z',
      updatedAt: '2024-01-02T14:15:00Z',
    },
    {
      id: '15',
      title: '安全审计检查',
      author: '安全专家O',
      authorId: 'user15',
      description: '进行安全审计和漏洞检查',
      content: '你是一个专业的安全审计专家。请检查以下代码或系统，识别安全漏洞并提供修复建议。\n\n代码/系统：\n{code}',
      tags: ['安全', '审计', '漏洞'],
      viewCount: 812,
      favoriteCount: 61,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
    },
    {
      id: '16',
      title: '项目计划制定',
      author: '项目经理P',
      authorId: 'user16',
      description: '帮助制定详细的项目计划',
      content: '你是一个经验丰富的项目经理。请根据以下项目信息，制定详细的项目计划和时间表。\n\n项目信息：\n{projectInfo}',
      tags: ['项目管理', '计划', '规划'],
      viewCount: 756,
      favoriteCount: 54,
      createdAt: '2023-12-31T16:40:00Z',
      updatedAt: '2023-12-31T16:40:00Z',
    },
  ];

  // 初始化localStorage - 如果数据数量少于16个，则更新
  const stored = localStorage.getItem('prompts');
  if (!stored || (stored && JSON.parse(stored).length < 16)) {
    localStorage.setItem('prompts', JSON.stringify(mockPrompts));
  }

  return mockPrompts;
}

