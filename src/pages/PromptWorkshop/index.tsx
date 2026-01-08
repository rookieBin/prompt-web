import { useState, useEffect } from 'react';
import { Button, Input, Empty, Spin } from 'antd';
import { EditOutlined, CopyOutlined } from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';
import type { WorkshopTemplate, Bank, Category } from '@/types';
import { DEFAULT_CATEGORIES } from './constants/categories';
import { DEFAULT_BANKS, DEFAULT_TEMPLATES } from './constants/banks';
import VisualEditor from './components/VisualEditor';
import TemplatePreview from './components/TemplatePreview';
import TemplateList from './components/TemplateList';
import BanksSidebar from './components/BanksSidebar';
import './index.css';

const STORAGE_KEYS = {
  TEMPLATES: 'workshop_templates',
  BANKS: 'workshop_banks',
  CATEGORIES: 'workshop_categories',
  ACTIVE_TEMPLATE: 'workshop_active_template',
};

export default function PromptWorkshop() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // 状态管理
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<WorkshopTemplate[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  // 当前活动模板
  const activeTemplate = templates.find(t => t.id === activeTemplateId) || null;

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // 加载分类
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const cats = savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES;
      setCategories(cats);

      // 加载词库
      const savedBanks = localStorage.getItem(STORAGE_KEYS.BANKS);
      const bnks = savedBanks ? JSON.parse(savedBanks) : DEFAULT_BANKS;
      setBanks(bnks);

      // 加载模板
      const savedTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      const tmpls = savedTemplates ? JSON.parse(savedTemplates) : DEFAULT_TEMPLATES;
      setTemplates(tmpls);

      // 加载活动模板ID
      const savedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEMPLATE);
      if (savedActiveId && tmpls.some((t: WorkshopTemplate) => t.id === savedActiveId)) {
        setActiveTemplateId(savedActiveId);
      } else if (tmpls.length > 0) {
        setActiveTemplateId(tmpls[0].id);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setCategories(DEFAULT_CATEGORIES);
      setBanks(DEFAULT_BANKS);
      setTemplates(DEFAULT_TEMPLATES);
      if (DEFAULT_TEMPLATES.length > 0) {
        setActiveTemplateId(DEFAULT_TEMPLATES[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  // 保存数据到 localStorage
  const saveTemplates = (newTemplates: WorkshopTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(newTemplates));
  };

  const saveBanks = (newBanks: Bank[]) => {
    setBanks(newBanks);
    localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(newBanks));
  };

  const saveActiveTemplateId = (id: string | null) => {
    setActiveTemplateId(id);
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_TEMPLATE);
    }
  };

  // 模板操作
  const handleSelectTemplate = (id: string) => {
    setIsEditing(false);
    saveActiveTemplateId(id);
  };

  const handleCreateTemplate = () => {
    const newTemplate: WorkshopTemplate = {
      id: `template-${Date.now()}`,
      name: '新建模板',
      content: '你是一个{{role}}，请帮我{{task}}。',
      selections: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newTemplates = [...templates, newTemplate];
    saveTemplates(newTemplates);
    saveActiveTemplateId(newTemplate.id);
    setIsEditing(true);
    setEditContent(newTemplate.content);
  };

  const handleUpdateTemplate = (id: string, updates: Partial<WorkshopTemplate>) => {
    const newTemplates = templates.map(t =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    saveTemplates(newTemplates);
  };

  const handleDeleteTemplate = (id: string) => {
    const newTemplates = templates.filter(t => t.id !== id);
    saveTemplates(newTemplates);
    if (activeTemplateId === id) {
      saveActiveTemplateId(newTemplates.length > 0 ? newTemplates[0].id : null);
    }
  };

  // 编辑操作
  const handleStartEdit = () => {
    if (activeTemplate) {
      setEditContent(activeTemplate.content);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    if (activeTemplate) {
      handleUpdateTemplate(activeTemplate.id, { content: editContent });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  // 变量选择
  const handleSelectVariable = (variableKey: string, index: number, value: string) => {
    if (!activeTemplate) return;
    const uniqueKey = `${variableKey}-${index}`;
    const newSelections = { ...activeTemplate.selections, [uniqueKey]: value };
    handleUpdateTemplate(activeTemplate.id, { selections: newSelections });
  };

  // 插入变量到编辑器
  const handleInsertVariable = (bankKey: string) => {
    if (isEditing) {
      setEditContent(prev => prev + ` {{${bankKey}}} `);
    }
  };

  // 词库操作
  const handleAddBankOption = (bankKey: string, option: string) => {
    const newBanks = banks.map(b =>
      b.key === bankKey ? { ...b, options: [...b.options, option] } : b
    );
    saveBanks(newBanks);
  };

  // 生成最终提示词
  const generateFinalPrompt = (): string => {
    if (!activeTemplate) return '';

    let result = activeTemplate.content;
    const regex = /\{\{([^}]+)\}\}/g;
    const counters: Record<string, number> = {};

    result = result.replace(regex, (match, varName) => {
      const key = varName.trim();
      const index = counters[key] || 0;
      counters[key] = index + 1;

      const uniqueKey = `${key}-${index}`;
      const value = activeTemplate.selections[uniqueKey];

      if (value) {
        return value;
      }

      // 使用词库的第一个选项作为默认值
      const bank = banks.find(b => b.key === key);
      if (bank && bank.options.length > 0) {
        return bank.options[0];
      }

      return match; // 保持原样
    });

    return result;
  };

  // 复制最终提示词
  const handleCopyPrompt = async () => {
    const prompt = generateFinalPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      // 可以添加成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="workshop-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={`prompt-workshop ${isDarkMode ? 'dark' : ''}`}>
      {/* 左侧：模板列表 */}
      <div className="workshop-sidebar-left">
        <TemplateList
          templates={templates}
          activeTemplateId={activeTemplateId}
          onSelect={handleSelectTemplate}
          onCreate={handleCreateTemplate}
          onDelete={handleDeleteTemplate}
          onRename={(id, name) => handleUpdateTemplate(id, { name })}
        />
      </div>

      {/* 中间：编辑器/预览区 */}
      <div className="workshop-main">
        {activeTemplate ? (
          <>
            <div className="workshop-main-header">
              <Input
                value={activeTemplate.name}
                onChange={e => handleUpdateTemplate(activeTemplate.id, { name: e.target.value })}
                className="template-name-input"
                bordered={false}
              />
              <div className="workshop-main-actions">
                {isEditing ? (
                  <>
                    <Button onClick={handleCancelEdit}>取消</Button>
                    <Button type="primary" onClick={handleSaveEdit}>保存</Button>
                  </>
                ) : (
                  <>
                    <Button icon={<EditOutlined />} onClick={handleStartEdit}>编辑</Button>
                    <Button icon={<CopyOutlined />} onClick={handleCopyPrompt}>复制提示词</Button>
                  </>
                )}
              </div>
            </div>

            <div className="workshop-main-content">
              {isEditing ? (
                <VisualEditor
                  content={editContent}
                  onChange={setEditContent}
                  banks={banks}
                  categories={categories}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <TemplatePreview
                  template={activeTemplate}
                  banks={banks}
                  categories={categories}
                  onSelectVariable={handleSelectVariable}
                  onAddBankOption={handleAddBankOption}
                  isDarkMode={isDarkMode}
                />
              )}
            </div>
          </>
        ) : (
          <Empty description="请选择或创建一个模板" />
        )}
      </div>

      {/* 右侧：词库侧边栏 */}
      <div className="workshop-sidebar-right">
        <BanksSidebar
          banks={banks}
          categories={categories}
          onInsertVariable={handleInsertVariable}
          isEditing={isEditing}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
}
