import { useMemo, useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

function useRedirectTarget() {
  const location = useLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('redirect') || '/';
  }, [location.search]);
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const redirectTarget = useRedirectTarget();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await register(values);
      if (result.ok) {
        message.success('注册成功');
        navigate(redirectTarget, { replace: true });
        return;
      }
      message.error(result.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Card style={{ width: 420, maxWidth: '100%' }}>
        <Title level={3} style={{ marginTop: 0 }}>注册</Title>
        <Text type="secondary">创建账号后将自动登录</Text>
        <Form layout="vertical" style={{ marginTop: 20 }} onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: '请输入 Email' }, { type: 'email', message: 'Email 格式不正确' }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少 6 位' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            注册并登录
          </Button>
        </Form>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">已有账号？</Text>
          {' '}
          <Link to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}>去登录</Link>
        </div>
      </Card>
    </div>
  );
}
