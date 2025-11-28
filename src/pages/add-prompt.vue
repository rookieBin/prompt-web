<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const form = reactive({
  title: '',
  description: '',
  content: '',
  category: '',
  tags: '',
  isPublic: true
})

const categories = [
  '编程',
  '营销',
  '教育',
  '数据',
  '设计',
  '财经',
  '文档',
  '办公',
  '创意',
  '其他'
]

const rules = {
  title: [
    { required: true, message: '请输入提示词标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入提示词描述', trigger: 'blur' },
    { min: 10, max: 200, message: '描述长度应在 10 到 200 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入提示词内容', trigger: 'blur' },
    { min: 20, message: '提示词内容至少需要 20 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

const formRef = ref()
const isSubmitting = ref(false)

const handleGoBack = () => {
  window.history.back()
}

const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    isSubmitting.value = true
    
    // 模拟保存请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const promptData = {
      ...form,
      tags: form.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date().toISOString().split('T')[0],
      stars: 0,
      views: 0
    }
    
    console.log('保存提示词:', promptData)
    ElMessage.success('提示词保存成功！')
    
    // 跳转回个人中心
    setTimeout(() => {
      window.location.href = '/profile'
    }, 1000)
    
  } catch (error) {
    console.log('表单验证失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handlePreview = () => {
  console.log('预览提示词:', form)
  ElMessage.info('预览功能开发中...')
}

// 自动保存草稿（模拟）
const autoSave = () => {
  if (form.title || form.description || form.content) {
    console.log('自动保存草稿')
  }
}

// 每30秒自动保存一次
setInterval(autoSave, 30000)
</script>

<template>
  <div class="add-prompt-page">
    <div class="page-header">
      <el-button 
        type="text" 
        @click="handleGoBack"
        class="back-btn"
      >
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h1 class="page-title">创建新提示词</h1>
      <div class="header-actions">
        <el-button @click="handlePreview">预览</el-button>
        <el-button 
          type="primary" 
          @click="handleSave"
          :loading="isSubmitting"
        >
          {{ isSubmitting ? '保存中...' : '保存' }}
        </el-button>
      </div>
    </div>

    <div class="form-container">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        size="large"
        @submit.prevent="handleSave"
      >
        <el-row :gutter="20">
          <el-col :lg="16" :md="24">
            <div class="form-section">
              <h3>基本信息</h3>
              <el-form-item label="标题" prop="title">
                <el-input
                  v-model="form.title"
                  placeholder="输入一个简洁明了的标题"
                  clearable
                />
              </el-form-item>

              <el-form-item label="描述" prop="description">
                <el-input
                  v-model="form.description"
                  type="textarea"
                  placeholder="简要描述这个提示词的功能和用途"
                  :rows="3"
                  show-word-limit
                  maxlength="200"
                />
              </el-form-item>

              <el-form-item label="分类" prop="category">
                <el-select
                  v-model="form.category"
                  placeholder="选择分类"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="category in categories"
                    :key="category"
                    :label="category"
                    :value="category"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="标签">
                <el-input
                  v-model="form.tags"
                  placeholder="输入标签，用逗号分隔，例如：代码审查,JavaScript,性能优化"
                  clearable
                />
                <div class="form-tip">
                  标签有助于其他用户发现你的提示词
                </div>
              </el-form-item>
            </div>

            <div class="form-section">
              <h3>提示词内容</h3>
              <el-form-item label="内容" prop="content">
                <el-input
                  v-model="form.content"
                  type="textarea"
                  placeholder="输入完整的提示词内容，可以包含角色设定、任务描述、输出要求等"
                  :rows="12"
                  show-word-limit
                  maxlength="2000"
                />
                <div class="form-tip">
                  <p><strong>提示词编写建议：</strong></p>
                  <ul>
                    <li>明确角色定位：告诉AI它应该扮演什么角色</li>
                    <li>详细任务描述：清楚说明要完成什么任务</li>
                    <li>输出格式要求：指定期望的回复格式</li>
                    <li>提供示例：给出输入输出的具体例子</li>
                  </ul>
                </div>
              </el-form-item>
            </div>
          </el-col>

          <el-col :lg="8" :md="24">
            <div class="sidebar">
              <div class="setting-section">
                <h4>发布设置</h4>
                <el-form-item label="可见性">
                  <el-radio-group v-model="form.isPublic">
                    <el-radio :label="true">公开</el-radio>
                    <el-radio :label="false">私有</el-radio>
                  </el-radio-group>
                  <div class="form-tip">
                    公开的提示词将在广场中展示，其他用户可以查看和使用
                  </div>
                </el-form-item>
              </div>

              <div class="preview-section">
                <h4>预览</h4>
                <div class="preview-card">
                  <div class="preview-title">
                    {{ form.title || '提示词标题' }}
                  </div>
                  <div class="preview-description">
                    {{ form.description || '提示词描述...' }}
                  </div>
                  <div class="preview-category" v-if="form.category">
                    <el-tag size="small" type="primary">{{ form.category }}</el-tag>
                  </div>
                  <div class="preview-tags" v-if="form.tags">
                    <el-tag
                      v-for="tag in form.tags.split(',').map(t => t.trim()).filter(t => t)"
                      :key="tag"
                      size="small"
                      effect="plain"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div class="tips-section">
                <h4>温馨提示</h4>
                <ul class="tips-list">
                  <li>建议先保存为私有，测试无误后再设为公开</li>
                  <li>好的提示词标题和描述有助于被更多人发现</li>
                  <li>系统会自动保存草稿，避免意外丢失</li>
                  <li>你可以随时修改已发布的提示词</li>
                </ul>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.add-prompt-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ep-border-color-lighter);

  .back-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
  }

  .page-title {
    flex: 1;
    text-align: center;
    font-size: 24px;
    font-weight: 600;
    color: var(--ep-text-color-primary);
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    text-align: center;

    .page-title {
      text-align: center;
    }
  }
}

.form-container {
  .form-section {
    background: var(--ep-bg-color);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    border: 1px solid var(--ep-border-color-lighter);

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--ep-text-color-primary);
      margin: 0 0 20px 0;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--ep-border-color-lighter);
    }
  }

  .form-tip {
    font-size: 13px;
    color: var(--ep-text-color-regular);
    margin-top: 8px;
    line-height: 1.4;

    ul {
      margin: 8px 0 0 0;
      padding-left: 16px;

      li {
        margin-bottom: 4px;
      }
    }
  }
}

.sidebar {
  .setting-section,
  .preview-section,
  .tips-section {
    background: var(--ep-bg-color);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--ep-border-color-lighter);

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--ep-text-color-primary);
      margin: 0 0 16px 0;
    }
  }

  .preview-card {
    background: var(--ep-fill-color-extra-light);
    border-radius: 8px;
    padding: 16px;
    border: 1px solid var(--ep-border-color-lighter);

    .preview-title {
      font-weight: 600;
      color: var(--ep-text-color-primary);
      margin-bottom: 8px;
      font-size: 15px;
    }

    .preview-description {
      color: var(--ep-text-color-regular);
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 12px;
    }

    .preview-category {
      margin-bottom: 8px;
    }

    .preview-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      .el-tag {
        font-size: 11px;
      }
    }
  }

  .tips-list {
    margin: 0;
    padding-left: 16px;
    color: var(--ep-text-color-regular);
    font-size: 13px;
    line-height: 1.5;

    li {
      margin-bottom: 8px;
    }
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--ep-text-color-primary);
}

:deep(.el-textarea__inner) {
  resize: vertical;
}
</style>