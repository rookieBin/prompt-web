import type { Agent } from '../types';

interface AgentNodeProps {
  agent: Agent;
  isActive: boolean;
}

export default function AgentNode({ agent, isActive }: AgentNodeProps) {
  const getStateColor = () => {
    switch (agent.state) {
      case 'running': return 'from-blue-500 to-purple-500';
      case 'completed': return 'from-green-500 to-emerald-500';
      case 'failed': return 'from-red-500 to-pink-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* 节点容器 */}
      <div
        className={`
          relative w-24 h-24 rounded-3xl
          bg-gradient-to-br ${getStateColor()}
          flex items-center justify-center
          backdrop-blur-xl
          border border-white/20
          transition-all duration-300
          ${isActive ? 'scale-110 shadow-[0_0_30px_rgba(99,102,241,0.6)]' : 'shadow-[0_4px_20px_rgba(0,0,0,0.1)]'}
        `}
      >
        {/* Loading 指示器 */}
        {agent.state === 'running' && (
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        )}

        {/* 图标 */}
        <span className="text-4xl relative z-10">{agent.icon}</span>

        {/* 完成标记 */}
        {agent.state === 'completed' && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {/* 名称 */}
      <div className="mt-3 text-center">
        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {agent.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {agent.description}
        </div>
      </div>

      {/* 状态指示器 */}
      <div
        className="mt-2 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
        style={{
          width: agent.state === 'completed' ? '100%' : agent.state === 'running' ? '50%' : '0%'
        }}
      />
    </div>
  );
}
