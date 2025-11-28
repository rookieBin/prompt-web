<script setup lang="ts">
import { ref, computed } from 'vue'
import { Star, View, ChatLineRound, Search } from '@element-plus/icons-vue'

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
    title: '代码优化助手',
    description: '帮助你分析代码并提供优化建议，提高代码质量和性能。',
    content: '你是一个专业的代码审查专家，请帮我分析这段代码的问题并给出优化建议...',
    author: 'DevMaster',
    avatar: '',
    category: '编程',
    tags: ['代码审查', '性能优化', 'JavaScript'],
    stars: 234,
    views: 1250,
    createdAt: '2024-01-15'
  },
  {
    id: 2,
    title: '文案创作专家',
    description: '为你的产品、服务或活动创作引人注目的营销文案。',
    content: '作为一名资深的营销文案专家，请为我的产品创作一份吸引人的宣传文案...',
    author: 'CopyWriter',
    avatar: '',
    category: '营销',
    tags: ['文案创作', '营销', '品牌推广'],
    stars: 189,
    views: 892,
    createdAt: '2024-01-12'
  },
  {
    id: 3,
    title: '英语学习教练',
    description: '个性化英语学习指导，提升口语、写作和阅读能力。',
    content: '你是一位专业的英语教学专家，请根据学生的水平制定个性化学习计划...',
    author: 'EnglishPro',
    avatar: '',
    category: '教育',
    tags: ['英语学习', '教育', '语言'],
    stars: 312,
    views: 1680,
    createdAt: '2024-01-10'
  },
  {
    id: 4,
    title: '数据分析师',
    description: '深入分析数据，发现隐藏的模式和趋势，提供洞察建议。',
    content: '作为一名专业的数据分析师，请帮我分析这组数据并提供业务洞察...',
    author: 'DataGuru',
    avatar: '',
    category: '数据',
    tags: ['数据分析', '商业智能', 'Python'],
    stars: 156,
    views: 723,
    createdAt: '2024-01-08'
  },
  {
    id: 5,
    title: 'UI设计顾问',
    description: '提供专业的界面设计建议，改善用户体验和视觉效果。',
    content: '作为一位资深的UI/UX设计师，请为我的应用界面提供设计建议...',
    author: 'DesignExpert',
    avatar: '',
    category: '设计',
    tags: ['UI设计', '用户体验', 'Figma'],
    stars: 278,
    views: 1156,
    createdAt: '2024-01-05'
  },
  {
    id: 6,
    title: '投资理财顾问',
    description: '提供专业的投资建议和理财规划，帮助你实现财务目标。',
    content: '作为一名专业的投资顾问，请为我制定一个适合的投资理财计划...',
    author: 'WealthAdvisor',
    avatar: '',
    category: '财经',
    tags: ['投资理财', '财务规划', '股票'],
    stars: 423,
    views: 2134,
    createdAt: '2024-01-03'
  }
])

const searchKeyword = ref('')
const selectedCategory = ref('')

const categories = ['全部', '编程', '营销', '教育', '数据', '设计', '财经']

const filteredPrompts = computed(() => {
  let filtered = prompts.value
  
  if (selectedCategory.value && selectedCategory.value !== '全部') {
    filtered = filtered.filter(p => p.category === selectedCategory.value)
  }
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(keyword) ||
      p.description.toLowerCase().includes(keyword) ||
      p.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }
  
  return filtered
})

const handleUsePrompt = (prompt: Prompt) => {
  console.log('使用提示词:', prompt)
}

const handleStarPrompt = (prompt: Prompt) => {
  prompt.stars += 1
  console.log('收藏提示词:', prompt)
}
</script>

<template>
  <div class="prompt-plaza">
    <div class="plaza-header">
      <h1 class="plaza-title">提示词广场</h1>
      <p class="plaza-subtitle">发现和分享优质的AI提示词，让你的AI助手更加智能</p>
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
              <h3 class="prompt-title">{{ prompt.title }}</h3>
              <p class="prompt-author">by {{ prompt.author }}</p>
            </div>
            <el-tag size="small" type="primary">{{ prompt.category }}</el-tag>
          </div>
        </template>
        
        <div class="card-content">
          <p class="prompt-description">{{ prompt.description }}</p>
          
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
