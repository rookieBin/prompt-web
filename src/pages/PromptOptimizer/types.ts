// Agent 状态类型
export type AgentState = 'idle' | 'running' | 'completed' | 'failed';

// Agent 类型
export type AgentType = 'architect' | 'redteamer' | 'judge' | 'adapter';

// 编排节点类型（扩展：支持新增节点）
export type WorkflowNodeType =
  | 'start'
  | AgentType
  | 'prompt_shorten'
  | 'prompt_expand'
  | 'style_formal'
  | 'style_casual'
  | 'interactive';

export interface WorkflowNodeData {
  type: WorkflowNodeType;
  label: string;
  config: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    [key: string]: unknown;
  };
}

export interface WorkflowEdgeSnapshot {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowNodeSnapshot {
  id: string;
  data: WorkflowNodeData;
}

export interface WorkflowSnapshot {
  nodes: WorkflowNodeSnapshot[];
  edges: WorkflowEdgeSnapshot[];
}

// Agent 信息
export interface Agent {
  id: AgentType;
  name: string;
  description: string;
  icon: string;
  state: AgentState;
  output?: string;
}

// 工作流步骤
export interface WorkflowStep {
  agent: AgentType;
  input: string;
  output?: string;
  timestamp: number;
  duration?: number;
}

// 评分维度
export interface ScoreDimension {
  name: string;
  score: number;
  maxScore: number;
}

// Judge 评分结果
export interface JudgeScore {
  total: number;
  dimensions: ScoreDimension[];
  feedback: string;
  passed: boolean;
}

// 协作日志
export interface ConsoleLog {
  id: string;
  agent: string;
  message: string;
  timestamp: number;
  type: 'info' | 'warning' | 'success' | 'error';
}

// 工作流状态
export interface WorkflowState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  currentAgent: AgentType | null;
  agents: Agent[];
  logs: ConsoleLog[];
  steps: WorkflowStep[];
  finalOutput?: string;
  score?: JudgeScore;
  iterations: number;
  maxIterations: number;
}

// 多轮表单优化节点表单字段
export interface InteractiveFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'single' | 'multiple';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// 多轮表单优化节点请求（兼容旧版表单格式）
export interface InteractiveRequest {
  message: string;
  fields: InteractiveFormField[];
  // 兼容旧版格式
  title?: string;
  description?: string;
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
}

// 多轮表单优化节点响应（兼容旧版格式）
export interface InteractiveResponse {
  data: Record<string, any>;
  // 兼容旧版格式
  form_answer?: Record<string, any>;
}

// 多轮表单优化节点状态
export interface InteractiveState {
  nodeId: string;
  stage: 'waiting' | 'collecting' | 'processing' | 'completed';
  request?: InteractiveRequest;
  response?: InteractiveResponse;
  originalPrompt: string;
  roundCount?: number;
}
