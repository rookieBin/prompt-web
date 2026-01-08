import { useRef } from 'react';
import type { Bank, Category } from '@/types';
import { getCategoryStyle } from '../constants/categories';

interface VisualEditorProps {
  content: string;
  onChange: (content: string) => void;
  banks: Bank[];
  categories: Category[];
  isDarkMode: boolean;
}

// 变量解析正则
const VARIABLE_REGEX = /(\{\{[^{}\n]+\}\})/g;

export default function VisualEditor({
  content,
  onChange,
  banks,
  categories,
  isDarkMode,
}: VisualEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // 同步滚动
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // 渲染高亮内容
  const renderHighlights = () => {
    const parts = content.split(VARIABLE_REGEX);

    return parts.map((part, index) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varName = part.slice(2, -2).trim();
        // 解析变量名（支持 varName_groupId 格式）
        const baseKey = varName.replace(/_\d+$/, '');

        // 查找对应的词库
        const bank = banks.find(b => b.key === baseKey || b.key === varName);
        const categoryId = bank?.category || 'other';
        const style = getCategoryStyle(categories, categoryId);

        return (
          <span
            key={index}
            className="variable-highlight"
            style={{
              backgroundColor: isDarkMode ? style.darkBg : style.lightBg,
              color: isDarkMode ? style.darkText : style.text,
              border: `1px solid ${style.border}`,
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="visual-editor-container">
      {/* 背景层 - 显示高亮 */}
      <pre ref={preRef} className="visual-editor-bg">
        {renderHighlights()}
      </pre>

      {/* 前景层 - 输入 */}
      <textarea
        ref={textareaRef}
        className="visual-editor-textarea"
        value={content}
        onChange={e => onChange(e.target.value)}
        onScroll={handleScroll}
        placeholder="在这里编写你的提示词模板...&#10;&#10;使用 {{变量名}} 语法插入变量，例如：&#10;你是一个 {{role}}，请帮我 {{task}}。"
        spellCheck={false}
      />
    </div>
  );
}
