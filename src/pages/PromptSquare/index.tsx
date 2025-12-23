import { useState, useEffect } from 'react';
import { Card, Tag, Button, Space, message, Pagination, Input } from 'antd';
import { 
  EyeOutlined, 
  HeartOutlined, 
  HeartFilled,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { Prompt } from '../../types';
import { promptApi } from '../../api';
import ChatModal from '../../components/ChatModal';
import AddPromptModal from '../../components/AddPromptModal';
import './index.css';
import AiButton from '@/components/AiButton';
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
          <Card
            key={prompt.id}
            className="prompt-card"
            loading={loading}
            hoverable
            actions={[
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleUse(prompt)}
              >
                使用
              </Button>,
              <Button
                type="text"
                icon={isFavorited(prompt.id) ? <HeartFilled /> : <HeartOutlined />}
                onClick={() => handleFavorite(prompt)}
                style={{ color: isFavorited(prompt.id) ? '#ff4d4f' : undefined }}
              >
                收藏
              </Button>,
            ]}
          >
            <div className="prompt-card-content">
              <h3 className="prompt-title">{prompt.title}</h3>
              <p className="prompt-author">作者: {prompt.author}</p>
              <p className="prompt-description">{prompt.description}</p>
              <div className="prompt-tags">
                {prompt.tags.map(tag => (
                  <Tag key={tag} color="blue">{tag}</Tag>
                ))}
              </div>
              <div className="prompt-stats">
                <Space>
                  <span>
                    <EyeOutlined /> {prompt.viewCount}
                  </span>
                  <span>
                    <HeartOutlined /> {prompt.favoriteCount}
                  </span>
                </Space>
              </div>
            </div>
          </Card>
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

