# WePrompt 后端接口文档

> 版本：v1.1.0
> 更新时间：2026-01-23
> 基础路径：`/api`

---

## 一、通用说明

### 1.1 响应格式

所有接口统一返回以下 JSON 格式：

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码，200=成功，400=参数错误，401=未授权，404=未找到，500=服务器错误 |
| message | string | 状态信息 |
| data | object | 响应数据 |

### 1.2 分页响应格式

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 1.3 请求头

```
Content-Type: application/json
Authorization: Bearer {token}  // 需要登录的接口
```

---

## 二、用户模块

### 2.1 获取当前用户信息

**接口地址：** `GET /api/user/current`

**请求参数：** 无

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "1",
    "username": "用户名",
    "avatar": "https://example.com/avatar.jpg",
    "email": "user@example.com"
  }
}
```

**User 实体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 用户ID |
| username | string | 是 | 用户名 |
| avatar | string | 否 | 头像URL |
| email | string | 否 | 邮箱 |

---

### 2.2 更新用户信息

**接口地址：** `PUT /api/user/current`

**请求参数：**
```json
{
  "username": "新用户名",
  "avatar": "https://example.com/new-avatar.jpg",
  "email": "newemail@example.com"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "1",
    "username": "新用户名",
    "avatar": "https://example.com/new-avatar.jpg",
    "email": "newemail@example.com"
  }
}
```

---

## 三、提示词广场模块

### 3.1 获取提示词列表（分页）

**接口地址：** `GET /api/prompts`

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 是 | 页码，从1开始 |
| pageSize | int | 是 | 每页数量 |
| keyword | string | 否 | 搜索关键词（匹配标题、描述、标签） |
| category | string | 否 | 按分类筛选（programming/writing/business/design/data/other） |

**请求示例：** `GET /api/prompts?page=1&pageSize=12&category=programming&keyword=代码`

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "1",
        "title": "代码审查助手",
        "author": "开发者A",
        "authorId": "user1",
        "description": "帮助审查代码，找出潜在问题和改进建议",
        "content": "你是一个专业的代码审查助手...",
        "tags": ["编程", "代码审查", "开发"],
        "viewCount": 1250,
        "favoriteCount": 89,
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 12
  }
}
```

**Prompt 实体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 提示词ID |
| title | string | 是 | 标题 |
| author | string | 是 | 作者名称 |
| authorId | string | 是 | 作者ID |
| description | string | 是 | 描述 |
| content | string | 是 | 提示词内容 |
| tags | string[] | 是 | 标签数组 |
| viewCount | int | 是 | 查看次数 |
| favoriteCount | int | 是 | 收藏次数 |
| createdAt | string | 是 | 创建时间 (ISO 8601) |
| updatedAt | string | 是 | 更新时间 (ISO 8601) |

---

### 3.2 获取推荐提示词

**接口地址：** `GET /api/prompts/recommended`

**请求参数：** 无

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "1",
      "title": "代码审查助手",
      "author": "开发者A",
      "authorId": "user1",
      "description": "帮助审查代码，找出潜在问题和改进建议",
      "content": "你是一个专业的代码审查助手...",
      "tags": ["编程", "代码审查", "开发"],
      "viewCount": 1250,
      "favoriteCount": 89,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

**说明：**
- 返回推荐的提示词列表（建议6-8个）
- 推荐算法可基于：收藏数、查看数、用户偏好等
- 前端会展示前4个在推荐板块

---

### 3.3 获取热门提示词

**接口地址：** `GET /api/prompts/hot`

