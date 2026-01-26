import { useState, useCallback } from 'react';
import type { WorkflowState, AgentType, Agent, ConsoleLog, JudgeScore } from '../types';
import { ArchitectAgent, RedTeamerAgent, JudgeAgent, AdapterAgent } from '../agents';
import { aiConfigApi } from '@/api';

const INITIAL_AGENTS: Agent[] = [
  { id: 'architect', name: 'Architect', description: '架构师', icon: '🏗️', state: 'idle' },
  { id: 'redteamer', name: 'RedTeamer', description: '红队专家', icon: '🔴', state: 'idle' },
  { id: 'judge', name: 'Judge', description: '评审官', icon: '⚖️', state: 'idle' },
  { id: 'adapter', name: 'Adapter', description: '适配器', icon: '🔧', state: 'idle' },
];

export function useAgentWorkflow() {
  const [state, setState] = useState<WorkflowState>({
    status: 'idle',
    currentAgent: null,
    agents: INITIAL_AGENTS,
    logs: [],
    steps: [],
    iterations: 0,
    maxIterations: 3,
  });

  const addLog = useCallback((agent: string, message: string, type: ConsoleLog['type'] = 'info') => {
    const log: ConsoleLog = {
      id: `${Date.now()}-${Math.random()}`,
      agent,
      message,
      timestamp: Date.now(),
      type,
    };
    setState(prev => ({ ...prev, logs: [...prev.logs, log] }));
  }, []);

  const updateAgentState = useCallback((agentId: AgentType, agentState: Agent['state'], output?: string) => {
    setState(prev => ({
      ...prev,
      agents: prev.agents.map(a => a.id === agentId ? { ...a, state: agentState, output } : a),
    }));
  }, []);

  const simulateAgent = useCallback(async (agent: AgentType, input: string): Promise<string> => {
    updateAgentState(agent, 'running');
    addLog(agent, `开始处理...`, 'info');

    const config = aiConfigApi.getConfig();
    if (!config?.apiKey) {
      addLog(agent, '错误：未配置 API Key，请在个人中心配置', 'error');
      updateAgentState(agent, 'failed');
      throw new Error('未配置 API Key');
    }

    let agentInstance;
    switch (agent) {
      case 'architect':
        agentInstance = new ArchitectAgent(config);
        break;
      case 'redteamer':
        agentInstance = new RedTeamerAgent(config);
        break;
      case 'judge':
        agentInstance = new JudgeAgent(config);
        break;
      case 'adapter':
        agentInstance = new AdapterAgent(config);
        break;
    }

    const result = await agentInstance.execute(input);

    if (!result.success) {
      addLog(agent, `执行失败: ${result.error}`, 'error');
      updateAgentState(agent, 'failed');
      throw new Error(result.error);
    }

    const output = result.output;

    switch (agent) {
      case 'architect':
        addLog(agent, '已生成初稿结构', 'success');
        break;
      case 'redteamer':
        addLog(agent, '已完成压力测试', 'success');
        break;
      case 'judge':
        try {
          const scoreData = JSON.parse(output);
          addLog(agent, `评分: ${scoreData.total}/100`, scoreData.passed ? 'success' : 'warning');
        } catch {
          addLog(agent, '评分完成', 'success');
        }
        break;
      case 'adapter':
        addLog(agent, '格式润色完成', 'success');
        break;
    }

    updateAgentState(agent, 'completed', output);
    return output;
  }, [addLog, updateAgentState]);

  const startWorkflow = useCallback(async (userInput: string) => {
    setState(prev => ({ ...prev, status: 'running', iterations: 0, logs: [], steps: [] }));
    addLog('architect', '工作流启动', 'info');

    let currentInput = userInput;
    let iteration = 0;

    while (iteration < state.maxIterations) {
      iteration++;
      setState(prev => ({ ...prev, iterations: iteration, currentAgent: 'architect' }));

      const architectOutput = await simulateAgent('architect', currentInput);

      setState(prev => ({ ...prev, currentAgent: 'redteamer' }));
      await simulateAgent('redteamer', architectOutput);

      setState(prev => ({ ...prev, currentAgent: 'judge' }));
      const judgeOutput = await simulateAgent('judge', architectOutput);
      const score: JudgeScore = {
        total: JSON.parse(judgeOutput).total,
        dimensions: [
          { name: '清晰度', score: 80 + Math.random() * 20, maxScore: 100 },
          { name: '完整性', score: 75 + Math.random() * 25, maxScore: 100 },
          { name: '可用性', score: 70 + Math.random() * 30, maxScore: 100 },
        ],
        feedback: '整体表现良好',
        passed: JSON.parse(judgeOutput).passed,
      };

      setState(prev => ({ ...prev, score }));

      if (score.passed) {
        setState(prev => ({ ...prev, currentAgent: 'adapter' }));
        const finalOutput = await simulateAgent('adapter', architectOutput);
        setState(prev => ({
          ...prev,
          status: 'completed',
          currentAgent: null,
          steps: [...prev.steps, { agent: 'adapter', input: architectOutput, output: finalOutput, timestamp: Date.now() }]
        }));
        addLog('adapter', '工作流完成！', 'success');
        break;
      } else {
        addLog('judge', `第 ${iteration} 轮未通过，重新优化...`, 'warning');
        currentInput = `${userInput} (优化建议: ${score.feedback})`;
      }
    }

    if (iteration >= state.maxIterations) {
      setState(prev => ({ ...prev, status: 'failed', currentAgent: null }));
      addLog('judge', '达到最大迭代次数', 'error');
    }
  }, [state.maxIterations, addLog, simulateAgent]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      currentAgent: null,
      agents: INITIAL_AGENTS,
      logs: [],
      steps: [],
      iterations: 0,
      maxIterations: 3,
    });
  }, []);

  return {
    agents: state.agents,
    logs: state.logs,
    currentAgent: state.currentAgent,
    finalOutput: state.steps[state.steps.length - 1]?.output,
    score: state.score,
    isRunning: state.status === 'running',
    startWorkflow,
    reset,
  };
}
