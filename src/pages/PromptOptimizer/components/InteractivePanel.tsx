import { useState } from 'react';
import { Form, Button, Input, InputNumber, Select, Checkbox } from 'antd';
import type { InteractiveFormField, InteractiveRequest } from '../types';
import './InteractivePanel.css';

interface InteractivePanelProps {
  request: InteractiveRequest | null;
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function InteractivePanel({ request, onSubmit, onCancel, loading }: InteractivePanelProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [formValid, setFormValid] = useState(false);
  
  if (!request) return null;

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  };

  // 兼容旧版格式
  const title = request.title || request.form?.title || request.message;
  const description = request.description || request.form?.description;
  const fields = request.fields.length > 0 ? request.fields : 
    (request.form?.fields.map((field) => ({
      id: field.name,
      name: field.name,
      label: field.label,
      type: field.type as 'single' | 'multiple' | 'text',
      required: field.required,
      options: field.options?.map(opt => ({ label: opt, value: opt })),
      validation: undefined, // 旧版格式没有 validation
    })) || []);

  const renderField = (field: InteractiveFormField) => {
    switch (field.type) {
      case 'text':
      case 'textarea':
        return <Input.TextArea placeholder={field.placeholder} rows={3} />;
      case 'single':
        return (
          <Select placeholder={field.placeholder}>
            {field.options?.map(option => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      case 'multiple':
        return (
          <Checkbox.Group>
            {field.options?.map(option => (
              <Checkbox key={option.value} value={option.value}>
                {option.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        );
      case 'number':
        return (
          <InputNumber
            placeholder={field.placeholder}
            style={{ width: '100%' }}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );
      default:
        return <Input placeholder={field.placeholder} />;
    }
  };

  return (
    <div className="interactive-panel">
      <div className="interactive-panel-header">
        <h4>{title}</h4>
        {description && <p className="interactive-panel-description">{description}</p>}
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="interactive-panel-form"
        onValuesChange={(_, allValues) => {
          // 检查必填字段是否都已填写
          const requiredFields = fields.filter(f => f.required);
          const allRequiredFilled = requiredFields.every(field => 
            allValues[field.name] && 
            (Array.isArray(allValues[field.name]) ? allValues[field.name].length > 0 : true)
          );
          setFormValid(allRequiredFilled);
        }}
      >
        {fields.map(field => (
          <Form.Item
            key={field.id || field.name}
            name={field.name}
            label={field.label}
            rules={[
              ...(field.required ? [{ required: true, message: `请输入${field.label}` }] : []),
              ...(field.validation?.pattern ? [{ pattern: new RegExp(field.validation.pattern), message: field.validation.message }] : []),
              ...(field.validation?.min !== undefined ? [{ type: 'number' as const, min: field.validation.min, message: `最小值为${field.validation.min}` }] : []),
              ...(field.validation?.max !== undefined ? [{ type: 'number' as const, max: field.validation.max, message: `最大值为${field.validation.max}` }] : []),
            ]}
          >
            {renderField(field)}
          </Form.Item>
        ))}
        <div className="interactive-panel-actions">
          <Button onClick={onCancel}>
            取消
          </Button>
          <Button 
            type="primary" 
            htmlType="submit" 
            disabled={!formValid}
          >
            提交
          </Button>
        </div>
      </Form>
    </div>
  );
}
