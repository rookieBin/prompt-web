<script setup lang="ts">
import { ChatLineRound, Search, Star, View } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import ChatDrawer from '~/components/ChatDrawer.vue'

interface Prompt {
  id: number
  title: string
  description: string
  content: string
  author: string
  avatar: string
  category: string
  tags: string[]
  stars: number
  views: number
  createdAt: string
}

const prompts = ref<Prompt[]>([
  {
    id: 1,
    title: 'Vue3组件开发助手',
    description: '帮助你快速开发Vue3组件，提供最佳实践和代码优化建议。',
    content: '你是一个Vue3开发专家，请帮我设计和实现这个组件，使用Composition API和TypeScript...',
    author: 'VueMaster',
    avatar: '',
    category: '前端',
    tags: ['Vue3', 'Composition API', 'TypeScript'],
    stars: 234,
    views: 1250,
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    title: 'Node.js API开发专家',
    description: '设计RESTful API接口，提供后端架构和数据库设计建议。',
    content: '作为一名资深的Node.js后端开发专家，请帮我设计这个API接口的实现方案...',
    author: 'BackendPro',
    avatar: '',
    category: '后端',
    tags: ['Node.js', 'Express', 'RESTful API'],
    stars: 189,
    views: 892,
    createdAt: '2024-01-12',
  },
  {
    id: 3,
    title: '单元测试编写助手',
    description: '帮助编写高质量的单元测试，提升代码覆盖率和测试可维护性。',
    content: '你是一位专业的测试工程师，请为这段代码编写完整的单元测试用例...',
    author: 'TestExpert',
    avatar: '',
    category: '测试',
    tags: ['Jest', '单元测试', 'TDD'],
    stars: 312,
    views: 1680,
    createdAt: '2024-01-10',
  },
  {
    id: 4,
    title: '数据分析与可视化',
    description: '深入分析大数据，使用Python进行数据处理和可视化展示。',
    content: '作为一名专业的数据分析师，请帮我分析这组数据并生成可视化报告...',
    author: 'DataGuru',
    avatar: '',
    category: '大数据',
    tags: ['Python', 'Pandas', '数据可视化'],
    stars: 156,
    views: 723,
    createdAt: '2024-01-08',
  },
  {
    id: 5,
    title: 'Git工作流助手',
    description: '提供Git版本控制最佳实践，解决分支管理和代码合并问题。',
    content: '作为一位Git专家，请帮我设计合适的分支策略和工作流程...',
    author: 'GitMaster',
    avatar: '',
    category: '工具',
    tags: ['Git', '版本控制', '工作流'],
    stars: 278,
    views: 1156,
    createdAt: '2024-01-05',
  },
  {
    id: 6,
    title: 'React性能优化专家',
    description: '分析React应用性能瓶颈，提供优化方案和最佳实践建议。',
    content: '作为一名React性能优化专家，请帮我分析这个组件的性能问题并提供优化方案...',
    author: 'ReactPro',
    avatar: '',
    category: '前端',
    tags: ['React', '性能优化', 'Hooks'],
    stars: 423,
    views: 2134,
    createdAt: '2024-01-03',
  },
])

const searchKeyword = ref('')
const selectedCategory = ref('全部')
const chatDrawerVisible = ref(false)
const selectedPrompt = ref<Prompt | null>(null)

const categories = ['全部', '前端', '后端', '测试', '大数据', '工具']

const filteredPrompts = computed(() => {
  let filtered = prompts.value

  if (selectedCategory.value && selectedCategory.value !== '全部') {
    filtered = filtered.filter(p => p.category === selectedCategory.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(keyword)
      || p.description.toLowerCase().includes(keyword)
      || p.tags.some(tag => tag.toLowerCase().includes(keyword)),
    )
  }

  return filtered
})

function handleUsePrompt(prompt: Prompt) {
  selectedPrompt.value = prompt
  chatDrawerVisible.value = true
}

function handleStarPrompt(prompt: Prompt) {
  prompt.stars += 1
}
</script>

