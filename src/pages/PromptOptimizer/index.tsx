import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Input, Splitter } from 'antd';
import NodeConfigPanel from './components/NodeConfigPanel';
import RawConsole from './components/RawConsole';
import WorkflowCanvas, { type WorkflowCanvasHandle } from './components/WorkflowCanvas';
import WorkflowToolbar from './components/WorkflowToolbar';
import { useGraphWorkflow } from './hooks/useGraphWorkflow';
import type { WorkflowNodeData } from './types';
import './index.css';

export default function PromptOptimizer() {
  const location = useLocation();
  const [userInput, setUserInput] = useState('');
  const [selectedNode, setSelectedNode] = useState<{ id: string; data: WorkflowNodeData } | null>(null);
  const canvasRef = useRef<WorkflowCanvasHandle>(null);
  const { logs, finalOutput, isRunning, activeNodeId, failedNodeId, run, reset } = useGraphWorkflow();

  const initialPrompt = useMemo(() => {
    const state = location.state as { initialPrompt?: string } | null;
    return state?.initialPrompt ?? '';
  }, [location.state]);

  useEffect(() => {
    if (initialPrompt.trim()) {
      setUserInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (finalOutput) {
      setUserInput(finalOutput);
    }
  }, [finalOutput]);

  const handleStart = () => {
    if (!userInput.trim()) return;
    const snapshot = canvasRef.current?.getSnapshot() ?? null;
    run(userInput, snapshot);
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
      <Splitter className="optimizer-splitter" orientation="horizontal">
        <Splitter.Panel defaultSize={'35%'} min={260} max="55%">
          <div className="input-section">
            <Input.TextArea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="输入你的原始提示词..."
              disabled={isRunning}
              autoSize={false}
              className="input-textarea"
            />
          </div>
        </Splitter.Panel>

        <Splitter.Panel>
          <Splitter className="workflow-splitter" orientation="vertical">
            <Splitter.Panel defaultSize="70%" min={260}>
              <div className="canvas-section">
                <WorkflowToolbar
                  onAddNode={(type) => canvasRef.current?.addNode(type)}
                  onDeleteSelected={() => canvasRef.current?.deleteSelected()}
                  onRun={handleStart}
                  onCopy={handleCopy}
                  onReset={handleReset}
                  canRun={Boolean(userInput.trim())}
                  isRunning={isRunning}
                  canCopy={Boolean(userInput.trim())}
                  showReset={Boolean(finalOutput || isRunning)}
                />

                <Splitter className="canvas-config-splitter" orientation="horizontal">
                  <Splitter.Panel>
                    <div className="workflow-main-canvas">
                      <WorkflowCanvas
                        ref={canvasRef}
                        activeNodeId={activeNodeId}
                        failedNodeId={failedNodeId}
                        onSelectNode={(n) => setSelectedNode(n)}
                      />
                    </div>
                  </Splitter.Panel>
                  <Splitter.Panel
                    size={selectedNode ? 360 : 0}
                    min={280}
                    max="50%"
                    resizable={Boolean(selectedNode)}
                  >
                    <div className={`workflow-main-config ${selectedNode ? '' : 'workflow-main-config--hidden'}`}>
                      <NodeConfigPanel
                        selected={selectedNode}
                        onUpdate={(nodeId, patch) => canvasRef.current?.updateNodeData(nodeId, patch)}
                      />
                    </div>
                  </Splitter.Panel>
                </Splitter>
              </div>
            </Splitter.Panel>

            <Splitter.Panel defaultSize="30%" min={160}>
              <div className="output-section">
                <RawConsole logs={logs} />
              </div>
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
      </Splitter>
    </div>
  );
}
