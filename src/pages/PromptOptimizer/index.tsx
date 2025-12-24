import { useState } from 'react';
import { Input, Button, Space, message, Spin, Card } from 'antd';
import { aiConfigApi } from '@/api';
import { DynamicForm } from './DynamicForm';
import './index.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface FormField {
  type: 'single' | 'multiple' | 'text';
  label: string;
  name: string;
  options?: string[];
  required?: boolean;
}

interface FormData {
  title: string;
  description: string;
  fields: FormField[];
}

interface ChatResponse {
  stage: 'need_form' | 'final_prompt';
  form?: FormData;
  optimized_prompt?: string;
  raw_answer?: string;
}

export default function PromptOptimizer() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentForm, setCurrentForm] = useState<FormData | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState('');

  const sendMessage = async (query: string, formAnswer?: string): Promise<ChatResponse> => {
    const config = aiConfigApi.getConfig();
    if (!config?.difyApiKey) {
      throw new Error('请先在个人中心配置 Dify API Key');
    }

    const inputs: any = { raw_prompt: query };
    if (formAnswer) {
      inputs.form_answer = formAnswer;
    }

    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs,
        query: formAnswer || query,
        response_mode: 'blocking',
        user: 'user-' + Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error('请求失败');
    }

    const data = await response.json();
    const answer = data.answer;

    try {
      const jsonMatch = answer.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          stage: parsed.stage,
          form: parsed.form,
          optimized_prompt: parsed.optimized_prompt,
          raw_answer: answer,
        };
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }

    return {
      stage: 'final_prompt',
      optimized_prompt: answer,
      raw_answer: answer,
    };
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      message.error('请输入提示词');
      return;
    }

    setLoading(true);
    setMessages([{ role: 'user', content: prompt }]);

    try {
      const response = await sendMessage(prompt);
      setMessages(prev => [...prev, { role: 'assistant', content: response.raw_answer || '' }]);

      if (response.stage === 'need_form' && response.form) {
        setCurrentForm(response.form);
        setFormValues({});
      } else if (response.stage === 'final_prompt') {
        setFinalPrompt(response.optimized_prompt || '');
        setCurrentForm(null);
      }
    } catch (error: any) {
      message.error(error.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async () => {
    const hasAllRequired = currentForm?.fields.every((field: any) => 
      !field.required || formValues[field.name]
    );

    if (!hasAllRequired) {
      message.error('请填写所有必填项');
      return;
    }

    setLoading(true);
    const formAnswer = JSON.stringify(formValues);
    setMessages(prev => [...prev, { role: 'user', content: formAnswer }]);

    try {
      const response = await sendMessage(prompt, formAnswer);
      setMessages(prev => [...prev, { role: 'assistant', content: response.raw_answer || '' }]);

      if (response.stage === 'need_form' && response.form) {
        setCurrentForm(response.form);
        setFormValues({});
      } else if (response.stage === 'final_prompt') {
        setFinalPrompt(response.optimized_prompt || '');
        setCurrentForm(null);
      }
    } catch (error: any) {
      message.error(error.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPrompt('');
    setMessages([]);
    setCurrentForm(null);
    setFormValues({});
    setFinalPrompt('');
  };

  return (
    <div className="prompt-optimizer-page">
      <Card title="提示词优化" className="optimizer-card">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {messages.length === 0 ? (
            <>
              <Input.TextArea
                placeholder="请输入你想优化的提示词，例如：你是一个前端工程师"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                autoSize={{ minRows: 4, maxRows: 8 }}
              />
              <Button type="primary" onClick={handleSubmit} loading={loading} block>
                开始优化
              </Button>
            </>
          ) : (
            <>
              <div className="messages-container">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message-item message-${msg.role}`}
                  >
                    <div className="message-role">
                      {msg.role === 'user' ? '你' : 'AI'}
                    </div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
                {loading && <Spin />}
              </div>

              {finalPrompt && (
                <div className="final-prompt">
                  <div className="final-prompt-title">优化完成</div>
                  <div className="final-prompt-label">优化后的提示词：</div>
                  <div className="final-prompt-content">
                    {finalPrompt}
                  </div>
                </div>
              )}

              {currentForm && !loading && (
                <Card 
                  size="small" 
                  title={currentForm.title}
                  className="form-card"
                >
                  <div className="form-description">{currentForm.description}</div>
                  <DynamicForm
                    fields={currentForm.fields}
                    onChange={setFormValues}
                  />
                  <Button 
                    type="primary" 
                    onClick={handleFormSubmit} 
                    style={{ marginTop: 12 }}
                    block
                  >
                    提交
                  </Button>
                </Card>
              )}

              {(finalPrompt || (!currentForm && !loading)) && (
                <Button onClick={handleReset} block>
                  重新开始
                </Button>
              )}
            </>
          )}
        </Space>
      </Card>
    </div>
  );
}
