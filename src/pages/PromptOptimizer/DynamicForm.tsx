import { Form, Radio, Checkbox, Input, Space } from 'antd';

interface FormField {
  type: 'single' | 'multiple' | 'text';
  label: string;
  name: string;
  options?: string[];
  required?: boolean;
}

interface DynamicFormProps {
  fields: FormField[];
  onChange: (values: Record<string, any>) => void;
}

export function DynamicForm({ fields, onChange }: DynamicFormProps) {
  const [form] = Form.useForm();

  const handleValuesChange = () => {
    const values = form.getFieldsValue();
    onChange(values);
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
      {fields.map((field) => (
        <Form.Item
          key={field.name}
          name={field.name}
          label={field.label}
          rules={[{ required: field.required, message: `请填写${field.label}` }]}
        >
          {field.type === 'single' && (
            <Radio.Group>
              <Space direction="vertical">
                {field.options?.map((option) => (
                  <Radio key={option} value={option}>
                    {option}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          )}
          {field.type === 'multiple' && (
            <Checkbox.Group>
              <Space direction="vertical">
                {field.options?.map((option) => (
                  <Checkbox key={option} value={option}>
                    {option}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          )}
          {field.type === 'text' && (
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} />
          )}
        </Form.Item>
      ))}
    </Form>
  );
}
