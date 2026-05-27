<template>
  <div class="ai-fullchat-page bg-grid">
    <!-- 顶部导航 -->
    <header class="page-header">
      <button class="back-btn" @click="goHome">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </button>
      <h1 class="page-title">AI心理助手</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- 聊天区域 -->
    <main class="chat-main">
      <div class="messages-container" ref="messagesContainer">
        <!-- 欢迎区域 -->
        <div v-if="messages.length === 0" class="welcome-section">
          <div class="quick-topics">
            <span
              v-for="(topic, index) in quickTopics"
              :key="index"
              class="topic-tag"
              @click="selectTopic(topic)"
            >
              {{ topic }}
            </span>
          </div>
        </div>

        <!-- 消息列表 -->
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message-wrapper"
          :class="message.role"
        >
          <!-- 加载状态 -->
          <div v-if="message.isLoading" class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          
          <!-- AI 消息 -->
          <template v-else-if="message.role === 'ai'">
            <div class="ai-message-box">
              <div class="message-badge">
                <span class="ai-label">由AI生成</span>
                <button class="copy-btn" @click="copyText(message.text || '')" :class="{ copied: copiedIndex === index }" title="复制">
                  <svg v-if="copiedIndex !== index" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </div>
              <div class="message-text" v-html="formatMessage(message.text || '')"></div>
            </div>
          </template>

          <!-- 用户消息 -->
          <template v-else>
            <div class="message-text" v-html="formatMessage(message.text || '')"></div>
          </template>
        </div>
      </div>
    </main>

    <!-- 底部输入框 -->
    <footer class="chat-footer">
      <div class="input-row">
        <textarea
          v-model="inputText"
          placeholder="输入您的问题..."
          @keydown="handleKeyDown"
          rows="1"
          ref="inputTextarea"
        ></textarea>
        <button
          class="send-btn"
          @click="sendMessage"
          :disabled="isLoading || !inputText.trim()"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface Message {
  role: 'user' | 'ai'
  text?: string
  isLoading?: boolean
}

const route = useRoute()
const router = useRouter()

const CHAT_KEY = 'ai_chat_history'
const messages = ref<Message[]>([])
const inputText = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputTextarea = ref<HTMLTextAreaElement | null>(null)
const copiedIndex = ref<number | null>(null)

const saveChatHistory = () => {
  const history = messages.value.filter(m => !m.isLoading)
  localStorage.setItem(CHAT_KEY, JSON.stringify(history))
}

const loadChatHistory = () => {
  const saved = localStorage.getItem(CHAT_KEY)
  if (saved) {
    try {
      return JSON.parse(saved) as Message[]
    } catch {
      return []
    }
  }
  return []
}

const quickTopics = [
  '什么是锚定效应？',
  '如何克服拖延症？',
  '弗洛伊德的潜意识理论',
  '认知失调是什么？',
  '心流状态如何进入？',
  '损失厌恶心理'
]

const selectTopic = (topic: string) => {
  inputText.value = topic
  nextTick(() => sendMessage())
}

const goHome = () => {
  router.push('/')
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    const index = messages.value.findIndex(m => m.text === text)
    if (index !== -1) {
      copiedIndex.value = index
      setTimeout(() => {
        copiedIndex.value = null
      }, 2000)
    }
  } catch (err) {
    console.error('复制失败:', err)
  }
}

const sendMessage = async () => {
  if (isLoading.value || !inputText.value.trim()) return

  const userMessage: Message = {
    role: 'user',
    text: inputText.value.trim()
  }

  messages.value.push(userMessage)

  const messageToSend = inputText.value.trim()
  inputText.value = ''

  const loadingMessage: Message = {
    role: 'ai',
    isLoading: true
  }
  messages.value.push(loadingMessage)
  isLoading.value = true
  scrollToBottom()

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageToSend,
        history: messages.value.filter(m => !m.isLoading).map(m => ({
          role: m.role,
          content: m.text || ''
        }))
      })
    })

    const data = await response.json()
    messages.value = messages.value.filter(m => !m.isLoading)

    if (data.success) {
      messages.value.push({ role: 'ai', text: data.reply })
    } else {
      messages.value.push({ role: 'ai', text: '抱歉，我遇到了一些问题。请稍后再试。' })
    }
  } catch (error) {
    messages.value = messages.value.filter(m => !m.isLoading)
    messages.value.push({ role: 'ai', text: '网络连接失败，请检查您的网络设置。' })
  } finally {
    isLoading.value = false
    saveChatHistory()
    scrollToBottom()
  }
}

