import { useState, useEffect } from 'react';
import { Space, message, Pagination, Input } from 'antd';
import type { Prompt } from '../../types';
import { promptApi } from '../../api';
import ChatModal from '../../components/ChatModal';
import AddPromptModal from '../../components/AddPromptModal';
import PromptCard from '../../components/PromptCard';
import AiButton from '@/components/AiButton';
import './index.css';

const { Search } = Input;

export default function PromptSquare() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadPrompts();
  }, [currentPage, searchKeyword]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await promptApi.getPrompts({
        page: currentPage,
        pageSize,
      });
      if (response.code === 200) {
        let filteredPrompts = response.data.list;

        // 简单的搜索过滤
        if (searchKeyword) {
          filteredPrompts = filteredPrompts.filter(p =>
            p.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            p.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchKeyword.toLowerCase()))
          );
        }

        setPrompts(filteredPrompts);
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
