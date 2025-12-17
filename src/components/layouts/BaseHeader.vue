<script lang="ts" setup>
import { UserFilled, Plus } from '@element-plus/icons-vue'

const handleUserCenter = () => {
  // 使用编程式导航跳转到个人中心
  window.location.href = '/profile'
}

const handleAddPrompt = () => {
  // 跳转到新增提示词页面
  window.location.href = '/add-prompt'
}
</script>

<template>
  <div class="prompt-header">
    <div class="header-content">
      <!-- 左侧品牌区域 -->
      <div class="brand-area">
        <el-button type="text" @click="$router.push('/')" class="brand-btn">
          <div class="flex items-center gap-2">
            <div class="text-xl" i-ep-chat-line-round />
            <span class="brand-text">PromptHub</span>
          </div>
        </el-button>
      </div>
      
      <!-- 中间导航区域 -->
      <div class="nav-area">
        <el-button text @click="$router.push('/')" class="nav-btn">
          提示词广场
        </el-button>
      </div>

      <!-- 右侧功能区域 -->
      <div class="actions-area">
        <el-button circle @click="handleAddPrompt" class="action-btn">
          <el-icon><Plus /></el-icon>
        </el-button>

        <el-button circle @click="handleUserCenter" class="action-btn">
          <el-icon><UserFilled /></el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.prompt-header {
  background: var(--ep-bg-color);
  border-bottom: 1px solid var(--ep-border-color);
  height: var(--ep-menu-item-height);
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    padding: 0 20px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .brand-area {
    .brand-btn {
      padding: 8px 12px;
      height: auto;
      font-size: 18px;
      font-weight: 600;

      .brand-text {
        color: var(--ep-color-primary);
        margin-left: 4px;
      }

      &:hover {
        background: var(--ep-fill-color-light);
      }
    }
  }

  .nav-area {
    display: flex;
    align-items: center;
    gap: 8px;

    .nav-btn {
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--ep-text-color-regular);

      &:hover {
        color: var(--ep-color-primary);
        background: var(--ep-fill-color-light);
      }

      .el-icon {
        margin-right: 4px;
      }
    }
  }

  .actions-area {
    display: flex;
    align-items: center;
    gap: 12px;

    .action-btn {
      width: 36px;
      height: 36px;

      &:hover {
        background: var(--ep-fill-color-light);
      }
    }
  }
}
</style>
