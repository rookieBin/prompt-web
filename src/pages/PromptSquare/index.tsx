import { useState, useEffect } from 'react';
import { Space, message, Pagination, Input, Popover } from 'antd';
import { EyeOutlined, HeartOutlined } from '@ant-design/icons';
import type { Prompt } from '../../types';
import { promptApi } from '../../api';
import ChatModal from '../../components/ChatModal';
import AddPromptModal from '../../components/AddPromptModal';
import PromptCard from '../../components/PromptCard';
import AiButton from '@/components/AiButton';
import './index.css';

const { Search } = Input;

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'programming', label: '编程开发' },
  { key: 'writing', label: '文案写作' },
  { key: 'business', label: '商务办公' },
  { key: 'design', label: '设计创意' },
  { key: 'data', label: '数据分析' },
  { key: 'other', label: '其他' },
];

export default function PromptSquare() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [recommendedPrompts, setRecommendedPrompts] = useState<Prompt[]>([]);
  const [hotPrompts, setHotPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [popoverVisible, setPopoverVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadRecommendedPrompts();
    loadHotPrompts();
  }, []);

  useEffect(() => {
    loadPrompts();
  }, [currentPage, searchKeyword, activeCategory]);

  const loadRecommendedPrompts = async () => {
    try {
      const response = await promptApi.getRecommendedPrompts();
      if (response.code === 200) {
        console.log('推荐提示词加载成功:', response.data.length, '条');
        setRecommendedPrompts(response.data);
      }
    } catch (error) {
      console.error('加载推荐提示词失败', error);
    }
  };

  const loadHotPrompts = async () => {
    try {
      const response = await promptApi.getHotPrompts();
      if (response.code === 200) {
        console.log('热门提示词加载成功:', response.data.length, '条');
        setHotPrompts(response.data);
      }
    } catch (error) {
      console.error('加载热门提示词失败', error);
    }
  };

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await promptApi.getPrompts({
        page: currentPage,
        pageSize,
        category: activeCategory === 'all' ? undefined : activeCategory,
        keyword: searchKeyword || undefined,
      });
      if (response.code === 200) {
        setPrompts(response.data.list);
        setTotal(response.data.total);
      }
    } catch (error) {
      message.error('加载提示词失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setChatModalVisible(true);
  };

  const handleFavorite = async (prompt: Prompt) => {
    try {
      const response = await promptApi.toggleFavorite(prompt.id);
      if (response.code === 200) {
        message.success(response.data.favorited ? '已收藏' : '已取消收藏');
        loadPrompts();
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const isFavorited = (id: string) => {
    return promptApi.isFavorited(id);
  };

  return (
    <div className="prompt-square">
      <div className="prompt-square-header">
        <h1>提示词广场</h1>
        <Space>
          <Search
            placeholder="搜索提示词..."
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchKeyword}
            onChange={(e) => !e.target.value && setSearchKeyword('')}
          />
          <AiButton
            onClick={() => setAddModalVisible(true)}
          >
            添加提示词
          </AiButton>
        </Space>
      </div>

      {/* 推荐和热门板块 - 左右布局 */}
      {!searchKeyword && (recommendedPrompts.length > 0 || hotPrompts.length > 0) && (
        <div className="compact-sections">
          {/* 推荐板块 */}
          {recommendedPrompts.length > 0 && (
            <div className="compact-section">
              <div className="section-header">
                <h2 className="section-title">推荐</h2>
              </div>
              <div className="prompt-list">
                {recommendedPrompts.slice(0, 3).map(prompt => {
                  const popoverId = `recommended-${prompt.id}`;
                  return (
                    <Popover
                      key={prompt.id}
                      content={
                        <div className="prompt-card-popover">
                          <PromptCard
                            prompt={prompt}
                            loading={false}
                            isFavorited={isFavorited(prompt.id)}
                            onUse={(p) => {
                              handleUse(p);
                              setPopoverVisible({ ...popoverVisible, [popoverId]: false });
                            }}
                            onFavorite={handleFavorite}
                            disableHover={true}
                          />
                        </div>
                      }
                      trigger="click"
                      open={popoverVisible[popoverId]}
                      onOpenChange={(visible) => setPopoverVisible({ ...popoverVisible, [popoverId]: visible })}
                      placement="rightTop"
                      overlayClassName="prompt-popover"
                      arrow={false}
                    >
                      <div className="prompt-list-item">
                        <div className="prompt-list-content">
                          <span className="prompt-list-title">{prompt.title}</span>
                          <span className="prompt-list-description">{prompt.description}</span>
                        </div>
                        <div className="prompt-list-stats">
                          <span className="stat-item">
                            <EyeOutlined /> {prompt.viewCount}
                          </span>
                          <span className="stat-item">
                            <HeartOutlined /> {prompt.favoriteCount}
                          </span>
                        </div>
                      </div>
                    </Popover>
                  );
                })}
              </div>
            </div>
          )}

          {/* 热门板块 */}
          {hotPrompts.length > 0 && (
            <div className="compact-section">
              <div className="section-header">
                <h2 className="section-title">热门</h2>
              </div>
              <div className="prompt-list">
                {hotPrompts.slice(0, 3).map(prompt => {
                  const popoverId = `hot-${prompt.id}`;
                  return (
                    <Popover
                      key={prompt.id}
                      content={
                        <div className="prompt-card-popover">
                          <PromptCard
                            prompt={prompt}
                            loading={false}
                            isFavorited={isFavorited(prompt.id)}
                            onUse={(p) => {
                              handleUse(p);
                              setPopoverVisible({ ...popoverVisible, [popoverId]: false });
                            }}
                            onFavorite={handleFavorite}
                            disableHover={true}
                          />
                        </div>
                      }
                      trigger="click"
                      open={popoverVisible[popoverId]}
                      onOpenChange={(visible) => setPopoverVisible({ ...popoverVisible, [popoverId]: visible })}
                      placement="rightTop"
                      overlayClassName="prompt-popover"
                      arrow={false}
                    >
                      <div className="prompt-list-item">
                        <div className="prompt-list-content">
                          <span className="prompt-list-title">{prompt.title}</span>
                          <span className="prompt-list-description">{prompt.description}</span>
                        </div>
                        <div className="prompt-list-stats">
                          <span className="stat-item">
                            <EyeOutlined /> {prompt.viewCount}
                          </span>
                          <span className="stat-item">
                            <HeartOutlined /> {prompt.favoriteCount}
                          </span>
                        </div>
                      </div>
                    </Popover>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 分类板块 */}
      <div className="prompt-section">
        <div className="section-header">
          <h2 className="section-title">广场</h2>
          <div className="category-tabs">
            {CATEGORIES.map(category => (
              <button
                key={category.key}
                className={`category-tab ${activeCategory === category.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(category.key);
                  setCurrentPage(1);
                }}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
        <div className="prompt-grid">
          {prompts.map(prompt => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              loading={loading}
              isFavorited={isFavorited(prompt.id)}
              onUse={handleUse}
              onFavorite={handleFavorite}
            />
          ))}
        </div>

        {prompts.length === 0 && !loading && (
          <div className="empty-state">
            <p>暂无提示词</p>
          </div>
        )}

        <div className="pagination-wrapper">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={setCurrentPage}
            showSizeChanger={false}
          />
        </div>
      </div>

      <ChatModal
        visible={chatModalVisible}
        onClose={() => {
          setChatModalVisible(false);
          setSelectedPrompt(null);
        }}
        prompt={selectedPrompt}
      />

      <AddPromptModal
        visible={addModalVisible}
        onClose={() => {
          setAddModalVisible(false);
          loadPrompts();
        }}
      />
    </div>
  );
}
