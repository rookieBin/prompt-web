import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Avatar, Menu } from 'antd';
import { UserOutlined, SettingOutlined, FileTextOutlined, ToolOutlined } from '@ant-design/icons';
import type { User } from '../../types';
import { userApi } from '../../api';
import MyPrompts from './MyPrompts';
import MyWorkshop from './MyWorkshop';
import AIConfigList from './AIConfigList';
import './index.css';

interface PersonalCenterProps {
  visible: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdate: () => void;
}

export default function PersonalCenter({ visible, onClose, user, onUserUpdate }: PersonalCenterProps) {
  const [userForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('personal');

  useEffect(() => {
    if (visible && user) {
      userForm.setFieldsValue(user);
    }
  }, [visible, user, userForm]);

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

  const renderContent = () => {
    switch (selectedMenu) {
      case 'personal':
        return (
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
        );
      case 'prompts':
        return (
          <div className="section">
            <MyPrompts user={user} />
          </div>
        );
      case 'workshop':
        return (
          <div className="section">
            <MyWorkshop user={user} />
          </div>
        );
      case 'ai':
        return (
          <div className="section">
            <AIConfigList />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title="个人中心"
      open={visible}
      onCancel={onClose}
      footer={null}
      width="88vw"
      style={{ top: 32, maxWidth: 1100, padding: 0 }}
      styles={{
        body: { height: '72vh', minHeight: 520, padding: 0 },
        mask: { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' },
      }}
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
              { key: 'prompts', icon: <FileTextOutlined />, label: '我的提示词' },
              { key: 'workshop', icon: <ToolOutlined />, label: '我的工坊' },
              { key: 'ai', icon: <SettingOutlined />, label: 'AI 配置' },
            ]}
          />
        </div>
        <div className="content">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
}
