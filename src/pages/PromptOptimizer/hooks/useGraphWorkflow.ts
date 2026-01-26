import { useCallback, useState } from 'react';
import type { AIConfig } from '@/types';
import { aiConfigApi } from '@/api';
import type { ConsoleLog, JudgeScore, WorkflowNodeData, WorkflowNodeSnapshot, WorkflowNodeType, WorkflowSnapshot } from '../types';
import { AdapterAgent, ArchitectAgent, JudgeAgent, RedTeamerAgent } from '../agents';
import { chatApi } from '@/api';

interface GraphWorkflowState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  logs: ConsoleLog[];
  score?: JudgeScore;
  finalOutput?: string;
  activeNodeId: string | null;
  failedNodeId?: string | null;
}

function addLogEntry(agent: string, message: string, type: ConsoleLog['type'] = 'info'): ConsoleLog {
  return {
    id: `${Date.now()}-${Math.random()}`,
    agent,
    message,
    timestamp: Date.now(),
    type,
  };
}

function toposort(snapshot: WorkflowSnapshot): WorkflowNodeSnapshot[] {
  const nodeMap = new Map(snapshot.nodes.map((n) => [n.id, n] as const));
  const indegree = new Map<string, number>();
  const out = new Map<string, Set<string>>();

  snapshot.nodes.forEach((n) => {
    indegree.set(n.id, 0);
    out.set(n.id, new Set());
  });

  snapshot.edges.forEach((e) => {
    if (!nodeMap.has(e.source) || !nodeMap.has(e.target)) return;
    out.get(e.source)?.add(e.target);
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
  });

  const queue: string[] = [];
  indegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const ordered: WorkflowNodeSnapshot[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const n = nodeMap.get(id);
    if (n) ordered.push(n);

    const nexts = out.get(id);
    nexts?.forEach((to) => {
      indegree.set(to, (indegree.get(to) ?? 0) - 1);
      if ((indegree.get(to) ?? 0) === 0) queue.push(to);
    });
  }

  if (ordered.length !== snapshot.nodes.length) {
    return snapshot.nodes;
  }

  return ordered;
}

function linearizeFromStart(snapshot: WorkflowSnapshot): WorkflowNodeSnapshot[] {
  const nodeMap = new Map(snapshot.nodes.map((n) => [n.id, n] as const));

  const start = snapshot.nodes.find((n) => n.data.type === 'start');
  if (!start) return toposort(snapshot);

  const edgeFrom = new Map<string, string>();
  snapshot.edges.forEach((e) => {
    if (!e.source || !e.target) return;
    if (edgeFrom.has(e.source)) return;
    edgeFrom.set(e.source, e.target);
  });

  const ordered: WorkflowNodeSnapshot[] = [];
  const visited = new Set<string>();
  let cur: string | undefined = start.id;
  while (cur) {
    if (visited.has(cur)) break;
    visited.add(cur);
    const node = nodeMap.get(cur);
    if (!node) break;
    ordered.push(node);
    cur = edgeFrom.get(cur);
  }

  return ordered.length > 0 ? ordered : toposort(snapshot);
}

function mergeConfig(base: AIConfig, nodeConfig: WorkflowNodeData['config']): AIConfig {
  return {
    ...base,
    model: typeof nodeConfig.model === 'string' && nodeConfig.model ? nodeConfig.model : base.model,
    temperature: typeof nodeConfig.temperature === 'number' ? nodeConfig.temperature : base.temperature,
    maxTokens: typeof nodeConfig.maxTokens === 'number' ? nodeConfig.maxTokens : base.maxTokens,
  };
}

async function executeTransformNode(input: string, config: AIConfig, type: WorkflowNodeType): Promise<string> {
  let systemPrompt = '';

  switch (type) {
    case 'prompt_shorten':
      systemPrompt = '你是一个提示词编辑器。任务：在不改变意图的前提下，尽可能精简提示词，去掉冗余，保留关键约束与结构。输出必须仍然是提示词模板，不要执行任务。';
      break;
    case 'prompt_expand':
      systemPrompt = '你是一个提示词扩写器。任务：在不改变意图的前提下，把提示词扩充为更完整可执行的模板，补充结构化要素（角色/任务/输入输出/约束/示例）。输出必须仍然是提示词模板，不要执行任务。';
      break;
    case 'style_formal':
      systemPrompt = '你是一个提示词风格调整器。任务：保持内容不变，把提示词改写为更正式、更专业、更清晰的风格。输出必须仍然是提示词模板，不要执行任务。';
      break;
    case 'style_casual':
      systemPrompt = '你是一个提示词风格调整器。任务：保持内容不变，把提示词改写为更口语、更亲和但仍清晰可执行的风格。输出必须仍然是提示词模板，不要执行任务。';
      break;
    default:
      systemPrompt = '你是一个提示词编辑器。输出必须仍然是提示词模板，不要执行任务。';
  }

  const res = await chatApi.sendMessage(
    [
      { id: 'system', role: 'assistant', content: systemPrompt, createdAt: new Date().toISOString() },
      { id: 'user', role: 'user', content: input, createdAt: new Date().toISOString() },
    ],
    config
  );

  if (res.code !== 200) {
    throw new Error(res.message || '执行失败');
  }

  return res.data.content;
}

