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

// ========== 提示词工坊相关类型 ==========

// 分类颜色类型
export type CategoryColor = 'blue' | 'amber' | 'rose' | 'emerald' | 'violet' | 'slate';

// 词库分类
export interface Category {
  id: string;
  label: string;
  color: CategoryColor;
}

// 词库
export interface Bank {
  key: string;           // 变量名，如 "role"
  label: string;         // 显示名称，如 "角色"
  category: string;      // 分类ID
  options: string[];     // 选项列表
}

// 工坊模板
export interface WorkshopTemplate {
  id: string;
  name: string;
  content: string;                      // 包含 {{variable}} 的模板内容
  selections: Record<string, string>;   // 变量选择值，key为 "变量名-索引"
  createdAt: string;
  updatedAt: string;
}

// 分类样式配置
export interface CategoryStyle {
  text: string;        // 文字颜色类
  bg: string;          // 背景色类
  border: string;      // 边框色类
  hoverBg: string;     // 悬停背景类
  lightBg: string;     // 浅色背景
  darkBg: string;      // 深色背景（暗色模式）
  darkText: string;    // 深色模式文字
}
