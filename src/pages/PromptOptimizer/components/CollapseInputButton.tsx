import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

interface CollapseInputButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function CollapseInputButton({ collapsed, onToggle }: CollapseInputButtonProps) {
  return (
    <Button
      type="text"
      size="small"
      onClick={onToggle}
      icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
      className="collapse-input-button"
    />
  );
}