**请求参数：** 无

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "2",
      "title": "产品文案撰写",
      "author": "文案师B",
      "authorId": "user2",
      "description": "生成吸引人的产品描述和营销文案",
      "content": "你是一个专业的产品文案撰写专家...",
      "tags": ["文案", "营销", "产品"],
      "viewCount": 980,
      "favoriteCount": 67,
      "createdAt": "2024-01-14T15:30:00Z",
      "updatedAt": "2024-01-14T15:30:00Z"
    }
  ]
}
```

**说明：**
- 返回热门的提示词列表（建议6-8个）
- 热门算法可基于：近期查看数、收藏增长率等
- 前端会展示前4个在热门板块

---

### 3.4 获取提示词详情

**接口地址：** `GET /api/prompts/{id}`

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 提示词ID |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "1",
    "title": "代码审查助手",
    "author": "开发者A",
    "authorId": "user1",
    "description": "帮助审查代码...",
    "content": "你是一个专业的代码审查助手...",
    "tags": ["编程", "代码审查"],
    "viewCount": 1251,
    "favoriteCount": 89,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

**说明：** 每次调用此接口，`viewCount` 应该自动 +1

---

### 3.4.1 分类系统说明

提示词广场支持以下分类：

| 分类值 | 显示名称 | 匹配关键词 |
|--------|----------|-----------|
| programming | 编程开发 | 编程、代码、开发、API、测试、重构、优化、QA、质量、数据库、性能、安全、审计 |
| writing | 文案写作 | 文案、写作、创意、文学、内容 |
| business | 商务办公 | 商务、邮件、沟通、产品、用户故事、需求、项目管理、计划、规划、报告、商业 |
| design | 设计创意 | 设计、UI、UX |
| data | 数据分析 | 数据分析、数据 |
| other | 其他 | 不属于以上分类的提示词 |

**分类判断逻辑：**
- 后端应根据提示词的 `tags` 字段判断其所属分类
- 如果标签中包含某个分类的关键词，则归入该分类
- 一个提示词只归入一个分类（优先级按上表顺序）
- 如果不匹配任何分类，则归入"其他"

---

### 3.5 创建提示词

**接口地址：** `POST /api/prompts`

**请求参数：**
```json
{
  "title": "新提示词标题",
  "description": "提示词描述",
  "content": "提示词内容...",
  "tags": ["标签1", "标签2"]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 |
| description | string | 是 | 描述 |
| content | string | 是 | 提示词内容 |
| tags | string[] | 是 | 标签数组 |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "17",
    "title": "新提示词标题",
    "author": "当前用户名",
    "authorId": "当前用户ID",
    "description": "提示词描述",
    "content": "提示词内容...",
    "tags": ["标签1", "标签2"],
    "viewCount": 0,
    "favoriteCount": 0,
    "createdAt": "2026-01-08T10:00:00Z",
    "updatedAt": "2026-01-08T10:00:00Z"
  }
}
```

**说明：** `author` 和 `authorId` 从当前登录用户获取

---

### 3.6 收藏/取消收藏提示词

**接口地址：** `POST /api/prompts/{id}/favorite`

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 提示词ID |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "favorited": true
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| favorited | boolean | true=已收藏，false=已取消收藏 |

**说明：**
- 如果当前未收藏，则添加收藏，`favoriteCount` +1
- 如果当前已收藏，则取消收藏，`favoriteCount` -1

---

### 3.7 获取用户收藏列表

**接口地址：** `GET /api/user/favorites`

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 是 | 页码 |
| pageSize | int | 是 | 每页数量 |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      { "id": "1", "title": "...", ... }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 12
  }
}
```

---

### 3.8 检查是否已收藏

**接口地址：** `GET /api/prompts/{id}/favorited`

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 提示词ID |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "favorited": true
  }
}
```

---

## 四、AI 配置模块

### 4.1 获取 AI 配置

**接口地址：** `GET /api/ai-config`

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "apiKey": "sk-***",
    "baseURL": "https://api.openai.com/v1",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000,
    "difyApiKey": "app-***"
  }
}
```

**AIConfig 实体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| apiKey | string | 是 | OpenAI API Key（返回时脱敏显示） |
| baseURL | string | 是 | API 基础地址 |
| model | string | 是 | 模型名称 |
| temperature | float | 否 | 温度参数 (0-2) |
| maxTokens | int | 否 | 最大 token 数 |
| difyApiKey | string | 否 | Dify API Key（用于提示词优化） |

---

### 4.2 保存 AI 配置

**接口地址：** `PUT /api/ai-config`

