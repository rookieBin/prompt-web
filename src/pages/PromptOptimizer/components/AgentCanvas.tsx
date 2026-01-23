import { Steps, Skeleton, Tooltip } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { Agent, AgentType } from '../types';

const agentRoles: Record<AgentType, string> = {
  architect: '负责分析用户原始提示词，理解意图并设计优化方案，构建清晰的提示词结构框架',
  redteamer: '从对抗视角审视提示词，发现潜在漏洞和歧义，提出改进建议以增强鲁棒性',
  judge: '评估优化后的提示词质量，从多个维度打分，决定是否需要继续迭代优化',
  adapter: '根据评审反馈调整提示词，融合各方建议，输出最终优化版本',
};

interface AgentCanvasProps {
  agents: Agent[];
}

export default function AgentCanvas({ agents }: AgentCanvasProps) {
  const getStepsItems = () => {
    return agents.map((agent) => {
      let status: 'wait' | 'process' | 'finish' | 'error' = 'wait';
      let icon = undefined;

      if (agent.state === 'running') {
        status = 'process';
        icon = <LoadingOutlined />;
      } else if (agent.state === 'completed') {
        status = 'finish';
        icon = <CheckCircleOutlined />;
      } else if (agent.state === 'failed') {
        status = 'error';
        icon = <CloseCircleOutlined />;
      }

      return {
        title: (
          <span className="inline-flex items-center gap-1.5">
            {agent.name}
            <Tooltip title={agentRoles[agent.id]} placement="right">
              <InfoCircleOutlined className="text-xs text-gray-400 hover:text-blue-500 cursor-help" />
            </Tooltip>
          </span>
        ),
        status,
        icon,
        description: (
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {agent.description}
            </p>
            {agent.state === 'running' && (
              <Skeleton active paragraph={{ rows: 2 }} />
            )}
            {agent.output && agent.state === 'completed' && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans line-clamp-3">
                  {agent.output.substring(0, 150)}...
                </pre>
              </div>
            )}
          </div>
        ),
      };
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          执行流程
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          多智能体协作优化进行中
        </p>
      </div>
      <Steps
        direction="vertical"
        items={getStepsItems()}
      />
    </div>
  );
}
