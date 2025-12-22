import { useState, useEffect, useRef } from 'react';
import { Modal, Collapse, Select, message, Space, Button } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { Bubble, Sender, Attachments, CodeHighlighter } from '@ant-design/x';
import type { Prompt, Message, AIConfig } from '../../types';
import { chatApi, aiConfigApi } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';
import './index.css';

// Sender组件的ref类型
type SenderRef = React.ComponentRef<typeof Sender>;

// 动态导入 react-syntax-highlighter 样式
// 由于 react-syntax-highlighter 是 @ant-design/x 的依赖，需要使用动态导入

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  prompt: Prompt | null;
}

// 解析消息内容，支持代码块高亮
function MessageContent({ content }: { content: string }) {
  const { theme } = useTheme();
  const [highlightStyle, setHighlightStyle] = useState<any>(null);
  
  // 动态加载语法高亮样式
  useEffect(() => {
    const loadStyles = async () => {
      try {
        // @ts-ignore - react-syntax-highlighter 类型定义可能不完整
        const styles = await import('react-syntax-highlighter/dist/esm/styles/prism');
        const style = theme === 'dark' ? styles.oneDark : styles.oneLight;
        setHighlightStyle(style);
      } catch (error) {
        console.warn('Failed to load syntax highlighter styles:', error);
        setHighlightStyle({});
      }
    };
    loadStyles();
  }, [theme]);
  
  // 匹配代码块：```language\ncode\n``` 或 ```\ncode\n```
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // 添加代码块前的文本
    if (match.index > lastIndex) {
      const textContent = content.substring(lastIndex, match.index);
      if (textContent.trim()) {
        parts.push({
          type: 'text',
          content: textContent,
        });
      }
    }
    
    // 添加代码块，去除首尾空白
    const codeContent = match[2].trim();
    if (codeContent) {
      parts.push({
        type: 'code',
        content: codeContent,
        language: match[1] || 'text',
      });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // 添加剩余的文本
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    if (remainingText.trim()) {
      parts.push({
        type: 'text',
        content: remainingText,
      });
    }
  }
  
  // 如果没有代码块，直接返回文本
  if (parts.length === 0) {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>;
  }
  
  return (
    <div>
      {parts.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeHighlighter
              key={index}
              lang={part.language || 'text'}
              style={{ marginTop: index > 0 ? 8 : 0, marginBottom: 8 }}
              highlightProps={{
                style: highlightStyle || {},
              }}
            >
              {part.content}
            </CodeHighlighter>
          );
        } else {
          return (
            <div key={index} style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}>
              {part.content}
            </div>
          );
        }
      })}
    </div>
  );
}

