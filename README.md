# 提示词平台

一个基于 React + Ant Design + Ant Design X 构建的提示词管理平台。

## 技术栈

- **React** - 前端框架
- **Ant Design** - UI 组件库
- **Ant Design X** - AI 组件库
- **React Router** - 路由管理
- **TypeScript** - 类型支持
- **Vite** - 构建工具
- **pnpm** - 包管理器

## 功能特性

- ✅ 暗黑色主题界面
- ✅ 顶部导航栏（项目名、用户头像、个人中心）
- ✅ 左侧可折叠抽屉导航（添加提示词）
- ✅ 提示词广场（卡片展示、搜索、分页）
- ✅ 提示词使用（AI对话Modal）
- ✅ 提示词收藏功能
- ✅ 个人中心（用户信息、AI API配置）
- ✅ 完善的接口封装（便于后端对接）

## 开始使用

### 安装依赖

```bash
pnpm install
```

### 开发

```bash
pnpm dev
```

### 构建

```bash
pnpm build
```

### 预览

```bash
pnpm preview
```

## 项目结构

```
src/
├── api/              # API接口封装
├── components/       # 组件
│   ├── Layout/       # 布局组件
│   ├── ChatModal/    # AI对话Modal
│   ├── AddPromptModal/ # 添加提示词Modal
│   └── PersonalCenter/ # 个人中心
├── pages/            # 页面
│   └── PromptSquare/ # 提示词广场
├── types/            # 类型定义
└── App.tsx           # 主应用
```

## 接口说明

所有API接口都在 `src/api/index.ts` 中定义，目前使用 localStorage 模拟数据。后续对接后端时，只需修改 `ApiClient` 类的 `request` 方法即可。

### 主要API

- `promptApi` - 提示词相关API
- `userApi` - 用户相关API
- `aiConfigApi` - AI配置API
- `chatApi` - AI对话API

## 后端对接

当需要对接后端时，修改 `src/api/index.ts` 中的 `ApiClient.request` 方法，将 localStorage 模拟逻辑替换为真实的 HTTP 请求。

示例：

```typescript
private async request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const response = await fetch(`${this.baseURL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}
```

## 注意事项

- AI API配置需要在个人中心设置后才能使用AI对话功能
- 数据存储在 localStorage 中，刷新页面不会丢失
- 暗黑色主题已全局配置
