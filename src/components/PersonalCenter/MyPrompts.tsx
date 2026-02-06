import { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Tag, message, Popconfirm, Empty, Statistic } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined, HeartOutlined } from '@ant-design/icons';
import type { Prompt, User } from '../../types';
import { promptApi } from '../../api';

interface MyPromptsProps {
    user: User | null;
}

export default function MyPrompts({ user }: MyPromptsProps) {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        if (user?.id) {
            loadPrompts();
        }
    }, [user?.id]);

    const loadPrompts = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const response = await promptApi.getMyPrompts(user.id);
            if (response.code === 200) {
                setPrompts(response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        form.setFieldsValue({
            title: prompt.title,
            description: prompt.description,
            content: prompt.content,
            tags: prompt.tags.join(', '),
        });
        setEditModalVisible(true);
    };

    const handleEditSave = async () => {
        try {
            const values = await form.validateFields();
            if (!editingPrompt) return;

            const response = await promptApi.updatePrompt(editingPrompt.id, {
                title: values.title,
                description: values.description,
                content: values.content,
                tags: values.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            });

            if (response.code === 200) {
                message.success('更新成功');
                setEditModalVisible(false);
                setEditingPrompt(null);
                loadPrompts();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        const response = await promptApi.deletePrompt(id);
        if (response.code === 200) {
            message.success('删除成功');
            loadPrompts();
        } else {
            message.error('删除失败');
        }
    };

    const columns = [
        {
            title: '标题',
            dataIndex: 'title',
            key: 'title',
            width: 200,
            ellipsis: true,
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 240,
            ellipsis: true,
        },
        {
            title: '标签',
            dataIndex: 'tags',
            key: 'tags',
            width: 180,
            render: (tags: string[]) => (
                <Space size={4} wrap>
                    {tags.slice(0, 3).map(tag => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                    {tags.length > 3 && <Tag>+{tags.length - 3}</Tag>}
                </Space>
            ),
        },
        {
            title: '数据',
            key: 'stats',
            width: 140,
            render: (_: any, record: Prompt) => (
                <Space size={16}>
                    <span style={{ color: '#888' }}>
                        <EyeOutlined /> {record.viewCount}
                    </span>
                    <span style={{ color: '#888' }}>
                        <HeartOutlined /> {record.favoriteCount}
                    </span>
                </Space>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_: any, record: Prompt) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="确定删除这个提示词吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // 统计数据
    const totalViews = prompts.reduce((sum, p) => sum + p.viewCount, 0);
    const totalFavorites = prompts.reduce((sum, p) => sum + p.favoriteCount, 0);

    return (
        <div className="my-prompts">
            <h3>我的提示词</h3>

            {prompts.length > 0 && (
                <div style={{ marginBottom: 16, display: 'flex', gap: 24 }}>
                    <Statistic title="提示词数量" value={prompts.length} />
                    <Statistic title="总浏览量" value={totalViews} prefix={<EyeOutlined />} />
                    <Statistic title="总收藏量" value={totalFavorites} prefix={<HeartOutlined />} />
                </div>
            )}

            {prompts.length === 0 && !loading ? (
                <Empty description="暂无创建的提示词" />
            ) : (
                <Table
                    columns={columns}
                    dataSource={prompts}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size="small"
                    scroll={{ y: 400 }}
                />
            )}

            <Modal
                title="编辑提示词"
                open={editModalVisible}
                onCancel={() => {
                    setEditModalVisible(false);
                    setEditingPrompt(null);
                }}
                onOk={handleEditSave}
                width={640}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="标题"
                        rules={[{ required: true, message: '请输入标题' }]}
                    >
                        <Input placeholder="请输入标题" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="描述"
                        rules={[{ required: true, message: '请输入描述' }]}
                    >
                        <Input.TextArea placeholder="请输入描述" rows={2} />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="提示词内容"
                        rules={[{ required: true, message: '请输入提示词内容' }]}
                    >
                        <Input.TextArea placeholder="请输入提示词内容" rows={6} />
                    </Form.Item>
                    <Form.Item
                        name="tags"
                        label="标签"
                        extra="多个标签用逗号分隔"
                    >
                        <Input placeholder="例如：编程, 代码, 开发" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
