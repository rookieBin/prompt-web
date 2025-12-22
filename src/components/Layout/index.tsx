import { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import { 
  HomeOutlined, 
  PlusOutlined, 
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { User } from '../../types';
import { userApi } from '../../api';
import PersonalCenter from '../PersonalCenter';
import AddPromptModal from '../AddPromptModal';
import './index.css';

const { Header, Content, Sider } = Layout;

interface LayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [personalCenterVisible, setPersonalCenterVisible] = useState(false);
  const [addPromptVisible, setAddPromptVisible] = useState(false);
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const response = await userApi.getCurrentUser();
    if (response.code === 200) {
      setUser(response.data);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'personal',
      label: '个人中心',
      onClick: () => setPersonalCenterVisible(true),
    },
  ];

  const siderMenuItems = [
    {
      key: 'add-prompt',
      icon: <PlusOutlined />,
      label: '添加提示词',
      onClick: () => {
        setAddPromptVisible(true);
      },
    },
  ];

  return (
    <Layout className="app-layout" style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="header-left">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginRight: 16 }}
            className="header-button"
          />
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            className="header-button"
          >
            <span style={{ marginLeft: 8 }}>首页</span>
          </Button>
        </div>
        <div className="header-right">
          <span className="app-title">WePrompt</span>
          <Tooltip title={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}>
            <Button
              type="text"
              icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
              onClick={() => {
                if (themeMode === 'dark') {
                  setThemeMode('light');
                } else if (themeMode === 'light') {
                  setThemeMode('dark');
                } else {
                  // 如果当前是system，切换到相反的主题
                  setThemeMode(theme === 'dark' ? 'light' : 'dark');
                }
              }}
              style={{ marginLeft: 16, color: 'inherit' }}
            />
          </Tooltip>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Avatar 
              src={user?.avatar} 
              icon={<UserOutlined />}
              style={{ cursor: 'pointer', marginLeft: 16 }}
            />
          </Dropdown>
        </div>
      </Header>
      <Layout>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          width={200}
          theme="dark"
          className="app-sider"
        >
          <div className="sider-menu">
            {siderMenuItems.map(item => (
              <Button
                key={item.key}
                type="text"
                icon={item.icon}
                onClick={item.onClick}
                className="sider-menu-item"
                block
              >
                {!collapsed && <span style={{ marginLeft: 8 }}>{item.label}</span>}
              </Button>
            ))}
          </div>
        </Sider>
        <Content className="app-content">
          {children}
        </Content>
      </Layout>
      <PersonalCenter
        visible={personalCenterVisible}
        onClose={() => setPersonalCenterVisible(false)}
        user={user}
        onUserUpdate={loadUser}
      />
      <AddPromptModal
        visible={addPromptVisible}
        onClose={() => setAddPromptVisible(false)}
      />
    </Layout>
  );
}

