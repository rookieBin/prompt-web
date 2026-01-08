import { useState, useMemo } from 'react';
import { Input, Button, Tooltip, Empty } from 'antd';
import { SearchOutlined, PlusOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import type { Bank, Category } from '@/types';
import { getCategoryStyle } from '../constants/categories';

interface BanksSidebarProps {
  banks: Bank[];
  categories: Category[];
  onInsertVariable: (bankKey: string) => void;
  isEditing: boolean;
  isDarkMode: boolean;
}

export default function BanksSidebar({
  banks,
  categories,
  onInsertVariable,
  isEditing,
  isDarkMode,
}: BanksSidebarProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.map(c => c.id)
  );
  const [expandedBanks, setExpandedBanks] = useState<string[]>([]);

  // 按分类分组词库
  const groupedBanks = useMemo(() => {
    const groups: Record<string, Bank[]> = {};
    categories.forEach(cat => {
      groups[cat.id] = [];
    });

    banks.forEach(bank => {
      const categoryId = bank.category || 'other';
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }

      // 搜索过滤
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchLabel = bank.label.toLowerCase().includes(keyword);
        const matchKey = bank.key.toLowerCase().includes(keyword);
        const matchOptions = bank.options.some(opt =>
          opt.toLowerCase().includes(keyword)
        );
        if (matchLabel || matchKey || matchOptions) {
          groups[categoryId].push(bank);
        }
      } else {
        groups[categoryId].push(bank);
      }
    });

    return groups;
  }, [banks, categories, searchKeyword]);

  // 切换分类展开状态
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // 切换词库展开状态
  const toggleBank = (bankKey: string) => {
    setExpandedBanks(prev =>
      prev.includes(bankKey)
        ? prev.filter(k => k !== bankKey)
        : [...prev, bankKey]
    );
  };

  return (
    <div className="banks-sidebar">
      <div className="banks-sidebar-header">
        <h3 className="banks-sidebar-title">词库管理</h3>
        <Input
          className="banks-sidebar-search"
          placeholder="搜索词库..."
          prefix={<SearchOutlined />}
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          allowClear
        />
      </div>

      <div className="banks-sidebar-content">
        {categories.map(category => {
          const categoryBanks = groupedBanks[category.id] || [];
          const isExpanded = expandedCategories.includes(category.id);
          const style = getCategoryStyle(categories, category.id);

          if (categoryBanks.length === 0 && searchKeyword) {
            return null;
          }

          return (
            <div key={category.id} className="bank-category-section">
              {/* 分类标题 */}
              <div
                className="bank-category-header"
                onClick={() => toggleCategory(category.id)}
              >
                {isExpanded ? <DownOutlined /> : <RightOutlined />}
                <span
                  className="bank-category-dot"
                  style={{ backgroundColor: isDarkMode ? style.darkText : style.text }}
                />
                <span className="bank-category-label">{category.label}</span>
                <span className="bank-category-count">{categoryBanks.length}</span>
              </div>

              {/* 分类下的词库 */}
              {isExpanded && (
                <div style={{ paddingLeft: 16 }}>
                  {categoryBanks.length === 0 ? (
                    <Empty
                      description="暂无词库"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ margin: '12px 0' }}
                    />
                  ) : (
                    categoryBanks.map(bank => {
                      const isBankExpanded = expandedBanks.includes(bank.key);

                      return (
                        <div key={bank.key}>
                          <div
                            className="bank-item"
                            onClick={() => toggleBank(bank.key)}
                          >
                            <div className="bank-item-info">
                              <span
                                className="bank-item-key"
                                style={{
                                  backgroundColor: isDarkMode ? style.darkBg : style.lightBg,
                                  color: isDarkMode ? style.darkText : style.text,
                                }}
                              >
                                {`{{${bank.key}}}`}
                              </span>
                              <span className="bank-item-label">{bank.label}</span>
                            </div>

                            {isEditing && (
                              <Tooltip title="插入变量">
                                <Button
                                  className="bank-item-insert"
                                  type="text"
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={e => {
                                    e.stopPropagation();
                                    onInsertVariable(bank.key);
                                  }}
                                />
                              </Tooltip>
                            )}
                          </div>

                          {/* 展开显示选项 */}
                          {isBankExpanded && (
                            <div style={{ paddingLeft: 12, marginBottom: 8 }}>
                              {bank.options.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: 12,
                                    color: 'var(--text-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <span>{option}</span>
                                </div>
                              ))}
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '4px 8px' }}>
                                共 {bank.options.length} 个选项
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
