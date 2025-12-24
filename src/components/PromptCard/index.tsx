import { memo, useState } from 'react';
import { Tag, Button, Space, message } from 'antd';
import {
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  PlayCircleOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { Prompt } from '../../types';
import './index.css';

interface PromptCardProps {
  prompt: Prompt;
  loading?: boolean;
  isFavorited: boolean;
  onUse: (prompt: Prompt) => void;
  onFavorite: (prompt: Prompt) => void;
}

function PromptCardComponent({
  prompt,
  loading,
  isFavorited,
  onUse,
  onFavorite,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopied(true);
      message.success('已复制提示词');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('复制失败');
    }
  };

  return (
    <div className={`prompt-card ${loading ? 'loading' : ''}`}>
      {/* 渐变覆盖层 */}
      <div className="prompt-card-overlay" />

      {/* 卡片内容 */}
      <div className="prompt-card-header">
        <div className="prompt-card-title-row">
          <h3 className="prompt-card-title">{prompt.title}</h3>
          <button
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="复制提示词"
          >
            {copied ? <CheckOutlined /> : <CopyOutlined />}
          </button>
        </div>
        <span className="prompt-card-author">@{prompt.author}</span>
      </div>

      <div className="prompt-card-body">
        <p className="prompt-card-description">{prompt.description}</p>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="prompt-card-tags">
            {prompt.tags.map((tag) => (
              <Tag key={tag} className="prompt-tag">
                {tag}
              </Tag>
            ))}
          </div>
        )}

        <div className="prompt-card-stats">
          <Space size="middle">
            <span className="stat-item">
              <EyeOutlined /> {prompt.viewCount}
            </span>
            <span className="stat-item">
              <HeartOutlined /> {prompt.favoriteCount}
            </span>
          </Space>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="prompt-card-actions">
        <Button
          type="text"
          className="action-btn"
          icon={<PlayCircleOutlined />}
          onClick={() => onUse(prompt)}
        >
          使用
        </Button>
        <Button
          type="text"
          className={`action-btn ${isFavorited ? 'favorited' : ''}`}
          icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
          onClick={() => onFavorite(prompt)}
        >
          收藏
        </Button>
      </div>

      {/* 底部渐变线 */}
      <div className="prompt-card-accent" />
    </div>
  );
}

// Memoize 优化
const arePropsEqual = (
  prevProps: PromptCardProps,
  nextProps: PromptCardProps
) => {
  const prev = prevProps.prompt;
  const next = nextProps.prompt;

  return (
    prev.id === next.id &&
    prev.title === next.title &&
    prev.description === next.description &&
    prev.viewCount === next.viewCount &&
    prev.favoriteCount === next.favoriteCount &&
    prevProps.isFavorited === nextProps.isFavorited &&
    prevProps.loading === nextProps.loading
  );
};

export const PromptCard = memo(PromptCardComponent, arePropsEqual);
export default PromptCard;