**请求参数：**
```json
{
  "apiKey": "sk-xxxxxx",
  "baseURL": "https://api.openai.com/v1",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2000,
  "difyApiKey": "app-xxxxxx"
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

## 五、AI 对话模块

### 5.1 发送消息

**接口地址：** `POST /api/chat/send`

**请求参数：**
```json
{
  "messages": [
    {
      "id": "1",
      "role": "user",
      "content": "你好",
      "images": ["base64编码的图片..."],
      "createdAt": "2026-01-08T10:00:00Z"
    }
  ],
  "systemPrompt": "你是一个专业的代码审查助手...",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2000
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| messages | Message[] | 是 | 消息历史 |
| systemPrompt | string | 否 | 系统提示词 |
| model | string | 否 | 模型名称（默认使用配置中的模型） |
| temperature | float | 否 | 温度参数 |
| maxTokens | int | 否 | 最大 token 数 |

**Message 结构：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 消息ID |
| role | string | 是 | 角色：user / assistant |
| content | string | 是 | 消息内容 |
| images | string[] | 否 | Base64 编码的图片数组（用于 Vision 模型） |
| attachments | Attachment[] | 否 | 附件列表 |
| createdAt | string | 是 | 创建时间 |

**Attachment 结构：**
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 文件名 |
| url | string | 文件URL |
| type | string | 文件类型 |
| size | int | 文件大小(字节) |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "msg_123",
    "role": "assistant",
    "content": "你好！有什么可以帮助你的吗？",
    "createdAt": "2026-01-08T10:00:01Z"
  }
}
```

**说明：**
- 后端需要调用 OpenAI 兼容 API（根据用户配置的 baseURL）
- 支持 Vision 模型的图片识别功能

---

## 六、提示词优化模块

### 6.1 优化提示词

**接口地址：** `POST /api/prompt-optimize`

**请求参数：**
```json
{
  "rawPrompt": "帮我写一段代码",
  "formAnswer": "可选的表单答案JSON字符串"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| rawPrompt | string | 是 | 原始提示词 |
| formAnswer | string | 否 | 表单答案（JSON字符串） |

**响应示例 - 需要填写表单：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "stage": "need_form",
    "form": {
      "fields": [
        {
          "name": "language",
          "label": "编程语言",
          "type": "single",
          "options": ["Python", "JavaScript", "Java"],
          "required": true
        },
        {
          "name": "purpose",
          "label": "用途",
          "type": "text",
          "required": true
        }
      ]
    }
  }
}
```

**响应示例 - 返回优化结果：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "stage": "final_prompt",
    "optimizedPrompt": "你是一个专业的Python开发工程师..."
  }
}
```

**FormField 结构：**
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 字段名 |
| label | string | 显示标签 |
| type | string | 类型：single(单选) / multiple(多选) / text(文本) |
| options | string[] | 选项列表（single/multiple 类型需要） |
| required | boolean | 是否必填 |

**说明：**
- 后端需要调用 Dify API（使用用户配置的 difyApiKey）
- Dify API 地址：`https://api.dify.ai/v1/chat-messages`

---

## 七、提示词工坊模块

### 7.1 获取工坊模板列表

**接口地址：** `GET /api/workshop/templates`

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "template-1",
      "name": "通用助手模板",
      "content": "你是一个{{role}}，具有{{personality}}的特点...",
      "selections": {
        "role-0": "专业程序员",
        "personality-0": "严谨"
      },
      "createdAt": "2026-01-08T10:00:00Z",
      "updatedAt": "2026-01-08T10:00:00Z"
    }
  ]
}
```

**WorkshopTemplate 实体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 模板ID |
| name | string | 是 | 模板名称 |
| content | string | 是 | 模板内容（包含 `{{变量名}}` 语法） |
| selections | object | 是 | 变量选择值，key 格式为 `变量名-索引` |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

---

### 7.2 创建工坊模板

**接口地址：** `POST /api/workshop/templates`

**请求参数：**
```json
{
  "name": "新模板",
  "content": "你是一个{{role}}，请帮我{{task}}。",
  "selections": {}
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "template-xxx",
    "name": "新模板",
    "content": "你是一个{{role}}，请帮我{{task}}。",
    "selections": {},
    "createdAt": "2026-01-08T10:00:00Z",
    "updatedAt": "2026-01-08T10:00:00Z"
  }
}
```

---

### 7.3 更新工坊模板

**接口地址：** `PUT /api/workshop/templates/{id}`

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 模板ID |

**请求参数：**
```json
{
  "name": "修改后的名称",
  "content": "修改后的内容...",
  "selections": {
    "role-0": "选中的值"
  }
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "template-xxx",
    "name": "修改后的名称",
    ...
  }
}
```

---

### 7.4 删除工坊模板

**接口地址：** `DELETE /api/workshop/templates/{id}`

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| id | string | 模板ID |

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

---

### 7.5 获取词库列表

**接口地址：** `GET /api/workshop/banks`

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "key": "role",
      "label": "角色身份",
      "category": "character",
      "options": ["专业程序员", "资深产品经理", "创意设计师"]
    },
    {
      "key": "task",
      "label": "任务类型",
      "category": "action",
      "options": ["代码审查", "功能开发", "Bug修复"]
    }
  ]
}
```

**Bank 实体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| key | string | 是 | 变量名（唯一标识） |
| label | string | 是 | 显示名称 |
| category | string | 是 | 分类ID |
| options | string[] | 是 | 选项列表 |

---

### 7.6 更新词库

**接口地址：** `PUT /api/workshop/banks/{key}`

**路径参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| key | string | 词库 key |

