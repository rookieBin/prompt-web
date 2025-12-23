import React from 'react';
import { Button } from 'antd';
import type { ButtonProps } from 'antd';
import './index.css';

export interface AiButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

const AiButton: React.FC<AiButtonProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <Button
      type="primary"
      className={`ai-button ${className || ''}`}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AiButton;
