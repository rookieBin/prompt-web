<script setup lang="ts">
import type { AIMessageContent, ChatMessagesData, ChatRequestParams, ChatServiceConfig, SSEChunkData } from '@tdesign-vue-next/chat'
import { Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'

interface Props {
  visible: boolean
  initialPrompt?: string
  promptTitle?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
}>()

const selectedModel = ref('gpt-3.5-turbo')
const messages = ref<ChatMessagesData[]>([])

const apiSettings = computed(() => {
  const saved = localStorage.getItem('apiSettings')
  return saved ? JSON.parse(saved) : null
})

const modelOptions = computed(() => {
  const baseModels = [
    { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
    { label: 'GPT-4', value: 'gpt-4' },
    { label: 'Claude 3 Sonnet', value: 'claude-3-sonnet' },
    { label: 'Claude 3 Opus', value: 'claude-3-opus' },
  ]

  if (apiSettings.value?.modelProvider === 'custom' && apiSettings.value?.customModel) {
    return [
      { label: apiSettings.value.customModel, value: apiSettings.value.customModel },
      ...baseModels,
    ]
  }

  return baseModels
})

function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function handleNewChat() {
  messages.value = []
}

function getProviderEndpoint(provider: string) {
  const providers: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    claude: 'https://api.anthropic.com/v1',
    qwen: 'https://dashscope.aliyuncs.com/api/v1',
    ernie: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1',
  }
  return providers[provider] || ''
}

const chatServiceConfig = computed<ChatServiceConfig>(() => {
  const provider = apiSettings.value?.modelProvider || 'openai'
  const endpoint = provider === 'custom'
    ? apiSettings.value?.customEndpoint || ''
    : getProviderEndpoint(provider)

  return {
    endpoint: `${endpoint}/chat/completions`,
    stream: true,
    onRequest: (innerParams: ChatRequestParams) => {
      if (!apiSettings.value?.apiKey) {
        ElMessage.warning('请先在个人中心配置API Key')
        throw new Error('未配置API Key')
      }

      const modelName = provider === 'custom' && apiSettings.value?.customModel
        ? apiSettings.value.customModel
        : selectedModel.value

      const allMessages = messages.value
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: typeof m.content === 'string'
            ? m.content
            : m.content
                .filter(c => c.type === 'text' || c.type === 'markdown')
                .map(c => c.data)
                .join(''),
        }))
        .filter(m => m.content)

      allMessages.push({
        role: 'user',
        content: innerParams.prompt,
      })

      return {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiSettings.value.apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: allMessages,
          stream: true,
        }),
      }
    },
    onMessage: (chunk: SSEChunkData): AIMessageContent => {
      try {
        let dataStr = ''

        // 处理不同类型的数据
        if (typeof chunk.data === 'string') {
          dataStr = chunk.data
        }
        else if (chunk.data && typeof chunk.data === 'object') {
          // 如果是对象，尝试提取内容
          const data = chunk.data as any
          if (data.choices?.[0]?.delta?.content) {
            return {
              type: 'text',
              data: data.choices[0].delta.content,
            }
          }
          return { type: 'text', data: '' }
        }
        else {
          return { type: 'text', data: '' }
        }

        // 处理 SSE 格式的字符串数据
        if (dataStr.startsWith('data: ')) {
          const data = dataStr.slice(6).trim()
          if (data === '[DONE]') {
            return { type: 'text', data: '' }
          }

          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            return {
              type: 'text',
              data: content,
            }
          }
        }
      }
      catch (e) {
        console.error('解析响应失败:', e, chunk)
      }
      return { type: 'text', data: '' }
    },
    onError: (err: Error | Response) => {
      console.error('Chat Error:', err)
      ElMessage.error('发送消息失败，请检查API配置')
    },
    onComplete: () => {
      console.log('对话完成')
    },
  }
})

function messageProps(msg: ChatMessagesData) {
  if (msg.role === 'user') {
    return {
      variant: 'base',
      placement: 'right',
    }
  }
  if (msg.role === 'assistant') {
    return {
      placement: 'left',
      chatContentProps: {
        thinking: {
          maxHeight: 200,
          layout: 'block',
          collapsed: true,
        },
      },
    }
  }
  return {}
}

const senderProps = {
  placeholder: '提问或输入 / 使用捷径，Enter 发送，Shift+Enter 换行',
}

// 监听抽屉打开
watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.initialPrompt && messages.value.length === 0) {
      messages.value = [{
        id: Date.now().toString(),
        role: 'assistant',
        content: [
          {
            type: 'text',
            status: 'complete',
            data: `你好，我是 ${props.promptTitle || 'AI 助手'}。`,
          },
          {
            type: 'thinking',
            status: 'complete',
            data: {
              title: '当前提示词内容',
              text: props.initialPrompt,
            },
          },
        ],
      }]
    }
    if (apiSettings.value?.modelProvider === 'custom' && apiSettings.value?.customModel) {
      selectedModel.value = apiSettings.value.customModel
    }
  }
})
</script>

<template>
  <el-drawer
    :model-value="visible"
    size="50%"
    :show-close="false"
    @close="handleClose"
  >
    <template #header>
      <div class="drawer-header">
        <h3>{{ promptTitle || 'AI 助手' }}</h3>
        <div class="header-actions">
          <el-button circle size="small" @click="handleClose">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div class="chat-container">
      <t-chatbot
        :default-messages="messages"
        :message-props="messageProps"
        :sender-props="senderProps"
        :chat-service-config="chatServiceConfig"
      >
        <template #sender-footer-prefix>
          <div class="model-select">
            <el-tooltip content="切换模型" placement="top">
              <el-select
                v-model="selectedModel"
                size="small"
                placeholder="选择模型"
                style="width: 200px;"
              >
                <el-option
                  v-for="model in modelOptions"
                  :key="model.value"
                  :label="model.label"
                  :value="model.value"
                />
              </el-select>
            </el-tooltip>
          </div>
        </template>
      </t-chatbot>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.chat-container {
  height: calc(100vh - 120px);

  :deep(.t-chatbot) {
    height: 100%;
  }

  .model-select {
    display: flex;
    align-items: center;

    :deep(.el-select) {
      width: 150px;
    }
  }
}
</style>
