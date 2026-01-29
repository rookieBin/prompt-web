import { useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Empty } from 'antd';
import { getWorkflowNodeMeta } from '../types';
import type { StyleAdjustMode, WorkflowNodeData } from '../types';

interface NodeConfigPanelProps {
  selected: { id: string; data: WorkflowNodeData } | null;
  onUpdate: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
}

export default function NodeConfigPanel({ selected, onUpdate }: NodeConfigPanelProps) {
  const [form] = Form.useForm<{
    label: string;
    description?: string;
    targetModel?: string;
    targetLength?: number;
    styleMode?: StyleAdjustMode;
  }>();

  useEffect(() => {
    if (!selected) {
      form.resetFields();
      return;
    }

    const config = selected.data.config || {};
    const targetModelValue = typeof config.targetModel === 'string' ? config.targetModel : undefined;
    const targetLengthValue = typeof config.targetLength === 'number' ? config.targetLength : undefined;
    const styleModeValue = config.styleMode === 'casual' || config.styleMode === 'formal' ? config.styleMode : undefined;

    form.setFieldsValue({
      label: selected.data.label,
      description: selected.data.description,
      targetModel: targetModelValue,
      targetLength: targetLengthValue,
      styleMode: styleModeValue,
    });
  }, [form, selected]);

  const showTargetModel = selected?.data.type === 'adapter';
  const showStyleMode = selected?.data.type === 'style_adjust';
  const showTargetLength = selected?.data.type === 'length_adjust';

  return (
    <Card
      size="small"
      className="node-config-panel"
      title="节点配置"
      extra={
        selected ? (
          <span className="node-config-type">{getWorkflowNodeMeta(selected.data.type).label}</span>
        ) : null
      }
    >
      {!selected && <Empty description="请选择一个节点" />}
      <Form
        form={form}
        layout="vertical"
        disabled={!selected}
        onValuesChange={(_, values) => {
          if (!selected) return;
          onUpdate(selected.id, {
            label: values.label,
            description: values.description,
            config: {
              ...(showTargetModel ? { targetModel: values.targetModel } : {}),
              ...(showStyleMode ? { styleMode: values.styleMode } : {}),
              ...(showTargetLength ? { targetLength: values.targetLength } : {}),
            },
          });
        }}
      >
        <Form.Item label="名称" name="label" rules={[{ required: true, message: '请输入名称' }]}>
          <Input />
        </Form.Item>

        <Form.Item label="功能描述" name="description">
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>

        {showTargetModel && (
          <Form.Item label="目标适配模型" name="targetModel">
            <Select
              allowClear
              placeholder="请选择目标适配模型"
              options={[
                { label: 'GPT-4.1', value: 'gpt-4.1' },
                { label: 'GPT-4o', value: 'gpt-4o' },
                { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
                { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
                { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
                { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
                { label: 'DeepSeek-R1', value: 'deepseek-r1' },
                { label: 'DeepSeek-V2', value: 'deepseek-v2' },
                { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                { label: 'Llama 3.1 70B', value: 'llama-3.1-70b' },
                { label: 'Llama 3.1 8B', value: 'llama-3.1-8b' },
                { label: 'Codex', value: 'codex' },
              ]}
            />
          </Form.Item>
        )}

        {showStyleMode && (
          <Form.Item label="语气风格" name="styleMode" rules={[{ required: true, message: '请选择风格' }]}>
            <Select
              options={[
                { label: '更正式（Formal）', value: 'formal' },
                { label: '更口语（Casual）', value: 'casual' },
              ]}
            />
          </Form.Item>
        )}

        {showTargetLength && (
          <Form.Item label="预期文字长度" name="targetLength" rules={[{ required: true, message: '请输入长度' }]}>
            <InputNumber min={50} max={4000} placeholder="例如 300" style={{ width: '100%' }} />
          </Form.Item>
        )}
      </Form>
    </Card>
  );
}
