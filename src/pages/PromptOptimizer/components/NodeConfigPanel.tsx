import { useEffect } from 'react';
import { Card, Form, Input, InputNumber, Slider, Select, Empty } from 'antd';
import { getWorkflowNodeMeta } from '../types';
import type { WorkflowNodeData } from '../types';

interface NodeConfigPanelProps {
  selected: { id: string; data: WorkflowNodeData } | null;
  onUpdate: (nodeId: string, patch: Partial<WorkflowNodeData>) => void;
}

export default function NodeConfigPanel({ selected, onUpdate }: NodeConfigPanelProps) {
  const [form] = Form.useForm<{
    label: string;
    description?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }>();

  useEffect(() => {
    if (!selected) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      label: selected.data.label,
      description: selected.data.description,
      model: selected.data.config.model,
      temperature: selected.data.config.temperature,
      maxTokens: selected.data.config.maxTokens,
    });
  }, [form, selected]);

  const showModel = selected?.data.type === 'adapter';

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
              ...(showModel ? { model: values.model } : {}),
              temperature: values.temperature,
              maxTokens: values.maxTokens,
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

        {showModel && (
          <Form.Item label="模型（仅 Adapter）" name="model">
            <Select
              allowClear
              placeholder="不填则使用全局配置"
              options={[
                { label: 'gpt-4', value: 'gpt-4' },
                { label: 'gpt-4o', value: 'gpt-4o' },
                { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
              ]}
            />
          </Form.Item>
        )}

        <Form.Item label="temperature" name="temperature">
          <Slider min={0} max={2} step={0.1} />
        </Form.Item>

        <Form.Item label="maxTokens" name="maxTokens">
          <InputNumber min={128} max={16000} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Card>
  );
}
