import { useState, useEffect } from 'react';
import { Layout, Avatar, Dropdown, Button, Tooltip } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  BulbOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import type { User } from '../../types';
import { userApi } from '../../api';
import PersonalCenter from '../PersonalCenter';
import AddPromptModal from '../AddPromptModal';
import './index.css';

const { Header, Content } = Layout;

interface LayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [personalCenterVisible, setPersonalCenterVisible] = useState(false);
  const [addPromptVisible, setAddPromptVisible] = useState(false);
  const { theme, themeMode, setThemeMode } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
    {
      key: 'logout',
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout className="app-layout" style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        <div className="header-left">
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            className={`header-button ${location.pathname === '/' ? 'active' : ''}`}
          >
            <span style={{ marginLeft: 8 }}>首页</span>
          </Button>
          <Tooltip title="提示词优化">
            <Button
              type="text"
              icon={<BulbOutlined />}
              onClick={() => navigate('/optimizer')}
              className={`header-button ${location.pathname === '/optimizer' ? 'active' : ''}`}
            >
              <span style={{ marginLeft: 8 }}>提示词优化</span>
            </Button>
          </Tooltip>
          <Tooltip title="提示词工坊">
            <Button
              type="text"
              icon={<ToolOutlined />}
              onClick={() => navigate('/workshop')}
              className={`header-button ${location.pathname === '/workshop' ? 'active' : ''}`}
            >
              <span style={{ marginLeft: 8 }}>提示词工坊</span>
            </Button>
          </Tooltip>
        </div>
        <div className="header-right">
          {/* <span className="app-title">WePrompt</span> */}
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
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                src={user?.avatar}
                icon={<UserOutlined />}
                style={{ cursor: 'pointer', marginLeft: 16 }}
              />
            </Dropdown>
          ) : (
            <>
              <Button type="link" onClick={() => navigate('/login')} style={{ marginLeft: 16 }}>
                登录
              </Button>
              <Button type="primary" onClick={() => navigate('/register')} style={{ marginLeft: 8 }}>
                注册
              </Button>
            </>
          )}
        </div>
      </Header>
      <Layout>
        <Content className="app-content">
          {children ?? <Outlet />}
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

