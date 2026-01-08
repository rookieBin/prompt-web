import { useState } from 'react';
import { Button, Input, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { WorkshopTemplate } from '@/types';

interface TemplateListProps {
  templates: WorkshopTemplate[];
  activeTemplateId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}

export default function TemplateList({
  templates,
  activeTemplateId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: TemplateListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
      setEditingId(null);
      setEditName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  return (
    <div className="template-list">
      <div className="template-list-header">
        <h3 className="template-list-title">模板列表</h3>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={onCreate}
        >
          新建
        </Button>
      </div>

      <div className="template-list-content">
        {templates.map(template => (
          <div
            key={template.id}
            className={`template-list-item ${template.id === activeTemplateId ? 'active' : ''}`}
            onClick={() => {
              if (editingId !== template.id) {
                onSelect(template.id);
              }
            }}
          >
            {editingId === template.id ? (
              <Input
                size="small"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onPressEnter={handleSaveEdit}
                onClick={e => e.stopPropagation()}
                autoFocus
                style={{ flex: 1, marginRight: 8 }}
              />
            ) : (
              <span className="template-list-item-name">{template.name}</span>
            )}

            <div className="template-list-item-actions" onClick={e => e.stopPropagation()}>
              {editingId === template.id ? (
                <>
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={handleSaveEdit}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleCancelEdit}
                  />
                </>
              ) : (
                <>
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleStartEdit(template.id, template.name)}
                  />
                  <Popconfirm
                    title="确定删除此模板？"
                    onConfirm={() => onDelete(template.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
