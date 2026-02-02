// Agent 状态类型
export type AgentState = 'idle' | 'running' | 'completed' | 'failed';

// Agent 类型
export type AgentType = 'architect' | 'redteamer' | 'judge' | 'adapter';

// 编排节点类型（扩展：支持新增节点）
export type StyleAdjustMode = 'formal' | 'casual';

export type WorkflowNodeType =
  | 'start'
  | AgentType
  | 'expression_adjust'
  | 'interactive';

export interface WorkflowNodeData {
  type: WorkflowNodeType;
  label: string;
  description?: string;
  config: {
    model?: string;
    targetModel?: string;
    targetLength?: number;
    styleMode?: StyleAdjustMode;
    [key: string]: unknown;
  };
}

export interface WorkflowNodeMeta {
  label: string;
  description: string;
}

export function getWorkflowNodeMeta(type: WorkflowNodeType): WorkflowNodeMeta {
  switch (type) {
    case 'start':
      return { label: '开始', description: '工作流入口节点，不会对提示词做任何修改' };
    case 'architect':
      return { label: '架构师', description: '将用户想法转化为结构化提示词初稿' };
    case 'redteamer':
      return { label: '红队专家', description: '对提示词进行压力测试，找出潜在问题和漏洞' };
    case 'judge':
      return { label: '评审官', description: '对提示词进行多维度评分和评审' };
    case 'adapter':
      return { label: '适配器', description: '对提示词进行最终的格式润色和优化' };
    case 'expression_adjust':
      return { label: '表达调整', description: '从不同维度微整提示词的表达方式' };
    case 'interactive':
      return { label: '多轮表单优化', description: '与用户多轮交互，收集信息并生成表单' };
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function getLegacyEnglishLabel(type: WorkflowNodeType): string | null {
  switch (type) {
    case 'start':
      return 'Start';
    case 'architect':
      return 'Architect';
    case 'redteamer':
      return 'RedTeamer';
    case 'judge':
      return 'Judge';
    case 'adapter':
      return 'Adapter';
    default:
      return null;
  }
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
