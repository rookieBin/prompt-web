import { useState, useEffect } from 'react';
import { Card, Button, Form, Input, InputNumber, Space, Modal, message, Empty, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { AIConfig } from '../../types';
import { aiConfigApi } from '../../api';

export default function AIConfigList() {
    const [configs, setConfigs] = useState<AIConfig[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = () => {
        setConfigs(aiConfigApi.getConfigs());
    };

    const handleAdd = () => {
        setEditingConfig(null);
        const defaultConfig = aiConfigApi.getDefaultConfig();
        form.setFieldsValue(defaultConfig);
        setModalVisible(true);
    };

    const handleEdit = (config: AIConfig) => {
        setEditingConfig(config);
        form.setFieldsValue(config);
        setModalVisible(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const configData: AIConfig = {
                ...values,
                id: editingConfig?.id || '',
                isActive: editingConfig?.isActive || false,
            };

            aiConfigApi.saveConfig(configData);
            message.success(editingConfig ? '更新成功' : '添加成功');
            setModalVisible(false);
            setEditingConfig(null);
            loadConfigs();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = (id: string) => {
        aiConfigApi.deleteConfig(id);
        message.success('删除成功');
        loadConfigs();
    };

    const handleSetActive = (id: string) => {
        aiConfigApi.setActiveConfig(id);
        message.success('已切换激活配置');
        loadConfigs();
    };

    // 隐藏 API Key 显示
    const maskApiKey = (key: string) => {
        if (!key) return '';
        if (key.length <= 8) return '****';
        return key.slice(0, 4) + '****' + key.slice(-4);
    };

    return (
        <div className="ai-config-list">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0 }}>AI 配置管理</h3>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                    添加配置
                </Button>
            </div>

            {configs.length === 0 ? (
                <Empty description="暂无配置，请添加">
                    <Button type="primary" onClick={handleAdd}>添加配置</Button>
                </Empty>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 480, overflow: 'auto' }}>
                    {configs.map(config => (
                        <Card
                            key={config.id}
                            size="small"
                            style={{
                                borderColor: config.isActive ? '#1890ff' : undefined,
                                backgroundColor: config.isActive ? 'rgba(24, 144, 255, 0.05)' : undefined,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <strong style={{ fontSize: 15 }}>{config.name}</strong>
                                        {config.isActive && (
                                            <Tag color="blue" icon={<CheckCircleOutlined />}>当前使用</Tag>
                                        )}
                                    </div>
                                    <div style={{ color: '#888', fontSize: 13, display: 'flex', gap: 16, alignItems: 'center' }}>
                                        <div>模型: <span style={{ color: '#666' }}>{config.model}</span></div>
                                        <div>API地址: <span style={{ color: '#666' }}>{config.baseURL}</span></div>
                                    </div>
                                </div>
                                <Space>
                                    {!config.isActive && (
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={() => handleSetActive(config.id)}
                                        >
                                            使用此配置
                                        </Button>
                                    )}
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(config)}
                                    />
                                    <Popconfirm
                                        title="确定删除这个配置吗？"
                                        onConfirm={() => handleDelete(config.id)}
                                        okText="确定"
                                        cancelText="取消"
                                        disabled={configs.length === 1}
                                    >
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            disabled={configs.length === 1}
                                            title={configs.length === 1 ? '至少保留一个配置' : undefined}
                                        />
                                    </Popconfirm>
                                </Space>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                title={editingConfig ? '编辑配置' : '添加配置'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingConfig(null);
                }}
                onOk={handleSave}
                width={520}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item
                        name="name"
                        label="配置名称"
                        rules={[{ required: true, message: '请输入配置名称' }]}
                    >
                        <Input placeholder="例如：GPT-4 主账号、Claude 备用" />
                    </Form.Item>
                    <Form.Item
                        name="apiKey"
                        label="API Key"
                        rules={[{ required: true, message: '请输入 API Key' }]}
                    >
                        <Input.Password placeholder="请输入 API Key" />
                    </Form.Item>
                    <Form.Item
                        name="baseURL"
                        label="Base URL"
                        rules={[{ required: true, message: '请输入 Base URL' }]}
                    >
                        <Input placeholder="例如: https://api.openai.com/v1" />
                    </Form.Item>
                    <Form.Item
                        name="model"
                        label="模型"
                        rules={[{ required: true, message: '请输入模型名称' }]}
                    >
                        <Input placeholder="例如: gpt-4, gpt-3.5-turbo, claude-3-opus" />
                    </Form.Item>
                    <Space style={{ width: '100%' }} size={16}>
                        <Form.Item name="temperature" label="Temperature" style={{ flex: 1, marginBottom: 0 }}>
                            <InputNumber
                                min={0}
                                max={2}
                                step={0.1}
                                placeholder="0.7"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                        <Form.Item name="maxTokens" label="Max Tokens" style={{ flex: 1, marginBottom: 0 }}>
                            <InputNumber
                                min={1}
                                max={128000}
                                placeholder="2000"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    </Space>
                </Form>
            </Modal>
        </div>
    );
}
