import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Avatar, Menu } from 'antd';
import { UserOutlined, SettingOutlined } from '@ant-design/icons';
import type { User, AIConfig } from '../../types';
import { userApi, aiConfigApi } from '../../api';
import './index.css';

interface PersonalCenterProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdate: () => void;
}

export default function PersonalCenter({ visible, onClose, user, onUserUpdate }: PersonalCenterProps) {
  const [userForm] = Form.useForm();
  const [aiConfigForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('personal');

  useEffect(() => {
    if (visible && user) {
      userForm.setFieldsValue(user);
    }
  }, [visible, user, userForm]);

  useEffect(() => {
    if (visible) {
      const config = aiConfigApi.getConfig() || aiConfigApi.getDefaultConfig();
      aiConfigForm.setFieldsValue(config);
    }
  }, [visible, aiConfigForm]);

  const handleUserUpdate = async () => {
    try {
      const values = await userForm.validateFields();
      setLoading(true);
      const response = await userApi.updateUser(values);
      if (response.code === 200) {
        message.success('更新成功');
        onUserUpdate();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIConfigSave = () => {
    try {
      const values = aiConfigForm.getFieldsValue();
      aiConfigApi.saveConfig(values as AIConfig);
      message.success('AI配置已保存');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal
      title="个人中心"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="100vw"
      style={{ top: 0, maxWidth: '100vw', padding: 0 }}
      styles={{ body: { height: 'calc(100vh - 55px)', padding: 0 } }}
      className="personal-center-modal"
    >
      <div className="personal-center-layout">
        <div className="sidebar">
          <Menu
            mode="vertical"
            selectedKeys={[selectedMenu]}
            onClick={({ key }) => setSelectedMenu(key)}
            items={[
              { key: 'personal', icon: <UserOutlined />, label: '个人信息' },
              { key: 'ai', icon: <SettingOutlined />, label: 'AI 配置' }
            ]}
          />
        </div>
        <div className="content">
          {selectedMenu === 'personal' && (
            <div className="section">
              <h3>个人信息</h3>
              <Form
                form={userForm}
                layout="vertical"
                onFinish={handleUserUpdate}
              >
                <Form.Item label="头像">
                  <Avatar 
                    src={user?.avatar} 
                    icon={<UserOutlined />}
                    size={64}
                  />
                </Form.Item>
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input placeholder="请输入用户名" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="邮箱"
                >
                  <Input placeholder="请输入邮箱" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    更新信息
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
          {selectedMenu === 'ai' && (
            <div className="section">
              <h3>AI配置</h3>
              <Form
                form={aiConfigForm}
                layout="vertical"
                onFinish={handleAIConfigSave}
              >
                <Form.Item
                  name="apiKey"
                  label="API Key"
                  rules={[{ required: true, message: '请输入API Key' }]}
                >
                  <Input.Password placeholder="请输入API Key" />
                </Form.Item>
                <Form.Item
                  name="baseURL"
                  label="Base URL"
                  rules={[{ required: true, message: '请输入Base URL' }]}
                >
                  <Input placeholder="例如: https://api.openai.com/v1" />
                </Form.Item>
                <Form.Item
                  name="model"
                  label="模型"
                  rules={[{ required: true, message: '请选择模型' }]}
                >
                  <Input placeholder="例如: gpt-4, gpt-3.5-turbo" />
                </Form.Item>
                <Form.Item
                  name="temperature"
                  label="Temperature"
                >
                  <InputNumber
                    min={0}
                    max={2}
                    step={0.1}
                    placeholder="0.7"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  name="maxTokens"
                  label="Max Tokens"
                >
                  <InputNumber
                    min={1}
                    max={4000}
                    placeholder="2000"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item
                  name="difyApiKey"
                  label="Dify API Key"
                >
                  <Input.Password placeholder="请输入Dify API Key" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    保存配置
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

