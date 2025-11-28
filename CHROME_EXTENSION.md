# Chrome 插件兼容性说明

## 项目结构设计考虑

本提示词平台在开发时已考虑了与 Chrome 插件的兼容性，以下是主要的设计考虑：

### 1. API 设计友好

所有的核心功能都通过模拟的 API 方式设计：
- `handleUsePrompt()` - 使用提示词
- `handleStarPrompt()` - 收藏提示词  
- `handleAddPrompt()` - 新增提示词
- `handleEditPrompt()` - 编辑提示词

这些函数可以很容易地被 Chrome 插件调用。

### 2. 数据结构标准化

提示词的数据结构已经标准化：

```typescript
interface Prompt {
  id: number
  title: string
  description: string
  content: string
  author: string
  category: string
  tags: string[]
  stars: number
  views: number
  createdAt: string
}
```

### 3. 建议的 Chrome 插件集成方式

#### 3.1 内容脚本注入
Chrome 插件可以通过 content script 与网页交互：

```javascript
// 在插件中获取页面上的提示词
window.postMessage({
  type: 'GET_PROMPTS',
  source: 'chrome-extension'
}, '*');

// 监听页面响应
window.addEventListener('message', (event) => {
  if (event.data.type === 'PROMPTS_DATA') {
    // 处理提示词数据
  }
});
```

#### 3.2 本地存储同步
插件可以访问用户的个人提示词库：

```javascript
// 从网页获取用户的提示词
chrome.storage.sync.get(['userPrompts'], (result) => {
  // 使用存储的提示词
});
```

#### 3.3 快捷操作
插件可以提供快捷方式：
- 右键菜单快速插入提示词
- 快捷键调用常用提示词
- 浮动面板显示提示词列表

### 4. 推荐的插件功能

1. **快速访问**: 在任意网页上快速访问个人提示词库
2. **一键插入**: 在文本框中一键插入选择的提示词
3. **智能推荐**: 根据当前页面内容推荐相关提示词
4. **离线同步**: 缓存常用提示词到本地，支持离线使用

### 5. Web API 预留

为了更好的插件兼容性，建议在实现时预留以下 API：

```javascript
// 暴露给插件的全局方法
window.PromptHub = {
  getPrompts: () => { /* 获取提示词列表 */ },
  getUserPrompts: () => { /* 获取用户提示词 */ },
  usePrompt: (promptId) => { /* 使用提示词 */ },
  addPrompt: (promptData) => { /* 添加提示词 */ },
  onPromptUpdate: (callback) => { /* 监听提示词更新 */ }
};
```

### 6. 开发建议

- 插件代码建议放在 `chrome-extension/` 目录下
- 使用 Vite 的构建配置来同时构建 Web 应用和插件
- 共享 TypeScript 类型定义
- 使用统一的样式系统（Element Plus 变量）

## 下一步

当你准备开发 Chrome 插件时，可以基于这个设计开始实施。主要的 Web 应用已经为插件集成做好了准备。