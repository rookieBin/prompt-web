import { useState } from 'react';
import { Input, Button } from 'antd';
import { Sparkles } from 'lucide-react';
import AgentCanvas from './components/AgentCanvas';
import LiveConsole from './components/LiveConsole';
import ResultPreview from './components/ResultPreview';
import ScoreRadar from './components/ScoreRadar';
import { useAgentWorkflow } from './hooks/useAgentWorkflow';
import './index.css';

export default function PromptOptimizer() {
  const [userInput, setUserInput] = useState('');
  const { agents, logs, currentAgent, finalOutput, score, isRunning, startWorkflow, reset } = useAgentWorkflow();

  const handleStart = () => {
    if (!userInput.trim()) return;
    startWorkflow(userInput);
  };

  const handleReset = () => {
    setUserInput('');
    reset();
  };

  return (
    <div className="prompt-optimizer-container">
      {/* 输入区域 */}
      <div className="input-section">
        <div className="input-header">
          <Sparkles className="header-icon" />
          <h2 className="header-title">多智能体协作提示词进化工坊</h2>
        </div>

        <Input.TextArea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="输入你的原始提示词，让 AI 智能体团队帮你优化..."
          disabled={isRunning}
          autoSize={{ minRows: 3, maxRows: 6 }}
          className="input-textarea"
        />

        <div className="input-actions">
          <Button
            type="primary"
            size="large"
            onClick={handleStart}
            disabled={!userInput.trim() || isRunning}
            loading={isRunning}
            className="start-button"
          >
            {isRunning ? '工作流运行中...' : '启动优化'}
          </Button>
          {(finalOutput || isRunning) && (
            <Button size="large" onClick={handleReset} className="reset-button">
              重新开始
            </Button>
          )}
        </div>
      </div>

      {/* Agent 协作画布 */}
      {agents.length > 0 && (
        <div className="canvas-section">
          <AgentCanvas agents={agents} />
        </div>
      )}

      {/* 日志和结果区域 */}
      {logs.length > 0 && (
        <div className="output-section">
          <div className="output-left">
            <LiveConsole logs={logs} />
            <div className="score-section">
              <ScoreRadar score={score} />
            </div>
          </div>
          <div className="output-right">
            <ResultPreview
              originalInput={userInput}
              finalOutput={finalOutput}
              score={score}
            />
          </div>
        </div>
      )}
    </div>
  );
}
