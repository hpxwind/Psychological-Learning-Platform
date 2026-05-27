<template>
  <div class="chat-overlay" @click.self="handleOverlayClick">
    <div class="chat-container" :class="{ 'chat-minimized': isMinimized }">
      <!-- 头部 -->
      <div class="chat-header">
        <div class="header-left">
          <div class="avatar">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="currentColor"/>
              <path d="M8 10h8M8 14h5" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="header-info">
            <div class="title">AI 心理学助手</div>
            <div class="subtitle">心理学 · 精神分析 · 哲学</div>
          </div>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="toggleMinimize" v-if="!isMinimized">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          <button class="action-btn" @click="toggleMinimize" v-else>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button class="action-btn close-btn" @click="handleClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesContainer">
        <div class="message ai-message">
          <div class="message-avatar ai-avatar">
            <img :src="faceIcon" alt="AI助手" />
          </div>
          <div class="message-content">
            <div class="message-text">您好！我是您的AI心理学助手，专注于心理学、精神分析和哲学领域的咨询。请问有什么我可以帮助您的吗？</div>
          </div>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="message"
          :class="message.role === 'user' ? 'user-message' : 'ai-message'"
        >
          <div
            class="message-avatar"
            :class="message.role === 'user' ? 'user-avatar' : 'ai-avatar'"
          >
            <img v-if="message.role === 'ai'" :src="faceIcon" alt="AI助手" />
            <img v-else :src="userIcon" alt="用户" />
          </div>
          <div class="message-content">
            <div v-if="message.image" class="message-image">
              <img :src="message.image" alt="上传的图片" />
            </div>
            <div v-if="message.text" class="message-text" v-html="formatMessage(message.text)"></div>
            <div v-if="message.isLoading" class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-area">
        <!-- 推荐搜索 -->
        <div class="recommend-search" v-if="messages.length <= 1">
          <span 
            v-for="(item, index) in recommendSearches" 
            :key="index"
            class="recommend-item"
            @click="selectRecommend(item)"
          >
            {{ item }}
          </span>
        </div>
        <div class="input-wrapper">
          <button class="icon-btn upload-btn" @click="triggerFileUpload" :disabled="isLoading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            style="display: none"
          />

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

        <!-- 图片预览 -->
        <div v-if="uploadedImage" class="image-preview">
          <img :src="uploadedImage" alt="预览" />
          <button class="remove-image" @click="removeImage">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'

// 导入SVG图标
import faceIcon from '../assets/face.svg'
import userIcon from '../assets/user.svg'

interface Message {
  role: 'user' | 'ai'
  text?: string
  image?: string
  isLoading?: boolean
}

const props = defineProps<{
  initialMessage?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const messages = ref<Message[]>([])
const inputText = ref('')
const uploadedImage = ref('')
const isLoading = ref(false)
const isMinimized = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputTextarea = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const recommendSearches = [
  '什么是焦虑症？',
  '如何缓解压力',
  '抑郁症的表现',
  '人际交往技巧',
  '自我认知方法'
]

const selectRecommend = (text: string) => {
  inputText.value = text
  sendMessage()
}

// 发送消息
const sendMessage = async () => {
  if (isLoading.value || (!inputText.value.trim() && !uploadedImage.value)) return

  const userMessage: Message = {
    role: 'user',
    text: inputText.value.trim(),
    image: uploadedImage.value
  }

  messages.value.push(userMessage)

  // 清空输入
  const messageToSend = inputText.value.trim()
  const imageToSend = uploadedImage.value
  inputText.value = ''
  uploadedImage.value = ''

  // 添加AI加载消息
  const loadingMessage: Message = {
    role: 'ai',
    isLoading: true
  }
  messages.value.push(loadingMessage)
  isLoading.value = true

  try {
    // 调用后端API
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: messageToSend,
        image: imageToSend,
        history: messages.value.filter(m => !m.isLoading).map(m => ({
          role: m.role,
          content: m.text || (m.image ? '[图片]' : '')
        }))
      })
    })

    const data = await response.json()

    // 移除加载消息
    messages.value = messages.value.filter(m => !m.isLoading)

    // 添加AI回复
    if (data.success) {
      messages.value.push({
        role: 'ai',
        text: data.reply
      })
    } else {
      messages.value.push({
        role: 'ai',
        text: '抱歉，我遇到了一些问题。请稍后再试。'
      })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    messages.value = messages.value.filter(m => !m.isLoading)
    messages.value.push({
      role: 'ai',
      text: '网络连接失败，请检查您的网络设置。'
    })
  } finally {
    isLoading.value = false
    scrollToBottom()
  }
}

