// 提示词相关类型
export interface Prompt {
  id: string;
  title: string;
  author: string;
  authorId: string;
  description: string;
  content: string;
  tags: string[];
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  updatedAt: string;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  avatar?: string;
  email?: string;
}

// AI配置类型
export interface AIConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  difyApiKey?: string;
}

// 消息类型（用于AI对话）
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // base64图片或URL
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size?: number;
  }>;
  createdAt: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 分页类型
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

