import { useState } from 'react';
import { Modal, Form, Input, Button, message, Tag, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { Prompt } from '../../types';
import { promptApi, userApi } from '../../api';
import './index.css';

const { TextArea } = Input;

interface AddPromptModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddPromptModal({ visible, onClose }: AddPromptModalProps) {
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (tags.length === 0) {
        message.warning('请至少添加一个标签');
        return;
      }

      setLoading(true);
      const userResponse = await userApi.getCurrentUser();
      const user = userResponse.data;

      const newPrompt: Omit<Prompt, 'id' | 'viewCount' | 'favoriteCount' | 'createdAt' | 'updatedAt'> = {
        title: values.title,
        author: user.username,
        authorId: user.id,
        description: values.description,
        content: values.content,
        tags,
      };

      const response = await promptApi.createPrompt(newPrompt);
      if (response.code === 200) {
        message.success('添加成功');
        form.resetFields();
        setTags([]);
        setTagInput('');
        onClose();
      } else {
        message.error(response.message || '添加失败');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Modal
      title="添加提示词"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
      className="add-prompt-modal"
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        >
          <Input placeholder="请输入提示词标题" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
          rules={[{ required: true, message: '请输入描述' }]}
        >
          <TextArea
            rows={3}
            placeholder="请输入提示词描述"
          />
        </Form.Item>

        <Form.Item
          name="content"
          label="提示词内容"
          rules={[{ required: true, message: '请输入提示词内容' }]}
        >
          <TextArea
            rows={8}
            placeholder="请输入提示词内容，可以使用 {变量名} 的形式定义变量"
          />
        </Form.Item>

        <Form.Item label="标签">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onPressEnter={handleAddTag}
                placeholder="输入标签后按回车添加"
              />
              <Button icon={<PlusOutlined />} onClick={handleAddTag}>
                添加
              </Button>
            </Space.Compact>
            <div className="tag-container">
              {tags.map(tag => (
                <Tag
                  key={tag}
                  closable
                  onClose={() => handleRemoveTag(tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