**请求参数：**
```json
{
  "label": "修改后的名称",
  "category": "character",
  "options": ["选项1", "选项2", "新增选项3"]
}
```

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "key": "role",
    "label": "修改后的名称",
    "category": "character",
    "options": ["选项1", "选项2", "新增选项3"]
  }
}
```

---

### 7.7 获取分类列表

**接口地址：** `GET /api/workshop/categories`

**响应示例：**
```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "id": "character", "label": "人物", "color": "blue" },
    { "id": "item", "label": "物品", "color": "amber" },
    { "id": "action", "label": "动作", "color": "rose" },
    { "id": "location", "label": "地点", "color": "emerald" },
    { "id": "visual", "label": "画面", "color": "violet" },
    { "id": "other", "label": "其他", "color": "slate" }
  ]
}
```

**Category 实体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 分类ID |
| label | string | 是 | 显示名称 |
| color | string | 是 | 颜色标识（blue/amber/rose/emerald/violet/slate） |

---

## 八、数据库设计建议

### 8.1 用户表 (t_user)

```sql
CREATE TABLE t_user (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    avatar VARCHAR(500),
    email VARCHAR(200),
    password VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 8.2 提示词表 (t_prompt)

```sql
CREATE TABLE t_prompt (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    author_id VARCHAR(64) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    tags JSON,
    view_count INT DEFAULT 0,
    favorite_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at)
);
```

### 8.3 收藏表 (t_favorite)

```sql
CREATE TABLE t_favorite (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    prompt_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_prompt (user_id, prompt_id),
    INDEX idx_user_id (user_id)
);
```

### 8.4 AI配置表 (t_ai_config)

```sql
CREATE TABLE t_ai_config (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL UNIQUE,
    api_key VARCHAR(500),
    base_url VARCHAR(500),
    model VARCHAR(100),
    temperature DECIMAL(3,2),
    max_tokens INT,
    dify_api_key VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 8.5 工坊模板表 (t_workshop_template)

```sql
CREATE TABLE t_workshop_template (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    selections JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);
```

### 8.6 词库表 (t_workshop_bank)

```sql
CREATE TABLE t_workshop_bank (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    bank_key VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    options JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_key (user_id, bank_key),
    INDEX idx_user_id (user_id)
);
```

### 8.7 分类表 (t_workshop_category)

```sql
CREATE TABLE t_workshop_category (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    category_id VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    color VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_category (user_id, category_id),
    INDEX idx_user_id (user_id)
);
```

---

## 九、接口汇总表

| 模块 | 方法 | 接口路径 | 说明 |
|------|------|----------|------|
| 用户 | GET | /api/user/current | 获取当前用户信息 |
| 用户 | PUT | /api/user/current | 更新用户信息 |
| 提示词 | GET | /api/prompts | 获取提示词列表（分页，支持分类和关键词筛选） |
| 提示词 | GET | /api/prompts/recommended | 获取推荐提示词 |
| 提示词 | GET | /api/prompts/hot | 获取热门提示词 |
| 提示词 | GET | /api/prompts/{id} | 获取提示词详情 |
| 提示词 | POST | /api/prompts | 创建提示词 |
| 提示词 | POST | /api/prompts/{id}/favorite | 收藏/取消收藏 |
| 提示词 | GET | /api/prompts/{id}/favorited | 检查是否已收藏 |
| 提示词 | GET | /api/user/favorites | 获取用户收藏列表 |
| AI配置 | GET | /api/ai-config | 获取AI配置 |
| AI配置 | PUT | /api/ai-config | 保存AI配置 |
| AI对话 | POST | /api/chat/send | 发送消息 |
| 提示词优化 | POST | /api/prompt-optimize | 优化提示词 |
| 工坊 | GET | /api/workshop/templates | 获取模板列表 |
| 工坊 | POST | /api/workshop/templates | 创建模板 |
| 工坊 | PUT | /api/workshop/templates/{id} | 更新模板 |
| 工坊 | DELETE | /api/workshop/templates/{id} | 删除模板 |
| 工坊 | GET | /api/workshop/banks | 获取词库列表 |
| 工坊 | PUT | /api/workshop/banks/{key} | 更新词库 |
| 工坊 | GET | /api/workshop/categories | 获取分类列表 |

---

## 十、注意事项

1. **安全性**：API Key 等敏感信息存储时需要加密，返回时需要脱敏
2. **用户隔离**：工坊模板、词库、AI配置等数据需要按用户隔离
3. **AI对话代理**：后端需要代理调用 OpenAI API，避免前端直接暴露 API Key
4. **Dify集成**：提示词优化功能需要调用 Dify API
5. **分页**：所有列表接口建议支持分页
6. **时间格式**：统一使用 ISO 8601 格式（如 `2026-01-08T10:00:00Z`）
