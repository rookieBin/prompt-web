import { useEffect, useState } from 'react';
import { Input, Button } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { Sparkles } from 'lucide-react';
import AgentCanvas from './components/AgentCanvas';
import LiveConsole from './components/LiveConsole';
import ScoreRadar from './components/ScoreRadar';
import { useAgentWorkflow } from './hooks/useAgentWorkflow';
import './index.css';

export default function PromptOptimizer() {
  const [userInput, setUserInput] = useState('');
  const { agents, logs, finalOutput, score, isRunning, startWorkflow, reset } = useAgentWorkflow();

  useEffect(() => {
    if (finalOutput) {
      setUserInput(finalOutput);
    }
  }, [finalOutput]);

  const handleStart = () => {
    if (!userInput.trim()) return;
    startWorkflow(userInput);
  };

  const handleReset = () => {
    setUserInput('');
    reset();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(userInput);
  };

  return (
    <div className="prompt-optimizer-container">
      <div className="optimizer-toolbar">
        <div className="optimizer-title">
          <Sparkles className="header-icon" />
          <h2 className="header-title">多智能体协作提示词进化工坊</h2>
        </div>
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
          <Button
            size="large"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            disabled={!userInput.trim()}
            className="reset-button"
          >
            复制
          </Button>
          {(finalOutput || isRunning) && (
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleReset}
              className="reset-button"
            >
              重新开始
            </Button>
          )}
        </div>
      </div>

      <div className="optimizer-body">
        {/* 输入区域 */}
        <div className="input-section">
          <Input.TextArea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="输入你的原始提示词，让 AI 智能体团队帮你优化..."
            disabled={isRunning}
            autoSize={false}
            className="input-textarea"
          />
        </div>

        {/* 日志和结果区域 */}
        <div className="output-panel">
          {/* Agent 协作画布 */}
          {agents.length > 0 && (
            <div className="canvas-section">
              <AgentCanvas agents={agents} />
            </div>
          )}

          {logs.length > 0 && (
            <div className="output-section">
              <div className="output-left">
                <LiveConsole logs={logs} />
                <div className="score-section">
                  <ScoreRadar score={score} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
