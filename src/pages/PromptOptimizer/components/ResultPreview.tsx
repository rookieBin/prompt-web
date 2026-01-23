import { Copy, Check, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { Card, Spin, Input } from 'antd';
import type { JudgeScore } from '../types';

const { TextArea } = Input;

interface ResultPreviewProps {
  originalInput: string;
  finalOutput?: string;
  score?: JudgeScore;
}

export default function ResultPreview({ originalInput, finalOutput, score }: ResultPreviewProps) {
  const [copiedOriginal, setCopiedOriginal] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedOutput, setEditedOutput] = useState('');

  const handleCopy = async (text: string, type: 'original' | 'final') => {
    await navigator.clipboard.writeText(text);
    if (type === 'original') {
      setCopiedOriginal(true);
      setTimeout(() => setCopiedOriginal(false), 2000);
    } else {
      setCopiedFinal(true);
      setTimeout(() => setCopiedFinal(false), 2000);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedOutput(finalOutput || '');
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* 原始输入 */}
      <Card
        title="原始输入"
        extra={
          <button
            onClick={() => handleCopy(originalInput, 'original')}
            className="p-0.5 hover:opacity-70 transition-opacity"
            title="复制"
          >
            {copiedOriginal ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        }
        className="shadow-sm"
      >
        <div className="max-h-64 overflow-y-auto">
          <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">
            {originalInput || '等待输入...'}
          </pre>
        </div>
      </Card>

      {/* 优化结果 */}
      <Card
        title={
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            优化结果
          </span>
        }
        extra={
          finalOutput && (
            <div className="flex items-center gap-1.5">
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="p-0.5 hover:opacity-70 transition-opacity"
                  title="保存"
                >
                  <Check className="w-3.5 h-3.5 text-green-500" />
                </button>
              ) : (
                <button
                  onClick={handleEdit}
                  className="p-0.5 hover:opacity-70 transition-opacity"
                  title="编辑"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                </button>
              )}
              <button
                onClick={() => handleCopy(isEditing ? editedOutput : finalOutput, 'final')}
                className="p-0.5 hover:opacity-70 transition-opacity"
                title="复制"
              >
                {copiedFinal ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                )}
              </button>
            </div>
          )
        }
        className="shadow-sm border-2 border-transparent bg-gradient-to-r from-blue-500/10 to-purple-500/10"
        style={{ borderImage: 'linear-gradient(to right, rgb(59, 130, 246), rgb(168, 85, 247)) 1' }}
      >
        <div className="max-h-64 overflow-y-auto">
          {finalOutput ? (
            isEditing ? (
              <TextArea
                value={editedOutput}
                onChange={(e) => setEditedOutput(e.target.value)}
                autoSize={{ minRows: 6, maxRows: 12 }}
                className="text-sm"
              />
            ) : (
              <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">
                {editedOutput || finalOutput}
              </pre>
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Spin size="large" />
              <p className="text-gray-400 dark:text-gray-600 text-sm mt-4">等待工作流完成...</p>
            </div>
          )}
        </div>

        {/* 评分信息 */}
        {score && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                综合评分
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${score.passed ? 'text-green-500' : 'text-yellow-500'}`}>
                  {score.total}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/100</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {score.dimensions.map((dim, index) => (
                <div key={index} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {dim.name}
                  </div>
                  <div className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    {Math.round(dim.score)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
