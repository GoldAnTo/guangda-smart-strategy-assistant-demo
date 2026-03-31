<template>
  <el-card class="chat-card">
    <template #header>
      <div class="chat-header">
        <div>
          <strong>AI 沟通辅助</strong>
          <p>优先用它把方向讲明白、把偏好聊清楚，再决定要不要生成你的参考结论。</p>
        </div>
        <div class="chat-badge">Conversation Lab</div>
      </div>
    </template>

    <div class="quick-list">
      <el-button v-for="question in quickQuestions" :key="question" size="small" @click="$emit('quick-ask', question)">
        {{ question }}
      </el-button>
    </div>

    <div class="message-list">
      <div v-for="(message, index) in messages" :key="index" class="message-item" :class="message.role">
        <div class="role">{{ message.role === 'user' ? '你' : 'AI' }}</div>
        <div class="bubble">{{ message.content }}</div>
      </div>
    </div>

    <el-alert
      v-if="shouldEscalate"
      title="当前问题涉及正式推荐或敏感判断，建议人工进一步确认"
      type="warning"
      :closable="false"
      class="mb"
    />

    <div class="cta-row" v-if="showGenerateAction">
      <div class="cta-copy">
        <strong>如果你觉得已经聊得差不多了</strong>
        <span>可以先生成一版属于你的参考方向，再决定要不要继续细聊。</span>
      </div>
      <el-button type="primary" @click="$emit('generate-reference')">生成我的参考方向</el-button>
    </div>

    <div class="input-row">
      <el-input v-model="inputValue" placeholder="请输入要继续追问的问题" @keyup.enter="handleSend" />
      <el-button type="primary" @click="handleSend">发送</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ChatMessage } from '../types/chat'

defineProps<{ messages: ChatMessage[]; shouldEscalate?: boolean; quickQuestions?: string[]; showGenerateAction?: boolean }>()
const emit = defineEmits(['send', 'quick-ask', 'generate-reference'])
const inputValue = ref('')

function handleSend() {
  const value = inputValue.value.trim()
  if (!value) return
  emit('send', value)
  inputValue.value = ''
}
</script>

<style scoped>
.chat-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.chat-header p {
  margin: 8px 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.chat-badge {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(23, 55, 91, 0.08);
  color: var(--blue);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.quick-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.message-list {
  min-height: 280px;
  max-height: 460px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  max-width: 85%;
}

.message-item.user {
  align-self: flex-end;
}

.role {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 4px;
}

.bubble {
  padding: 12px 14px;
  border-radius: 16px;
  line-height: 1.7;
  background: rgba(23, 55, 91, 0.06);
}

.message-item.user .bubble {
  background: linear-gradient(135deg, #17375b, #2b587c);
  color: #fff8ef;
}

.cta-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-top: 18px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(23, 55, 91, 0.06);
}

.cta-copy strong {
  display: block;
  margin-bottom: 6px;
  color: var(--blue);
}

.cta-copy span {
  color: var(--muted);
  line-height: 1.7;
}

.input-row {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.mb {
  margin-bottom: 16px;
}
</style>