<template>
  <div class="prompt-plaza">
    <div class="plaza-header">
      <h1 class="plaza-title">
        提示词广场
      </h1>
      <p class="plaza-subtitle">
        发现和分享优质的AI提示词，让你的AI助手更加智能
      </p>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索提示词..."
          clearable
          size="large"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="category-filter">
        <el-radio-group v-model="selectedCategory" size="small">
          <el-radio-button
            v-for="category in categories"
            :key="category"
            :label="category"
            :value="category"
          >
            {{ category }}
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 提示词卡片网格 -->
    <div class="prompts-grid">
      <el-card
        v-for="prompt in filteredPrompts"
        :key="prompt.id"
        class="prompt-card"
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <div class="prompt-info">
              <h3 class="prompt-title">
                {{ prompt.title }}
              </h3>
              <p class="prompt-author">
                by {{ prompt.author }}
              </p>
            </div>
            <el-tag size="small" type="primary">
              {{ prompt.category }}
            </el-tag>
          </div>
        </template>

        <div class="card-content">
          <p class="prompt-description">
            {{ prompt.description }}
          </p>

          <div class="prompt-tags">
            <el-tag
              v-for="tag in prompt.tags"
              :key="tag"
              size="small"
              effect="plain"
              class="tag"
            >
              {{ tag }}
            </el-tag>
          </div>

          <div class="prompt-stats">
            <div class="stat-item">
              <el-icon><Star /></el-icon>
              <span>{{ prompt.stars }}</span>
            </div>
            <div class="stat-item">
              <el-icon><View /></el-icon>
              <span>{{ prompt.views }}</span>
            </div>
            <span class="created-date">{{ prompt.createdAt }}</span>
          </div>
        </div>

        <template #footer>
          <div class="card-actions">
            <el-button
              type="primary"
              size="small"
              @click="handleUsePrompt(prompt)"
            >
              <el-icon><ChatLineRound /></el-icon>
              使用
            </el-button>
            <el-button
              size="small"
              @click="handleStarPrompt(prompt)"
            >
              <el-icon><Star /></el-icon>
              收藏
            </el-button>
          </div>
        </template>
      </el-card>
    </div>

    <ChatDrawer
      v-model:visible="chatDrawerVisible"
      :initial-prompt="selectedPrompt?.content"
      :prompt-title="selectedPrompt?.title"
    />
  </div>
</template>

<style lang="scss" scoped>
.prompt-plaza {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.plaza-header {
  text-align: center;
  margin-bottom: 40px;

  .plaza-title {
    font-size: 32px;
    font-weight: 600;
    color: var(--ep-text-color-primary);
    margin-bottom: 12px;
  }

  .plaza-subtitle {
    font-size: 16px;
    color: var(--ep-text-color-regular);
    margin: 0;
  }
}

.filter-section {
  margin-bottom: 30px;

  .search-box {
    margin-bottom: 20px;

    :deep(.el-input) {
      max-width: 600px;
      margin: 0 auto;
    }
  }

  .category-filter {
    display: flex;
    justify-content: center;

    :deep(.el-radio-group) {
      .el-radio-button__inner {
        padding: 8px 16px;
      }
    }
  }
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.prompt-card {
  height: 100%;
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid var(--ep-border-color-lighter);
  }

  :deep(.el-card__body) {
    padding: 20px;
    height: calc(100% - 60px);
    display: flex;
    flex-direction: column;
  }

  :deep(.el-card__footer) {
    padding: 16px 20px;
    border-top: 1px solid var(--ep-border-color-lighter);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .prompt-info {
    flex: 1;

    .prompt-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--ep-text-color-primary);
      margin: 0 0 4px 0;
      line-height: 1.3;
    }

    .prompt-author {
      font-size: 13px;
      color: var(--ep-text-color-regular);
      margin: 0;
    }
  }
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;

  .prompt-description {
    color: var(--ep-text-color-regular);
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 16px 0;
    flex: 1;
  }

  .prompt-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;

    .tag {
      font-size: 12px;
    }
  }

  .prompt-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: var(--ep-text-color-regular);

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .created-date {
      margin-left: auto;
      color: var(--ep-text-color-disabled);
    }
  }
}

.card-actions {
  display: flex;
  gap: 12px;

  .el-button {
    flex: 1;

    .el-icon {
      margin-right: 4px;
    }
  }
}
</style>
