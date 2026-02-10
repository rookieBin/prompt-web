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

export default function LoginPage() {
  const navigate = useNavigate();
  const redirectTarget = useRedirectTarget();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await login(values);
      if (result.ok) {
        message.success('登录成功');
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
        <Title level={3} style={{ marginTop: 0 }}>登录</Title>
        <Text type="secondary">使用 Email + 密码登录</Text>
        <Form layout="vertical" style={{ marginTop: 20 }} onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: '请输入 Email' }, { type: 'email', message: 'Email 格式不正确' }]}>
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">还没有账号？</Text>
          {' '}
          <Link to={`/register?redirect=${encodeURIComponent(redirectTarget)}`}>去注册</Link>
        </div>
      </Card>
    </div>
  );
}
