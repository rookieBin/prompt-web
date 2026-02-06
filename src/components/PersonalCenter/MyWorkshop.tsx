import { useState, useEffect } from 'react';
import { Tabs, Table, Button, Space, Tag, Empty, Popconfirm, message, Modal, Input, List } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { WorkshopTemplate, Bank, User } from '../../types';

interface MyWorkshopProps {
    user: User | null;
}

const STORAGE_KEYS = {
    TEMPLATES: 'workshop_templates',
    BANKS: 'workshop_banks',
};

export default function MyWorkshop({ user }: MyWorkshopProps) {
    const [templates, setTemplates] = useState<WorkshopTemplate[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(false);
    const [addBankOptionModal, setAddBankOptionModal] = useState<{ visible: boolean; bank: Bank | null }>({
        visible: false,
        bank: null,
    });
    const [newOption, setNewOption] = useState('');

    useEffect(() => {
        loadData();
    }, [user?.id]);

    const loadData = () => {
        setLoading(true);
        try {
            // 加载模板
            const storedTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
            const allTemplates: WorkshopTemplate[] = storedTemplates ? JSON.parse(storedTemplates) : [];
            // 过滤当前用户的模板（如果有 userId）或显示所有模板
            const userTemplates = user?.id
                ? allTemplates.filter(t => !t.userId || t.userId === user.id)
                : allTemplates;
            setTemplates(userTemplates);

            // 加载词库
            const storedBanks = localStorage.getItem(STORAGE_KEYS.BANKS);
            const allBanks: Bank[] = storedBanks ? JSON.parse(storedBanks) : getDefaultBanks();
            setBanks(allBanks);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = (id: string) => {
        const storedTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
        const allTemplates: WorkshopTemplate[] = storedTemplates ? JSON.parse(storedTemplates) : [];
        const newTemplates = allTemplates.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(newTemplates));
        setTemplates(templates.filter(t => t.id !== id));
        message.success('删除成功');
    };

    const handleAddBankOption = () => {
        if (!addBankOptionModal.bank || !newOption.trim()) return;

        const bankKey = addBankOptionModal.bank.key;
        const storedBanks = localStorage.getItem(STORAGE_KEYS.BANKS);
        const allBanks: Bank[] = storedBanks ? JSON.parse(storedBanks) : getDefaultBanks();

        const bankIndex = allBanks.findIndex(b => b.key === bankKey);
        if (bankIndex !== -1) {
            if (!allBanks[bankIndex].options.includes(newOption.trim())) {
                allBanks[bankIndex].options.push(newOption.trim());
                localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(allBanks));
                setBanks(allBanks);
                message.success('添加成功');
            } else {
                message.warning('选项已存在');
            }
        }

        setNewOption('');
        setAddBankOptionModal({ visible: false, bank: null });
    };

    const handleDeleteBankOption = (bankKey: string, option: string) => {
        const storedBanks = localStorage.getItem(STORAGE_KEYS.BANKS);
        const allBanks: Bank[] = storedBanks ? JSON.parse(storedBanks) : getDefaultBanks();

        const bankIndex = allBanks.findIndex(b => b.key === bankKey);
        if (bankIndex !== -1) {
            allBanks[bankIndex].options = allBanks[bankIndex].options.filter(o => o !== option);
            localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(allBanks));
            setBanks(allBanks);
            message.success('删除成功');
        }
    };

    const templateColumns = [
        {
            title: '模板名称',
            dataIndex: 'name',
            key: 'name',
            width: 200,
        },
        {
            title: '内容预览',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            render: (content: string) => (
                <span style={{ color: '#888' }}>{content.slice(0, 80)}...</span>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (date: string) => new Date(date).toLocaleString('zh-CN'),
        },
        {
            title: '操作',
            key: 'action',
            width: 80,
            render: (_: any, record: WorkshopTemplate) => (
                <Popconfirm
                    title="确定删除这个模板吗？"
                    onConfirm={() => handleDeleteTemplate(record.id)}
                    okText="确定"
                    cancelText="取消"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    const items = [
        {
            key: 'templates',
            label: '我的模板',
            children: (
                <>
                    {templates.length === 0 && !loading ? (
                        <Empty description="暂无模板，请在工坊页面创建" />
                    ) : (
                        <Table
                            columns={templateColumns}
                            dataSource={templates}
                            rowKey="id"
                            loading={loading}
                            pagination={false}
                            size="small"
                            scroll={{ y: 360 }}
                        />
                    )}
                </>
            ),
        },
        {
            key: 'banks',
            label: '我的词库',
            children: (
                <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    <List
                        dataSource={banks}
                        renderItem={bank => (
                            <List.Item
                                actions={[
                                    <Button
                                        key="add"
                                        type="link"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => setAddBankOptionModal({ visible: true, bank })}
                                    >
                                        添加选项
                                    </Button>,
                                ]}
                            >
                                <List.Item.Meta
                                    title={<span>{bank.label} <Tag color="blue">{bank.key}</Tag></span>}
                                    description={
                                        <Space size={4} wrap style={{ marginTop: 8 }}>
                                            {bank.options.map(option => (
                                                <Tag
                                                    key={option}
                                                    closable
                                                    onClose={(e) => {
                                                        e.preventDefault();
                                                        handleDeleteBankOption(bank.key, option);
                                                    }}
                                                >
                                                    {option}
                                                </Tag>
                                            ))}
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="my-workshop">
            <h3>我的工坊</h3>
            <Tabs items={items} defaultActiveKey="templates" />

            <Modal
                title={`为「${addBankOptionModal.bank?.label}」添加选项`}
                open={addBankOptionModal.visible}
                onCancel={() => {
                    setAddBankOptionModal({ visible: false, bank: null });
                    setNewOption('');
                }}
                onOk={handleAddBankOption}
                okText="添加"
                cancelText="取消"
            >
                <Input
                    placeholder="请输入新选项"
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    onPressEnter={handleAddBankOption}
                />
            </Modal>
        </div>
    );
}

// 默认词库数据
function getDefaultBanks(): Bank[] {
    return [
        {
            key: 'role',
            label: '角色身份',
            category: 'character',
            options: ['专业程序员', '资深产品经理', '创意设计师', '数据分析师', '技术架构师'],
        },
        {
            key: 'personality',
            label: '性格特点',
            category: 'character',
            options: ['严谨细致', '富有创意', '耐心友好', '直接高效', '幽默风趣'],
        },
        {
            key: 'task',
            label: '任务类型',
            category: 'action',
            options: ['代码审查', '功能开发', 'Bug修复', '性能优化', '文档编写'],
        },
        {
            key: 'output',
            label: '输出格式',
            category: 'format',
            options: ['Markdown格式', 'JSON格式', '表格形式', '分步骤说明', '简洁总结'],
        },
    ];
}