// 格式化消息（支持换行等）
const formatMessage = (text: string) => {
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 触发文件上传
const triggerFileUpload = () => {
  fileInput.value?.click()
}

// 处理文件上传
const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// 移除图片
const removeImage = () => {
  uploadedImage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 切换最小化
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value
}

// 关闭聊天
const handleClose = () => {
  emit('close')
}

// 处理遮罩点击
const handleOverlayClick = () => {
  // 可选：点击遮罩不关闭，只最小化
  // toggleMinimize()
}

// 监听初始消息
watch(() => props.initialMessage, (newMessage) => {
  if (newMessage) {
    inputText.value = newMessage
    nextTick(() => {
      sendMessage()
    })
  }
}, { immediate: true })

// 自动调整输入框高度
watch(inputText, () => {
  nextTick(() => {
    if (inputTextarea.value) {
      inputTextarea.value.style.height = 'auto'
      inputTextarea.value.style.height = Math.min(inputTextarea.value.scrollHeight, 120) + 'px'
    }
  })
})

onMounted(() => {
  scrollToBottom()
})
</script>

<style scoped>
.chat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  z-index: 9998;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.chat-container {
  width: 420px;
  height: 600px;
  background: white;
  border: 2px solid #2d2d2d;
  border-radius: 8px;
  box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.chat-container.chat-minimized {
  height: 60px;
}

.chat-header {
  padding: 14px 16px;
  background: #2d2d2d;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  background: #e74c3c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 1px;
}

.subtitle {
  font-size: 11px;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: rgba(255,255,255,0.2);
}

.action-btn svg {
  width: 14px;
  height: 14px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f5f0e8;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f5f0e8;
}

.message {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  animation: messageSlide 0.2s ease;
}

@keyframes messageSlide {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-avatar {
  background: #e74c3c;
}

.user-avatar {
  background: #3498db;
}

.message-avatar img {
  width: 18px;
  height: 18px;
}

.message-content {
  max-width: 75%;
}

.message.user-message .message-content {
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}

.ai-message .message-text {
  background: white;
  color: #2d2d2d;
  border: 1px solid #e5e5e5;
  border-top-left-radius: 2px;
}

.user-message .message-text {
  background: #3498db;
  color: white;
  border-bottom-right-radius: 2px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 14px 18px;
  background: white;
  border: 1px solid #e5e5e5;
  border-top-left-radius: 2px;
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

.chat-input-area {
  padding: 12px 14px;
  background: white;
  border-top: 2px solid #2d2d2d;
  flex-shrink: 0;
}

.recommend-search {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.recommend-item {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recommend-item:hover {
  background: #2d2d2d;
  color: white;
  border-color: #2d2d2d;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #2d2d2d;
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #2d2d2d;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.icon-btn:hover:not(:disabled) {
  background: #2d2d2d;
  color: white;
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-btn svg {
  width: 16px;
  height: 16px;
}

textarea {
  flex: 1;
  border: 2px solid #2d2d2d;
  background: white;
  border-radius: 4px;
  padding: 10px 14px;
  font-size: 14px;
  resize: none;
  outline: none;
  max-height: 100px;
  min-height: 40px;
  font-family: inherit;
}

textarea:focus {
  border-color: #3498db;
}

.send-btn {
  width: 36px;
  height: 36px;
  border: 2px solid #2d2d2d;
  background: #2d2d2d;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #e74c3c;
  border-color: #e74c3c;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 14px;
  height: 14px;
}

@media (max-width: 480px) {
  .chat-container {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  .chat-overlay {
    padding: 0;
  }
}
</style>