const formatMessage = (text: string) => {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

watch(inputText, () => {
  nextTick(() => {
    if (inputTextarea.value) {
      inputTextarea.value.style.height = 'auto'
      inputTextarea.value.style.height = Math.min(inputTextarea.value.scrollHeight, 120) + 'px'
    }
  })
})

onMounted(() => {
  const q = route.query.q as string
  if (q) {
    inputText.value = q
    nextTick(() => sendMessage())
  } else {
    messages.value = loadChatHistory()
  }
})
</script>

<style scoped>
.ai-fullchat-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

/* 顶部导航 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border-bottom: 2px solid #2d2d2d;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #2d2d2d;
  transition: all 0.15s;
  border-radius: 8px;
}

.back-btn:hover {
  background: #f0f0f0;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.page-title {
  font-size: 16px;
  font-weight: 700;
  color: #2d2d2d;
  margin: 0;
}

.header-spacer {
  width: 36px;
}

/* 聊天主区域 */
.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 100px;
}

.chat-main::-webkit-scrollbar {
  display: none;
}
.chat-main {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.messages-container {
  max-width: 1000px;
  margin: 0 auto;
}

/* 欢迎区域 */
.welcome-section {
  padding: 20px;
}

.quick-topics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-tag {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 14px;
  color: #2d2d2d;
  cursor: pointer;
  transition: all 0.15s;
}

.topic-tag:hover {
  background: #2d2d2d;
  color: white;
  border-color: #2d2d2d;
}

/* 消息样式 */
.message-wrapper {
  padding: 10px 20px;
}

.message-text {
  font-size: 15px;
  line-height: 1.7;
  word-wrap: break-word;
  padding: 16px 20px;
  border-radius: 20px;
}

.user .message-text {
  background: #2d2d2d;
  color: white;
  border: 2px solid white;
}

.ai .message-text {
  background: white;
  color: #2d2d2d;
  border: 2px solid #ddd;
}

/* AI 消息盒子 */
.ai-message-box {
  position: relative;
  background: white;
  border: 2px solid #ddd;
  border-radius: 20px;
  overflow: hidden;
}

.message-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.ai-label {
  font-size: 11px;
  color: #999;
}

.copy-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #999;
  transition: all 0.15s;
}

.copy-btn:hover {
  background: #f0f0f0;
  color: #2d2d2d;
}

.copy-btn.copied {
  color: #4caf50;
}

.copy-btn svg {
  width: 16px;
  height: 16px;
}

.ai-message-box .message-text {
  border: none;
  border-radius: 0;
  background: transparent;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  gap: 5px;
  padding: 16px 20px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 20px;
  width: fit-content;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #ccc;
  border-radius: 50%;
  animation: typing 1.2s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}

/* 底部输入框 */
.chat-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px 24px;
}

.input-row {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

textarea {
  flex: 1;
  background: white;
  border: 2px solid #2d2d2d;
  border-radius: 24px;
  padding: 14px 20px;
  font-size: 15px;
  resize: none;
  outline: none;
  max-height: 120px;
  min-height: 48px;
  font-family: inherit;
  overflow: hidden;
}

textarea:focus {
  box-shadow: 0 0 0 3px rgba(45, 45, 45, 0.1);
}

textarea::placeholder {
  color: #999;
}

.send-btn {
  width: 48px;
  height: 48px;
  border: none;
  background: #2d2d2d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.15s;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #e74c3c;
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-btn svg {
  width: 18px;
  height: 18px;
}

/* 响应式 */
@media (max-width: 768px) {
  .messages-container {
    padding: 0 4px;
  }
  
  .input-row {
    padding: 0 4px;
  }
}
</style>
