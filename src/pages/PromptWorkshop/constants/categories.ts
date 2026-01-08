import type { Category, CategoryColor, CategoryStyle } from '@/types';

// 默认分类配置
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'character', label: '人物', color: 'blue' },
  { id: 'item', label: '物品', color: 'amber' },
  { id: 'action', label: '动作', color: 'rose' },
  { id: 'location', label: '地点', color: 'emerald' },
  { id: 'visual', label: '画面', color: 'violet' },
  { id: 'other', label: '其他', color: 'slate' },
];

// 分类样式映射
export const CATEGORY_STYLES: Record<CategoryColor, CategoryStyle> = {
  blue: {
    text: '#2563eb',
    bg: '#dbeafe',
    border: '#93c5fd',
    hoverBg: '#bfdbfe',
    lightBg: '#eff6ff',
    darkBg: 'rgba(59, 130, 246, 0.2)',
    darkText: '#60a5fa',
  },
  amber: {
    text: '#d97706',
    bg: '#fef3c7',
    border: '#fcd34d',
    hoverBg: '#fde68a',
    lightBg: '#fffbeb',
    darkBg: 'rgba(245, 158, 11, 0.2)',
    darkText: '#fbbf24',
  },
  rose: {
    text: '#e11d48',
    bg: '#ffe4e6',
    border: '#fda4af',
    hoverBg: '#fecdd3',
    lightBg: '#fff1f2',
    darkBg: 'rgba(244, 63, 94, 0.2)',
    darkText: '#fb7185',
  },
  emerald: {
    text: '#059669',
    bg: '#d1fae5',
    border: '#6ee7b7',
    hoverBg: '#a7f3d0',
    lightBg: '#ecfdf5',
    darkBg: 'rgba(16, 185, 129, 0.2)',
    darkText: '#34d399',
  },
  violet: {
    text: '#7c3aed',
    bg: '#ede9fe',
    border: '#c4b5fd',
    hoverBg: '#ddd6fe',
    lightBg: '#f5f3ff',
    darkBg: 'rgba(139, 92, 246, 0.2)',
    darkText: '#a78bfa',
  },
  slate: {
    text: '#475569',
    bg: '#f1f5f9',
    border: '#cbd5e1',
    hoverBg: '#e2e8f0',
    lightBg: '#f8fafc',
    darkBg: 'rgba(100, 116, 139, 0.2)',
    darkText: '#94a3b8',
  },
};

// 根据分类ID获取样式
export function getCategoryStyle(categories: Category[], categoryId: string): CategoryStyle {
  const category = categories.find(c => c.id === categoryId);
  const color = category?.color || 'slate';
  return CATEGORY_STYLES[color];
}
