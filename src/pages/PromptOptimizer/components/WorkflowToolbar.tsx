import { Button, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { WorkflowNodeType } from '../types';

interface WorkflowToolbarProps {
  onAddNode: (type: WorkflowNodeType) => void;
  onDeleteSelected: () => void;
  onRun: () => void;
  onCopy: () => void;
  onReset: () => void;
  canRun: boolean;
  isRunning: boolean;
  canCopy: boolean;
  showReset: boolean;
}

const items: MenuProps['items'] = [
  {
    key: 'architect',
    label: (
      <div>
        <div>架构师</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          将用户想法转化为结构化提示词初稿
        </div>
      </div>
    ),
  },
  {
    key: 'redteamer',
    label: (
      <div>
        <div>红队专家</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          对提示词进行压力测试，找出潜在问题和漏洞
        </div>
      </div>
    ),
  },
  {
    key: 'judge',
    label: (
      <div>
        <div>评审官</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          对提示词进行多维度评分和评审
        </div>
      </div>
    ),
  },
  {
    key: 'adapter',
    label: (
      <div>
        <div>适配器</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          对提示词进行最终的格式润色和优化
        </div>
      </div>
    ),
  },
  {
    key: 'prompt_shorten',
    label: (
      <div>
        <div>提示词精简</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          在不改变意图的前提下，尽可能精简提示词
        </div>
      </div>
    ),
  },
  {
    key: 'prompt_expand',
    label: (
      <div>
        <div>提示词扩充</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          把提示词扩充为更完整可执行的模板
        </div>
      </div>
    ),
  },
  {
    key: 'style_formal',
    label: (
      <div>
        <div>风格调整（更正式）</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          把提示词改写为更正式、更专业的风格
        </div>
      </div>
    ),
  },
  {
    key: 'style_casual',
    label: (
      <div>
        <div>风格调整（更口语）</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          把提示词改写为更口语、更亲和的风格
        </div>
      </div>
    ),
  },
  {
    key: 'interactive',
    label: (
      <div>
        <div>多轮表单优化</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
          与用户多轮交互，收集信息并生成表单
        </div>
      </div>
    ),
  },
];

export default function WorkflowToolbar({
  onAddNode,
  onDeleteSelected,
  onRun,
  onCopy,
  onReset,
  canRun,
  isRunning,
  canCopy,
  showReset,
}: WorkflowToolbarProps) {
  return (
    <div className="workflow-toolbar">
      <Dropdown
        menu={{
          items,
          onClick: ({ key }) => onAddNode(key as WorkflowNodeType),
        }}
        trigger={['click']}
      >
        <Button icon={<PlusOutlined />}>添加节点</Button>
      </Dropdown>
      <Button danger icon={<DeleteOutlined />} onClick={onDeleteSelected}>
        删除选中
      </Button>
      <div className="workflow-toolbar-actions">
        <Button type="primary" onClick={onRun} disabled={!canRun || isRunning} loading={isRunning}>
          {isRunning ? '运行中...' : '运行'}
        </Button>
        <Button icon={<CopyOutlined />} onClick={onCopy} disabled={!canCopy}>
          复制
        </Button>
        {showReset && (
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            重新开始
          </Button>
        )}
      </div>
    </div>
  );
}
