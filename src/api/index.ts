import type {
  Prompt,
  User,
  AIConfig,
  Message,
  ApiResponse,
  PaginationParams,
  PaginationResponse
} from '../types';

// API基础配置 - 对接后端服务
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tydv68t36mddd-app.prod2.defang.dev';

// 请求封装 - 对接真实后端API
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // 获取存储的token（如果有）
    const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    if (token) {
      (defaultHeaders as any)['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options?.headers,
        },
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 401) {
        const isAuthEndpoint = endpoint.startsWith('/api/auth/login') || endpoint.startsWith('/api/auth/register');
        if (!isAuthEndpoint) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('authToken');
          localStorage.removeItem('authUser');
          const redirect = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?redirect=${redirect}`;
        }
      }

      if (!response.ok) {
        if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
          return {
            ...data,
            code: response.status,
          } as ApiResponse<T>;
        }

        return {
          code: response.status,
          message: data?.message || `HTTP ${response.status}: ${response.statusText}`,
          data: (data?.data ?? ({} as T)) as T,
        };
      }

      return data as ApiResponse<T>;
    } catch (error: any) {
      return {
        code: 500,
        message: error.message || '网络请求失败',
        data: {} as T,
      };
    }
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

// 创建API客户端实例
const apiClient = new ApiClient(API_BASE_URL);

export const authApi = {
  register: async (payload: { username: string; email: string; password: string }): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    return apiClient.post<{ accessToken: string; user: User }>('/api/auth/register', payload);
  },

  login: async (payload: { email: string; password: string }): Promise<ApiResponse<{ accessToken: string; user: User }>> => {
    return apiClient.post<{ accessToken: string; user: User }>('/api/auth/login', payload);
  },
};

// 提示词相关API
export const promptApi = {
  // 获取提示词列表（分页）
  getPrompts: async (params: PaginationParams): Promise<ApiResponse<PaginationResponse<Prompt>>> => {
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('pageSize', params.pageSize.toString());
    if (params.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    if (params.keyword) {
      queryParams.append('keyword', params.keyword);
    }

    return apiClient.get<PaginationResponse<Prompt>>(`/api/prompts?${queryParams.toString()}`);
  },

  // 获取推荐提示词
  getRecommendedPrompts: async (): Promise<ApiResponse<Prompt[]>> => {
    return apiClient.get<Prompt[]>('/api/prompts/recommended');
  },

  // 获取热门提示词
  getHotPrompts: async (): Promise<ApiResponse<Prompt[]>> => {
    return apiClient.get<Prompt[]>('/api/prompts/hot');
  },

  // 获取提示词详情
  getPromptById: async (id: string): Promise<ApiResponse<Prompt>> => {
    return apiClient.get<Prompt>(`/api/prompts/${id}`);
  },

  // 创建提示词
  createPrompt: async (prompt: Omit<Prompt, 'id' | 'viewCount' | 'favoriteCount' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Prompt>> => {
    return apiClient.post<Prompt>('/api/prompts', prompt);
  },

  // 收藏/取消收藏提示词
  toggleFavorite: async (id: string): Promise<ApiResponse<{ favorited: boolean }>> => {
    return apiClient.post<{ favorited: boolean }>(`/api/prompts/${id}/favorite`);
  },

  // 获取我创建的提示词
  getMyPrompts: async (userId: string): Promise<ApiResponse<Prompt[]>> => {
    return apiClient.get<Prompt[]>(`/api/prompts?authorId=${userId}`);
  },

  // 更新提示词
  updatePrompt: async (id: string, data: Partial<Prompt>): Promise<ApiResponse<Prompt>> => {
    return apiClient.put<Prompt>(`/api/prompts/${id}`, data);
  },

  // 删除提示词
  deletePrompt: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(`/api/prompts/${id}`);
  },
};

// 用户相关API
export const userApi = {
  // 获取当前用户信息
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return apiClient.get<User>('/api/user/current');
  },

  // 更新用户信息
  updateUser: async (user: Partial<User>): Promise<ApiResponse<User>> => {
    return apiClient.put<User>('/api/user/current', user);
  },

  // 获取用户收藏列表
  getFavorites: async (): Promise<ApiResponse<Prompt[]>> => {
    return apiClient.get<Prompt[]>('/api/user/favorites');
  },
};

// AI配置相关API
export const aiConfigApi = {
  // 获取当前AI配置
  getConfig: async (): Promise<ApiResponse<AIConfig>> => {
    return apiClient.get<AIConfig>('/api/ai-config');
  },

  // 保存AI配置
  saveConfig: async (config: AIConfig): Promise<ApiResponse<AIConfig>> => {
    return apiClient.put<AIConfig>('/api/ai-config', config);
  },

  // 获取默认配置模板
  getDefaultConfig: (): Omit<AIConfig, 'id' | 'createdAt'> => {
    return {
      name: '默认配置',
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
  // 发送消息 - 通过后端接口调用AI服务
  sendMessage: async (messages: Message[], config: AIConfig): Promise<ApiResponse<Message>> => {
    return apiClient.post<Message>('/api/chat/send', {
      messages,
      config,
    });
  },
};

// 提示词优化相关API
export const promptOptimizeApi = {
  // 优化提示词
  optimizePrompt: async (prompt: string): Promise<ApiResponse<{ optimizedPrompt: string }>> => {
    return apiClient.post<{ optimizedPrompt: string }>('/api/prompt-optimize', { prompt });
  },
};

// 工坊相关API
export const workshopApi = {
  // 获取模板列表
  getTemplates: async (): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>('/api/workshop/templates');
  },

  // 创建模板
  createTemplate: async (template: any): Promise<ApiResponse<any>> => {
    return apiClient.post<any>('/api/workshop/templates', template);
  },

  // 更新模板
  updateTemplate: async (id: string, template: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/api/workshop/templates/${id}`, template);
  },

  // 删除模板
  deleteTemplate: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<null>(`/api/workshop/templates/${id}`);
  },

  // 获取词库列表
  getBanks: async (): Promise<ApiResponse<any[]>> => {
    return apiClient.get<any[]>('/api/workshop/banks');
  },

  // 更新词库
  updateBank: async (key: string, bank: any): Promise<ApiResponse<any>> => {
    return apiClient.put<any>(`/api/workshop/banks/${key}`, bank);
  },

  // 获取分类列表
  getCategories: async (): Promise<ApiResponse<string[]>> => {
    return apiClient.get<string[]>('/api/workshop/categories');
  },
};
