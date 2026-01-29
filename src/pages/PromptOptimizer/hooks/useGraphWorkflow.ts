import { useCallback, useState, useEffect, useRef } from 'react';
import type { AIConfig } from '@/types';
import { aiConfigApi } from '@/api';
import type { ConsoleLog, JudgeScore, WorkflowNodeData, WorkflowNodeSnapshot, WorkflowSnapshot, InteractiveState } from '../types';
import { AdapterAgent, ArchitectAgent, JudgeAgent, RedTeamerAgent } from '../agents';
import { InteractiveAgent } from '../agents/InteractiveAgent';
import { chatApi } from '@/api';

interface GraphWorkflowState {
  status: 'idle' | 'running' | 'completed' | 'failed';
  logs: ConsoleLog[];
  score?: JudgeScore;
  finalOutput?: string;
  activeNodeId: string | null;
  completedNodeIds: string[];
  failedNodeId?: string | null;
  interactiveState?: InteractiveState;
  interactiveAgent?: InteractiveAgent; // 保持 InteractiveAgent 实例
  resumeFromNodeId?: string; // 交互完成后从哪个节点继续执行
  resumeInput?: string; // 交互完成后的输入
  savedUserInput?: string; // 保存原始用户输入
  savedSnapshot?: WorkflowSnapshot; // 保存工作流快照
  pendingExecution?: { // 保存执行参数
    userInput: string;
    snapshot: WorkflowSnapshot;
  };
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
  };
}