export default function ChatModal({ visible, onClose, prompt }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const senderRef = useRef<SenderRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && prompt) {
      // 初始化消息，包含提示词内容
      const initialMessage: Message = {
        id: 'system',
        role: 'assistant',
        content: `提示词内容：\n${prompt.content}\n\n现在你可以开始与AI对话了。`,
        createdAt: new Date().toISOString(),
      };
      setMessages([initialMessage]);
      
      // 加载AI配置
      const aiConfig = aiConfigApi.getConfig();
      if (!aiConfig || !aiConfig.apiKey) {
        message.warning('请先在个人中心配置AI API');
      }
      setConfig(aiConfig);
    } else {
      setMessages([]);
      setAttachments([]);
      // 清除输入框和文件输入
      setTimeout(() => {
        if (senderRef.current) {
          senderRef.current.clear();
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 0);
    }
  }, [visible, prompt]);

  useEffect(() => {
    // 滚动到底部
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (value: string) => {
    if (!config || !config.apiKey) {
      message.error('请先在个人中心配置AI API');
      return;
    }

    // 处理附件和图片
    const images: string[] = [];
    const attachmentPromises = attachments.map((file) => {
      return new Promise<{ name: string; url: string; type: string; size?: number }>((resolve) => {
        if (file instanceof File) {
          if (file.type.startsWith('image/')) {
            // 如果是图片，转换为base64
            const reader = new FileReader();
            reader.onload = (e) => {
              const base64 = e.target?.result as string;
              images.push(base64);
              resolve({
                name: file.name,
                url: base64,
                type: file.type,
                size: file.size,
              });
            };
            reader.readAsDataURL(file);
          } else {
            // 其他文件类型
            const url = URL.createObjectURL(file);
            resolve({
              name: file.name,
              url: url,
              type: file.type || 'application/octet-stream',
              size: file.size,
            });
          }
        } else {
          resolve({
            name: 'unknown',
            url: '',
            type: 'application/octet-stream',
            size: 0,
          });
        }
      });
    });

    const attachmentList = await Promise.all(attachmentPromises);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: value,
      images: images.length > 0 ? images : undefined,
      attachments: attachmentList.length > 0 ? attachmentList : undefined,
      createdAt: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      // 构建完整的消息历史（包含系统提示词）
      const systemMessage: Message = {
        id: 'system-prompt',
        role: 'assistant',
        content: prompt ? `系统提示词：\n${prompt.content}` : '',
        createdAt: new Date().toISOString(),
      };

      const allMessages = [systemMessage, ...newMessages.filter(msg => msg.id !== 'system')];
      const response = await chatApi.sendMessage(allMessages, config);
      
      if (response.code === 200) {
        setMessages([...newMessages, response.data]);
        // 清除附件和输入框
        setAttachments([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setTimeout(() => {
          if (senderRef.current) {
            senderRef.current.clear();
          }
        }, 0);
      } else {
        message.error(response.message || '发送失败');
      }
    } catch (error) {
      message.error('发送失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const modelOptions = [
    { label: 'GPT-4', value: 'gpt-4' },
    { label: 'GPT-4 Vision', value: 'gpt-4-vision-preview' },
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
    { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet-20240229' },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>AI对话</span>
          {config && (
            <Select
              value={config.model}
              options={modelOptions}
              onChange={(value) => {
                const newConfig = { ...config, model: value };
                setConfig(newConfig);
                aiConfigApi.saveConfig(newConfig);
              }}
              style={{ width: 180 }}
            />
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      className="chat-modal"
    >
      <div className="chat-modal-content">
        {prompt && (
          <Collapse
            ghost
            className="prompt-collapse"
            items={[
              {
                key: 'prompt',
                label: `提示词: ${prompt.title}`,
                children: (
                  <div className="prompt-content">
                    <pre style={{ 
                      whiteSpace: 'pre-wrap', 
                      wordBreak: 'break-word',
                      color: 'var(--text-color)',
                      margin: 0,
                    }}>
                      {prompt.content}
                    </pre>
                  </div>
                ),
              },
            ]}
          />
        )}

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message chat-message-${msg.role}`}
              >
                <Bubble
                  content={
                    <div>
                      {msg.content && <MessageContent content={msg.content} />}
                      {msg.images && msg.images.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {msg.images.map((img: string, i: number) => (
                            <img
                              key={i}
                              src={img}
                              alt={`上传的图片 ${i + 1}`}
                              style={{
                                maxWidth: '100%',
                                maxHeight: '300px',
                                borderRadius: '4px',
                                objectFit: 'contain',
                              }}
                            />
                          ))}
                        </div>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {msg.attachments.map((att, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span>📎</span>
                              <a 
                                href={att.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                              >
                                {att.name}
                              </a>
                              {att.size && (
                                <span style={{ fontSize: '12px', opacity: 0.7 }}>
                                  ({(att.size / 1024).toFixed(1)} KB)
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                  placement={msg.role === 'user' ? 'end' : 'start'}
                />
              </div>
            ))}
            {loading && (
              <div className="chat-message chat-message-assistant">
                <Bubble
                  content="正在思考..."
                  placement="start"
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-sender">
            {/* 附件列表显示区域 - 只在有附件时显示 */}
            {attachments.length > 0 && (
              <div className="attachments-preview">
                <Attachments
                  items={attachments.map((file, index) => ({
                    uid: `${index}-${file.name}`,
                    name: file.name,
                    status: 'done' as const,
                    originFileObj: file as any,
                  }))}
                  onChange={({ fileList }) => {
                    const files = fileList
                      .filter(file => file.originFileObj)
                      .map(file => file.originFileObj as File);
                    setAttachments(files);
                  }}
                  beforeUpload={() => false}
                  multiple
                  showUploadList={{
                    showRemoveIcon: true,
                  }}
                />
              </div>
            )}
            
            <div className="sender-wrapper">
              <Sender
                ref={senderRef}
                onSubmit={(value) => {
                  handleSend(value);
                }}
                loading={loading}
                placeholder="输入消息..."
                submitType="enter"
                prefix={
                  <Space>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt,.md"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setAttachments(prev => [...prev, ...files]);
                        // 清空input以便可以重复选择同一文件
                        if (e.target) {
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button
                      type="text"
                      icon={<PaperClipOutlined />}
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      title="上传附件"
                    />
                  </Space>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
