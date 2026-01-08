import type { Bank } from '@/types';

// 默认词库数据
export const DEFAULT_BANKS: Bank[] = [
  // 人物分类
  {
    key: 'role',
    label: '角色身份',
    category: 'character',
    options: ['专业程序员', '资深产品经理', '创意设计师', 'AI助手', '数据分析师', '文案策划'],
  },
  {
    key: 'personality',
    label: '性格特点',
    category: 'character',
    options: ['专业严谨', '友好耐心', '创意无限', '逻辑清晰', '细心周到', '高效务实'],
  },
  {
    key: 'expertise',
    label: '专业领域',
    category: 'character',
    options: ['前端开发', '后端开发', '全栈开发', 'UI/UX设计', '数据科学', '产品设计'],
  },

  // 动作分类
  {
    key: 'task',
    label: '任务类型',
    category: 'action',
    options: ['代码审查', '功能开发', 'Bug修复', '性能优化', '文档编写', '方案设计'],
  },
  {
    key: 'output_format',
    label: '输出格式',
    category: 'action',
    options: ['Markdown格式', 'JSON格式', '表格形式', '分步骤说明', '代码示例', '流程图'],
  },
  {
    key: 'thinking_style',
    label: '思考方式',
    category: 'action',
    options: ['逐步分析', '先总后分', '对比分析', '案例驱动', '问题导向', '系统思考'],
  },

  // 物品分类
  {
    key: 'language',
    label: '编程语言',
    category: 'item',
    options: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust'],
  },
  {
    key: 'framework',
    label: '技术框架',
    category: 'item',
    options: ['React', 'Vue', 'Next.js', 'Node.js', 'Spring Boot', 'Django'],
  },
  {
    key: 'tool',
    label: '工具',
    category: 'item',
    options: ['VS Code', 'Git', 'Docker', 'Webpack', 'ESLint', 'Prettier'],
  },

  // 地点/场景分类
  {
    key: 'scenario',
    label: '使用场景',
    category: 'location',
    options: ['日常开发', '技术面试', '代码学习', '项目重构', '团队协作', '独立开发'],
  },
  {
    key: 'project_type',
    label: '项目类型',
    category: 'location',
    options: ['Web应用', '移动应用', '后端服务', '开源项目', '企业系统', '个人项目'],
  },

  // 画面/风格分类
  {
    key: 'style',
    label: '回答风格',
    category: 'visual',
    options: ['简洁明了', '详细全面', '循序渐进', '直击重点', '图文并茂', '代码为主'],
  },
  {
    key: 'tone',
    label: '语气',
    category: 'visual',
    options: ['专业正式', '轻松友好', '严谨学术', '生动有趣', '鼓励引导', '客观中立'],
  },

  // 其他分类
  {
    key: 'constraint',
    label: '限制条件',
    category: 'other',
    options: ['不超过500字', '使用中文', '包含示例', '避免术语', '保持简洁', '提供参考'],
  },
  {
    key: 'goal',
    label: '目标',
    category: 'other',
    options: ['解决问题', '学习理解', '提高效率', '代码质量', '性能提升', '最佳实践'],
  },
];

// 默认模板
export const DEFAULT_TEMPLATES = [
  {
    id: 'template-1',
    name: '通用助手模板',
    content: `你是一个{{role}}，具有{{personality}}的特点。

你的专业领域是{{expertise}}，擅长{{task}}。

请以{{style}}的方式回答，语气保持{{tone}}。

输出格式：{{output_format}}

{{constraint}}`,
    selections: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-2',
    name: '代码助手模板',
    content: `你是一个精通{{language}}的{{role}}。

主要使用{{framework}}框架，熟练运用{{tool}}工具。

当前场景：{{scenario}}
项目类型：{{project_type}}

请帮我完成{{task}}任务，目标是{{goal}}。

要求：
- 思考方式：{{thinking_style}}
- 输出格式：{{output_format}}
- {{constraint}}`,
    selections: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