async function executeNode(input: string, node: WorkflowNodeSnapshot, baseConfig: AIConfig): Promise<{ output: string; score?: JudgeScore; keepInput?: boolean }> {
  const data = node.data;
  const cfg = mergeConfig(baseConfig, data.config);

  switch (data.type) {
    case 'start': {
      return { output: input, keepInput: true };
    }
    case 'architect': {
      const r = await new ArchitectAgent(cfg).execute(input);
      if (!r.success) throw new Error(r.error || 'Architect 执行失败');
      return { output: r.output };
    }
    case 'redteamer': {
      const r = await new RedTeamerAgent(cfg).execute(input);
      if (!r.success) throw new Error(r.error || 'RedTeamer 执行失败');
      return { output: r.output };
    }
    case 'adapter': {
      const r = await new AdapterAgent(cfg).execute(input);
      if (!r.success) throw new Error(r.error || 'Adapter 执行失败');
      return { output: r.output };
    }
    case 'judge': {
      const r = await new JudgeAgent(cfg).execute(input);
      if (!r.success) throw new Error(r.error || 'Judge 执行失败');
      try {
        const parsed = JSON.parse(r.output);
        const score: JudgeScore = {
          total: parsed.total,
          dimensions: (parsed.dimensions || []).map((d: any) => ({
            name: d.name,
            score: d.score,
            maxScore: 100,
          })),
          feedback: parsed.feedback || '',
          passed: Boolean(parsed.passed),
        };
        return { output: r.output, score, keepInput: true };
      } catch {
        return { output: r.output, keepInput: true };
      }
    }
    case 'prompt_shorten':
    case 'prompt_expand':
    case 'style_formal':
    case 'style_casual': {
      const out = await executeTransformNode(input, cfg, data.type);
      return { output: out };
    }
  }
}

export function useGraphWorkflow() {
  const [state, setState] = useState<GraphWorkflowState>({
    status: 'idle',
    logs: [],
    activeNodeId: null,
  });

  const appendLog = useCallback((agent: string, message: string, type: ConsoleLog['type'] = 'info') => {
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, addLogEntry(agent, message, type)],
    }));
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', logs: [], activeNodeId: null, score: undefined, finalOutput: undefined, failedNodeId: null });
  }, []);

  const run = useCallback(
    async (userInput: string, snapshot: WorkflowSnapshot | null) => {
      const config = aiConfigApi.getConfig();
      if (!config?.apiKey) {
        setState((prev) => ({
          ...prev,
          status: 'failed',
          logs: [...prev.logs, addLogEntry('system', '错误：未配置 API Key，请在个人中心配置', 'error')],
        }));
        return;
      }

      if (!snapshot || snapshot.nodes.length === 0) {
        setState((prev) => ({
          ...prev,
          status: 'failed',
          logs: [...prev.logs, addLogEntry('system', '错误：当前没有任何节点', 'error')],
        }));
        return;
      }

      setState({ status: 'running', logs: [], activeNodeId: null, score: undefined, finalOutput: undefined, failedNodeId: null });

      let current = userInput;
      let currentScore: JudgeScore | undefined;

      appendLog('system', '流程启动', 'info');

      const ordered = linearizeFromStart(snapshot);

      try {
        for (const n of ordered) {
          setState((prev) => ({ ...prev, activeNodeId: n.id }));
          appendLog('system', `开始执行: ${n.data.label}`, 'info');

          const mergedCfg = mergeConfig(config, n.data.config);
          appendLog('api', `request -> ${n.data.type} (model=${mergedCfg.model})`, 'info');

          let res: { output: string; score?: JudgeScore; keepInput?: boolean };
          try {
            res = await executeNode(current, n, config);
          } catch (err: any) {
            appendLog('api', `error <- ${n.data.type}: ${err?.message || 'unknown error'}`, 'error');
            setState((prev) => ({ ...prev, failedNodeId: n.id, activeNodeId: null }));
            throw err;
          }

          const preview = (res.output || '').slice(0, 240).replace(/\s+/g, ' ').trim();
          appendLog(
            'api',
            `response <- ${n.data.type}: ${preview}${(res.output || '').length > 240 ? ' ...' : ''}`,
            n.data.type === 'judge' && !res.score ? 'warning' : 'success'
          );

          if (res.score) {
            currentScore = res.score;
            setState((prev) => ({ ...prev, score: currentScore }));
            appendLog('judge', `评分: ${currentScore.total}/100`, currentScore.passed ? 'success' : 'warning');
          }

          if (!res.keepInput) {
            current = res.output;
          }

          appendLog('system', `完成: ${n.data.label}`, 'success');
        }

        setState((prev) => ({
          ...prev,
          status: 'completed',
          activeNodeId: null,
          finalOutput: current,
          score: currentScore ?? prev.score,
        }));
        appendLog('system', '流程完成', 'success');
      } catch (e: any) {
        setState((prev) => ({ ...prev, status: 'failed', activeNodeId: null }));
        appendLog('api', `error: ${e?.message || 'unknown error'}`, 'error');
        appendLog('system', `流程失败: ${e?.message || 'unknown error'}`, 'error');
      }
    },
    [appendLog]
  );

  return {
    logs: state.logs,
    score: state.score,
    finalOutput: state.finalOutput,
    isRunning: state.status === 'running',
    activeNodeId: state.activeNodeId,
    failedNodeId: state.failedNodeId,
    run,
    reset,
  };
}
