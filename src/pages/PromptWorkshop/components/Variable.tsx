import { useState } from 'react';
import { Popover, Input, Button, Empty } from 'antd';
import { PlusOutlined, CheckOutlined } from '@ant-design/icons';
import type { Category } from '@/types';
import { getCategoryStyle } from '../constants/categories';

interface VariableProps {
  variableKey: string;
  currentValue: string;
  options: string[];
  categoryId: string;
  categories: Category[];
  onSelect: (value: string) => void;
  onAddOption: (option: string) => void;
  isDarkMode: boolean;
}

export default function Variable({
  variableKey,
  currentValue,
  options,
  categoryId,
  categories,
  onSelect,
  onAddOption,
  isDarkMode,
}: VariableProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const style = getCategoryStyle(categories, categoryId);

  // 处理选择
  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  // 处理添加自定义选项
  const handleAddCustom = () => {
    if (customValue.trim()) {
      onAddOption(customValue.trim());
      onSelect(customValue.trim());
      setCustomValue('');
      setIsAdding(false);
      setIsOpen(false);
    }
  };

  // 弹窗内容
  const popoverContent = (
    <div style={{ width: 240, maxHeight: 320, overflow: 'auto' }}>
      {options.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {options.map((option, optIndex) => (
            <div
              key={optIndex}
              onClick={() => handleSelect(option)}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: currentValue === option
                  ? (isDarkMode ? style.darkBg : style.lightBg)
                  : 'transparent',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => {
                if (currentValue !== option) {
                  e.currentTarget.style.backgroundColor = isDarkMode
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.03)';
                }
              }}
              onMouseLeave={e => {
                if (currentValue !== option) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ color: isDarkMode ? style.darkText : style.text }}>
                {option}
              </span>
              {currentValue === option && (
                <CheckOutlined style={{ color: isDarkMode ? style.darkText : style.text }} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty description="暂无选项" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {/* 添加自定义选项 */}
      <div style={{ marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
        {isAdding ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Input
              size="small"
              value={customValue}
              onChange={e => setCustomValue(e.target.value)}
              onPressEnter={handleAddCustom}
              placeholder="输入自定义值"
              autoFocus
            />
            <Button size="small" type="primary" onClick={handleAddCustom}>
              确定
            </Button>
          </div>
        ) : (
          <Button
            type="dashed"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => setIsAdding(true)}
            block
          >
            添加选项
          </Button>
        )}
      </div>
    </div>
  );

  // 显示的文本
  const displayText = currentValue || `{{${variableKey}}}`;
  const isPlaceholder = !currentValue;

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={isOpen}
      onOpenChange={setIsOpen}
      placement="bottom"
      arrow={false}
    >
      <span
        className={`variable-pill ${isPlaceholder ? 'variable-pill-placeholder' : ''}`}
        style={{
          backgroundColor: isDarkMode ? style.darkBg : style.lightBg,
          color: isDarkMode ? style.darkText : style.text,
          borderColor: style.border,
        }}
      >
        {displayText}
      </span>
    </Popover>
  );
}
