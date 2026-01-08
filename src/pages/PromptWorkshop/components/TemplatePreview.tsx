import { useMemo } from 'react';
import type { WorkshopTemplate, Bank, Category } from '@/types';
import Variable from './Variable';

interface TemplatePreviewProps {
  template: WorkshopTemplate;
  banks: Bank[];
  categories: Category[];
  onSelectVariable: (variableKey: string, index: number, value: string) => void;
  onAddBankOption: (bankKey: string, option: string) => void;
  isDarkMode: boolean;
}

// 变量解析正则
const VARIABLE_REGEX = /(\{\{[^{}\n]+\}\})/g;

export default function TemplatePreview({
  template,
  banks,
  categories,
  onSelectVariable,
  onAddBankOption,
  isDarkMode,
}: TemplatePreviewProps) {
  // 解析并渲染内容
  const renderedContent = useMemo(() => {
    const lines = template.content.split('\n');
    const counters: Record<string, number> = {};

    return lines.map((line, lineIndex) => {
      // 空行处理
      if (!line.trim()) {
        return <div key={lineIndex} style={{ height: 24 }} />;
      }

      // 解析行中的变量
      const parts = line.split(VARIABLE_REGEX);

      const elements = parts.map((part, partIndex) => {
        if (part.startsWith('{{') && part.endsWith('}}')) {
          const varName = part.slice(2, -2).trim();
          // 解析变量名（支持 varName_groupId 格式）
          const baseKey = varName.replace(/_\d+$/, '');

          // 计算当前变量的索引
          const index = counters[varName] || 0;
          counters[varName] = index + 1;

          const uniqueKey = `${varName}-${index}`;

          // 查找对应的词库
          const bank = banks.find(b => b.key === baseKey || b.key === varName);
          const categoryId = bank?.category || 'other';

          // 获取当前选择的值
          const currentValue = template.selections[uniqueKey] || '';

          return (
            <Variable
              key={`${lineIndex}-${partIndex}`}
              variableKey={varName}
              currentValue={currentValue}
              options={bank?.options || []}
              categoryId={categoryId}
              categories={categories}
              onSelect={(value) => onSelectVariable(varName, index, value)}
              onAddOption={(option) => onAddBankOption(baseKey, option)}
              isDarkMode={isDarkMode}
            />
          );
        }

        // 处理普通文本
        return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
      });

      return (
        <div key={lineIndex} className="template-preview-line">
          {elements}
        </div>
      );
    });
  }, [template.content, template.selections, banks, categories, isDarkMode, onSelectVariable, onAddBankOption]);

  return (
    <div className="template-preview">
      {renderedContent}
    </div>
  );
}
