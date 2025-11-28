<script setup lang="ts">
import { ref } from 'vue'
import { Edit, Delete, Star, View, ChatLineRound } from '@element-plus/icons-vue'

interface UserPrompt {
  id: number
  title: string
  description: string
  content: string
  category: string
  tags: string[]
  stars: number
  views: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

const userInfo = ref({
  username: 'PromptMaster',
  avatar: '',
  email: 'user@example.com',
  joinDate: '2024-01-01',
  totalPrompts: 12,
  totalStars: 856,
  totalViews: 4320
})

const myPrompts = ref<UserPrompt[]>([
  {
    id: 1,
    title: '产品文档助手',
    description: '帮助撰写清晰、专业的产品文档和用户手册。',
    content: '作为一名专业的技术文档编写专家，请帮我创建一份...',
    category: '文档',
    tags: ['技术文档', '产品', '用户手册'],
    stars: 45,
    views: 234,
    isPublic: true,
    createdAt: '2024-01-20',
    updatedAt: '2024-01-25'
  },
  {
    id: 2,
    title: '前端代码审查',
    description: '专注于前端代码质量和性能优化的审查助手。',
    content: '你是一位资深的前端工程师，请帮我审查这段代码...',
    category: '编程',
    tags: ['前端', '代码审查', 'React'],
    stars: 123,
    views: 567,
    isPublic: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-22'
  },
  {
    id: 3,
    title: '会议纪要生成器',
    description: '将会议录音或原始记录整理成结构化的会议纪要。',
    content: '请帮我将这段会议记录整理成专业的会议纪要格式...',
    category: '办公',
    tags: ['会议', '文档', '效率'],
    stars: 67,
    views: 289,
    isPublic: false,
    createdAt: '2024-01-18',
    updatedAt: '2024-01-20'
  }
])

const activeTab = ref('prompts')

const handleEditPrompt = (prompt: UserPrompt) => {
  console.log('编辑提示词:', prompt)
}

const handleDeletePrompt = (prompt: UserPrompt) => {
  console.log('删除提示词:', prompt)
}

const handleTogglePublic = (prompt: UserPrompt) => {
  prompt.isPublic = !prompt.isPublic
  console.log('切换公开状态:', prompt)
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="user-info">
        <div class="avatar-section">
          <el-avatar :size="80" :src="userInfo.avatar">
            <i class="el-icon-user-solid" />
          </el-avatar>
        </div>
        <div class="info-section">
          <h2 class="username">{{ userInfo.username }}</h2>
          <p class="email">{{ userInfo.email }}</p>
          <p class="join-date">加入时间：{{ userInfo.joinDate }}</p>
        </div>
        <div class="stats-section">
          <div class="stat-item">
            <div class="stat-number">{{ userInfo.totalPrompts }}</div>
            <div class="stat-label">提示词</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userInfo.totalStars }}</div>
            <div class="stat-label">收藏</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ userInfo.totalViews }}</div>
            <div class="stat-label">浏览</div>
          </div>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="我的提示词" name="prompts">
          <div class="prompts-section">
            <div class="section-header">
              <h3>我的提示词库</h3>
              <el-button type="primary" @click="$router.push('/add-prompt')">
                新建提示词
              </el-button>
            </div>
            
            <div class="prompts-grid">
              <el-card
                v-for="prompt in myPrompts"
                :key="prompt.id"
                class="prompt-card"
                shadow="hover"
              >
                <template #header>
                  <div class="card-header">
                    <div class="prompt-info">
                      <h4 class="prompt-title">{{ prompt.title }}</h4>
                      <div class="prompt-meta">
                        <el-tag size="small" type="primary">{{ prompt.category }}</el-tag>
                        <el-tag
                          size="small"
                          :type="prompt.isPublic ? 'success' : 'info'"
                          effect="plain"
                        >
                          {{ prompt.isPublic ? '公开' : '私有' }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="card-actions">
                      <el-button
                        size="small"
                        type="text"
                        @click="handleEditPrompt(prompt)"
                      >
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button
                        size="small"
                        type="text"
                        @click="handleDeletePrompt(prompt)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
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
                    <span class="updated-date">更新于 {{ prompt.updatedAt }}</span>
                  </div>
                </div>
                
                <template #footer>
                  <div class="card-footer">
                    <el-button
                      size="small"
                      @click="handleTogglePublic(prompt)"
                    >
                      {{ prompt.isPublic ? '设为私有' : '设为公开' }}
                    </el-button>
                    <el-button
                      type="primary"
                      size="small"
                    >
                      <el-icon><ChatLineRound /></el-icon>
                      使用
                    </el-button>
                  </div>
                </template>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="收藏夹" name="favorites">
          <div class="favorites-section">
            <el-empty description="还没有收藏任何提示词" />
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="设置" name="settings">
          <div class="settings-section">
            <el-form label-width="100px">
              <el-form-item label="用户名">
                <el-input v-model="userInfo.username" />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="userInfo.email" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary">保存设置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  background: var(--ep-bg-color);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid var(--ep-border-color-lighter);
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 24px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }
  }
  
  .info-section {
    flex: 1;
    
    .username {
      font-size: 24px;
      font-weight: 600;
      color: var(--ep-text-color-primary);
      margin: 0 0 8px 0;
    }
    
    .email {
      color: var(--ep-text-color-regular);
      margin: 0 0 4px 0;
    }
    
    .join-date {
      color: var(--ep-text-color-disabled);
      font-size: 14px;
      margin: 0;
    }
  }
  
  .stats-section {
    display: flex;
    gap: 32px;
    
    @media (max-width: 768px) {
      gap: 24px;
    }
    
    .stat-item {
      text-align: center;
      
      .stat-number {
        font-size: 20px;
        font-weight: 600;
        color: var(--ep-color-primary);
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 12px;
        color: var(--ep-text-color-regular);
      }
    }
  }
}

.profile-content {
  .profile-tabs {
    :deep(.el-tabs__content) {
      padding: 20px 0;
    }
  }
}

.prompts-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: var(--ep-text-color-primary);
      margin: 0;
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
}

.prompt-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    .prompt-info {
      flex: 1;
      
      .prompt-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--ep-text-color-primary);
        margin: 0 0 8px 0;
      }
      
      .prompt-meta {
        display: flex;
        gap: 8px;
      }
    }
    
    .card-actions {
      display: flex;
      gap: 4px;
    }
  }
  
  .card-content {
    .prompt-description {
      color: var(--ep-text-color-regular);
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 16px 0;
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
      
      .updated-date {
        margin-left: auto;
        color: var(--ep-text-color-disabled);
      }
    }
  }
  
  .card-footer {
    display: flex;
    gap: 12px;
    
    .el-button {
      flex: 1;
    }
  }
}

.favorites-section,
.settings-section {
  padding: 20px;
}

.settings-section {
  max-width: 500px;
}
</style>