async function executeTransformNode(input: string, config: AIConfig, node: WorkflowNodeData): Promise<string> {
  let systemPrompt = '';
  const { type } = node;

  switch (type) {
    case 'length_adjust': {
      const targetLength = typeof node.config.targetLength === 'number' && node.config.targetLength > 0
        ? node.config.targetLength
        : 200;
      systemPrompt = `你是一个提示词长度调整器。任务：保持意图不变，将提示词裁剪或扩写为约 ${targetLength} 字，确保结构和关键约束完整。输出必须仍然是提示词模板，不要执行任务。`;
      break;
    }
    case 'style_adjust': {
      const mode = node.config.styleMode === 'casual' ? 'casual' : 'formal';
      systemPrompt =
        mode === 'casual'
          ? '你是一个提示词风格调整器。任务：保持内容不变，把提示词改写为更口语、更亲和但仍清晰可执行的风格。输出必须仍然是提示词模板，不要执行任务。'
          : '你是一个提示词风格调整器。任务：保持内容不变，把提示词改写为更正式、更专业、更清晰的风格。输出必须仍然是提示词模板，不要执行任务。';
      break;
    }
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

async function executeNode(input: string, node: WorkflowNodeSnapshot, baseConfig: AIConfig, setState: React.Dispatch<React.SetStateAction<GraphWorkflowState>>, currentState: GraphWorkflowState): Promise<{ output: string; score?: JudgeScore; keepInput?: boolean; needInteraction?: boolean }> {
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
      return { output: r.output, keepInput: true };
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
    case 'length_adjust':
    case 'style_adjust': {
      const out = await executeTransformNode(input, cfg, data);
      return { output: out };
    }
    case 'interactive': {
      // 检查是否已经有交互状态（避免重复调用）
      if (currentState.interactiveState?.nodeId === node.id && currentState.interactiveState.stage === 'collecting') {
        // 已经在交互中，不要重复调用 AI
        return { output: input, keepInput: true, needInteraction: true };
      }

      // 创建或获取 InteractiveAgent 实例
      let agent = currentState.interactiveAgent;
      if (!agent) {
        agent = new InteractiveAgent(cfg);
        // 重置历史记录（新的交互开始）
        agent.resetHistory();
        // 保存实例到状态中
        setState(prev => ({ ...prev, interactiveAgent: agent }));
      }

      const r = await agent.execute(input);
      if (!r.success) throw new Error(r.error || '多轮表单优化执行失败');
      
      if (r.request) {
        // 需要用户输入，暂停执行并设置交互状态
        setState((prev) => ({
          ...prev,
          interactiveState: {
            nodeId: node.id,
            stage: 'collecting',
            request: r.request,
            originalPrompt: input,
          },
          status: 'running', // 保持运行状态
        }));
        
        // 返回特殊标记，表示需要等待用户输入
        return { output: input, keepInput: true, needInteraction: true };
      } else if (r.output) {
        // 直接返回优化后的提示词
        return { output: r.output };
      }

      return { output: input, keepInput: true };
    }
    default: {
      return { output: input, keepInput: true };
    }
  }
}

function summarizeRedTeamOutput(text: string): string {
  if (!text) return '未得到红队分析结果';
  const lines = text
    .split('\n')
    .map(line => line.replace(/^#+\s*/, '').replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
  const summary = lines.join(' | ');
  return summary || text.replace(/\s+/g, ' ').trim();
}

export function useGraphWorkflow() {
  const [state, setState] = useState<GraphWorkflowState>({
    status: 'idle',
    logs: [],
    activeNodeId: null,
    completedNodeIds: [],
  });

  const stateRef = useRef<GraphWorkflowState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const runRef = useRef<((userInput: string, snapshot: WorkflowSnapshot | null) => Promise<void>) | null>(null);

  const appendLog = useCallback((agent: string, message: string, type: ConsoleLog['type'] = 'info') => {
    setState((prev) => ({
      ...prev,
      logs: [...prev.logs, addLogEntry(agent, message, type)],
    }));
  }, []);

  // 监听恢复状态的变化，重新触发执行
  const [pendingExecution, setPendingExecution] = useState<{
    userInput: string;
    snapshot: WorkflowSnapshot;
  } | null>(null);

  const reset = useCallback(() => {
    setState({ status: 'idle', logs: [], activeNodeId: null, completedNodeIds: [], score: undefined, finalOutput: undefined, failedNodeId: null, interactiveState: undefined, interactiveAgent: undefined, resumeFromNodeId: undefined, resumeInput: undefined, savedUserInput: undefined, savedSnapshot: undefined, pendingExecution: undefined });
    setPendingExecution(null);
  }, []);

  const cancelInteractive = useCallback((nodeId: string) => {
    setState((prev) => ({
      ...prev,
      status: 'failed',
      activeNodeId: null,
      failedNodeId: nodeId,
      interactiveState: undefined,
      interactiveAgent: undefined, // 清理 agent 实例
    }));
    appendLog('system', `用户主动中断多轮表单优化节点: ${nodeId}`, 'error');
  }, [appendLog]);

  const continueInteractive = useCallback((formData: Record<string, any>) => {
    const snapshot = stateRef.current;
    if (!snapshot.interactiveState) return;
    if (snapshot.interactiveState.stage === 'processing') return;

    appendLog('system', `用户提交表单数据: ${JSON.stringify(formData, null, 2)}`, 'info');

    // 标记为处理中，UI 会隐藏表单
    setState((prev) => ({
      ...prev,
      interactiveState: prev.interactiveState
        ? {
            ...prev.interactiveState,
            stage: 'processing' as const,
            request: undefined, // 临时清除 request 让表单隐藏
          }
        : undefined,
    }));

    const continueExecution = async () => {
      try {
        const config = aiConfigApi.getConfig();
        if (!config?.apiKey) {
          appendLog('system', '错误：未配置 API Key，请在个人中心配置', 'error');
          return;
        }

        const originalPrompt = snapshot.interactiveState?.originalPrompt || '';
        const roundCount = (snapshot.interactiveState?.roundCount || 0) + 1;

        let agent = snapshot.interactiveAgent;
        if (!agent) {
          agent = new InteractiveAgent(config);
          appendLog('system', '警告：InteractiveAgent 实例不存在，创建新实例', 'warning');
        }

        const r = await agent.execute(originalPrompt, formData);

        if (r.success) {
          if (r.output) {
            appendLog('api', `response <- multi-round-form: ${r.output.slice(0, 240)}${r.output.length > 240 ? ' ...' : ''}`, 'success');
            appendLog('system', `设置恢复信息: nodeId=${snapshot.interactiveState?.nodeId}, output长度=${r.output.length}`, 'info');
            appendLog(
              'system',
              `检查保存的参数: savedUserInput长度=${snapshot.savedUserInput?.length || 0}, savedSnapshot存在=${!!snapshot.savedSnapshot}`,
              'info'
            );

            // 标记该 interactive 节点已完成（用于画布上显示成功图标）
            const completedInteractiveId = snapshot.interactiveState?.nodeId;
            if (completedInteractiveId) {
              setState((prev) => ({
                ...prev,
                completedNodeIds: prev.completedNodeIds.includes(completedInteractiveId)
                  ? prev.completedNodeIds
                  : [...prev.completedNodeIds, completedInteractiveId],
              }));
            }

            if (snapshot.savedUserInput && snapshot.savedSnapshot) {
              const resumeNodeId = snapshot.interactiveState?.nodeId;
              setState((current) => ({
                ...current,
                interactiveState: undefined,
                interactiveAgent: undefined,
                resumeFromNodeId: resumeNodeId,
                resumeInput: r.output,
                status: 'running',
                pendingExecution: {
                  userInput: snapshot.savedUserInput!,
                  snapshot: snapshot.savedSnapshot!,
                },
              }));
            } else {
              appendLog('system', '错误：缺少保存的执行参数', 'error');
              setState((current) => ({
                ...current,
                status: 'failed',
                interactiveState: undefined,
                interactiveAgent: undefined,
              }));
            }
          } else if (r.request) {
            appendLog('system', 'AI 请求更多信息，显示新表单', 'info');
            setState((current) => ({
              ...current,
              interactiveState: current.interactiveState
                ? {
                    ...current.interactiveState,
                    stage: 'collecting' as const,
                    request: r.request,
                    roundCount: roundCount,
                  }
                : undefined,
            }));
          }
        } else {
          appendLog('api', `error <- multi-round-form: ${r.error}`, 'error');
          setState((current) => ({
            ...current,
            status: 'failed',
            interactiveState: undefined,
            interactiveAgent: undefined,
            failedNodeId: snapshot.interactiveState?.nodeId,
          }));
        }
      } catch (error) {
        appendLog('api', `error <- multi-round-form: ${error}`, 'error');
        setState((current) => ({
          ...current,
          status: 'failed',
          interactiveState: undefined,
          interactiveAgent: undefined,
          failedNodeId: snapshot.interactiveState?.nodeId,
        }));
      }
    };

    continueExecution();
  }, [appendLog]);

  const run = useCallback(
    async (userInput: string, snapshot: WorkflowSnapshot | null) => {
      const latestState = stateRef.current;
      // 保存执行参数，用于交互完成后恢复
      if (snapshot) {
        setPendingExecution({ userInput, snapshot });
        appendLog('system', `设置 pendingExecution: userInput长度=${userInput.length}, 节点数=${snapshot.nodes.length}`, 'info');
        
        // 同时保存到状态中（只有在首次执行时）
        appendLog('system', `检查保存条件: resumeFromNodeId=${latestState.resumeFromNodeId}, resumeInput=${latestState.resumeInput}`, 'info');
        if (!latestState.resumeFromNodeId && !latestState.resumeInput) {
          appendLog('system', '开始保存参数到状态中', 'info');
          setState(prev => ({
            ...prev,
            savedUserInput: userInput,
            savedSnapshot: snapshot
          }));
        } else {
          appendLog('system', '跳过保存参数（恢复执行中）', 'info');
        }
      }

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

      // 只有在首次执行时重置状态，恢复执行时保持状态
      if (!latestState.resumeFromNodeId && !latestState.resumeInput) {
        setState((prev) => ({
          ...prev,
          status: 'running',
          logs: [],
          activeNodeId: null,
          completedNodeIds: [],
          score: undefined,
          finalOutput: undefined,
          failedNodeId: null,
          interactiveState: undefined,
          interactiveAgent: undefined,
          resumeFromNodeId: undefined,
          resumeInput: undefined,
        }));
      }

      let current = userInput;
      let currentScore: JudgeScore | undefined;

      appendLog('system', '流程启动', 'info');

      const ordered = linearizeFromStart(snapshot);

      // 检查是否需要从某个节点恢复执行（交互完成后）
      let startAtIndex = 0;
      appendLog('system', `检查恢复信息: resumeFromNodeId=${latestState.resumeFromNodeId}, resumeInput长度=${latestState.resumeInput?.length || 0}`, 'info');
      if (latestState.resumeFromNodeId && latestState.resumeInput) {
        const resumeIndex = ordered.findIndex(n => n.id === latestState.resumeFromNodeId);
        if (resumeIndex !== -1) {
          startAtIndex = resumeIndex + 1; // 从下一个节点开始
          current = latestState.resumeInput; // 使用交互的输出作为输入
          appendLog('system', `从节点 ${latestState.resumeFromNodeId} 交互完成后继续执行，开始索引: ${startAtIndex}`, 'info');
        }
        // 清理恢复信息
        setState(prev => ({ ...prev, resumeFromNodeId: undefined, resumeInput: undefined }));
      }

      try {
        for (let i = startAtIndex; i < ordered.length; i++) {
          const n = ordered[i];
          setState((prev) => ({ ...prev, activeNodeId: n.id }));
          appendLog('system', `开始执行: ${n.data.label}`, 'info');

          const mergedCfg = mergeConfig(config, n.data.config);
          appendLog('api', `request -> ${n.data.type} (model=${mergedCfg.model})`, 'info');

          let res: { output: string; score?: JudgeScore; keepInput?: boolean; needInteraction?: boolean };
          try {
            res = await executeNode(current, n, config, setState, stateRef.current);
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

          if (n.data.type === 'redteamer' && res.output) {
            const summary = summarizeRedTeamOutput(res.output);
            appendLog('redteamer', `红队警示：${summary}`, 'error');
          }

          if (res.score) {
            currentScore = res.score;
            setState((prev) => ({ ...prev, score: currentScore }));
            appendLog('judge', `评分: ${currentScore.total}/100`, currentScore.passed ? 'success' : 'warning');
          }

          if (!res.keepInput) {
            current = res.output;
          }

          // 如果需要交互，暂停执行
          if (res.needInteraction) {
            appendLog('system', `等待用户输入: ${n.data.label}`, 'info');
            return; // 暂停执行，等待用户提交表单
          }

          appendLog('system', `完成: ${n.data.label}`, 'success');
          setState((prev) => ({
            ...prev,
            completedNodeIds: prev.completedNodeIds.includes(n.id) ? prev.completedNodeIds : [...prev.completedNodeIds, n.id],
          }));
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

  // 设置 runRef.current
  runRef.current = run;

  // 监听恢复状态的变化，重新触发执行
  useEffect(() => {
    const pending = state.pendingExecution || pendingExecution; // 优先使用状态中的，其次使用本地状态
    appendLog('system', `useEffect 检查: resumeFromNodeId=${state.resumeFromNodeId}, resumeInput长度=${state.resumeInput?.length || 0}, pendingExecution=${!!pending}, runRef存在=${!!runRef.current}`, 'info');
    if (state.resumeFromNodeId && state.resumeInput && pending && runRef.current) {
      // 重新执行主循环
      appendLog('system', `重新触发执行: 从节点 ${state.resumeFromNodeId} 继续`, 'info');
      runRef.current(pending.userInput, pending.snapshot);
      // 清理 pending，避免重复触发
      setState(prev => ({ ...prev, pendingExecution: undefined }));
      setPendingExecution(null);
    }
  }, [state.resumeFromNodeId, state.resumeInput, state.pendingExecution, pendingExecution]);

  return {
    logs: state.logs,
    score: state.score,
    finalOutput: state.finalOutput,
    isRunning: state.status === 'running',
    activeNodeId: state.activeNodeId,
    completedNodeIds: state.completedNodeIds,
    failedNodeId: state.failedNodeId,
    interactiveState: state.interactiveState,
    run,
    reset,
    continueInteractive,
    cancelInteractive,
  };
}
