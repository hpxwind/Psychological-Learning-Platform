<template>
  <div class="chat-full-page fixed inset-0 bg-[#1a1410] flex flex-col items-center justify-center">
    <!-- 返回按钮（右上角） -->
    <button
      @click="$router.back()"
      class="fixed top-5 right-5 z-50 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all duration-300 hover:scale-110"
      title="返回"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- 名字：放在整体上方 -->
    <h1 class="text-2xl font-bold text-[#c9a96e] tracking-wider mb-3 flex-shrink-0"
      style="font-family: 'Playfair Display', serif;">
      {{ celebrity?.name }}
    </h1>

    <!-- 内容区：左右作为整体，居中，自适应宽度 -->
    <div class="flex gap-6 h-[82vh]">
      <!-- 左侧：对话区 -->
      <div class="left-panel w-[340px] flex-shrink-0 flex flex-col pl-6 pr-0 pb-8">

        <!-- 提示文字 -->
        <p class="text-sm text-white/40 mb-3 flex-shrink-0 italic">
          试着随便说点什么，让{{ celebrity?.name?.slice(0, 4) || '' }}来分析
        </p>

        <!-- 输入框区域 -->
        <div class="flex-shrink-0">
          <div class="relative">
            <textarea
              ref="inputEl"
              v-model="inputText"
              @focus="onInputFocus"
              @blur="onInputBlur"
              @keydown.enter.exact.prevent="sendMessage"
              :disabled="loading"
              placeholder="在这里写下你想说的话……"
              rows="4"
              maxlength="500"
              class="w-full px-4 py-3 bg-[#231c17] text-white/80 border border-white/10 rounded-lg text-sm leading-relaxed resize-none focus:outline-none focus:border-[#c9a96e]/40 placeholder-white/15 disabled:opacity-50 transition-all duration-300"
            ></textarea>
            <div class="absolute bottom-2 right-3 text-xs text-white/20">
              {{ inputText.length }}/500
            </div>
          </div>
        </div>

        <!-- 发送按钮 -->
        <div class="py-3 flex-shrink-0">
          <button
            @click="sendMessage"
            :disabled="loading || !inputText.trim()"
            class="w-full py-2 border border-[#c9a96e]/60 text-[#c9a96e] text-sm rounded-lg hover:bg-[#c9a96e]/10 hover:border-[#c9a96e] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300 tracking-wider"
          >
            你怎么看？
          </button>
        </div>

        <!-- 对话内容滚动区 -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto min-h-0">
          <div v-if="messages.length === 0 && !loading" class="flex items-center justify-center h-40">
            <p class="text-white/15 text-xs italic">输入你的问题，开始对话</p>
          </div>
          <div v-else class="space-y-5">
            <div v-for="(msg, idx) in messages" :key="idx">
              <div v-if="msg.role === 'assistant'" class="mb-4">
                <div class="bg-[#231c17] border border-white/5 rounded-lg px-4 py-3">
                  <div class="text-[#c9a96e]/60 text-xs mb-1.5">{{ celebrity?.name }} 的回答</div>
                  <div class="text-white/70 text-sm leading-relaxed">{{ msg.content }}</div>
                </div>
              </div>
            </div>
            <div v-if="loading" class="mb-4">
              <div class="bg-[#231c17] border border-white/5 rounded-lg px-4 py-3">
                <div class="text-[#c9a96e]/60 text-xs mb-1.5">{{ celebrity?.name }} 正在思考</div>
                <div class="flex gap-1.5 py-1">
                  <span class="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
                  <span class="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
                  <span class="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：人物展示 -->
      <div class="flex items-center justify-center">
        <!-- 人物大图容器：带固定边框，图片缩放适应保持比例 -->
        <div class="border border-white/15 rounded-sm overflow-hidden" :class="imageContainerBorderClass">
          <img
            :src="displayImage"
            :alt="celebrity?.name"
            class="max-w-[55vw] max-h-[72vh] object-contain"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/lib/axios';

interface Celebrity {
  id: number;
  name: string;
  introduction: string;
  life_story: string;
  works: string;
  photo: string;
  status_idle?: string;
  status_listening?: string;
  status_thinking?: string;
  status_answered?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const stripMd = (md: string, maxLen = 80) => {
  if (!md) return '';
  const text = md.replace(/[#*`>\-\[\]()!]/g, '').replace(/\n/g, ' ');
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
};

const route = useRoute();
const celebrity = ref<Celebrity | null>(null);
const messages = ref<Message[]>([]);
const inputText = ref('');
const loading = ref(false);
const chatContainer = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLTextAreaElement | null>(null);

// 对话状态：idle | listening | thinking | answered
const chatState = ref<'idle' | 'listening' | 'thinking' | 'answered'>('idle');
const isInputFocused = ref(false);

// 右侧展示图片：根据状态选择
const displayImage = computed(() => {
  if (!celebrity.value) return '';
  switch (chatState.value) {
    case 'listening':
      return celebrity.value.status_listening || celebrity.value.status_idle || celebrity.value.photo || '';
    case 'thinking':
      return celebrity.value.status_thinking || celebrity.value.status_idle || celebrity.value.photo || '';
    case 'answered':
      return celebrity.value.status_answered || celebrity.value.status_idle || celebrity.value.photo || '';
    default:
      return celebrity.value.status_idle || celebrity.value.photo || '';
  }
});

// 状态标签
const stateLabel = computed(() => {
  switch (chatState.value) {
    case 'listening': return '聆听';
    case 'thinking': return '思考';
    case 'answered': return '已回复';
    default: return '无动作';
  }
});

const stateSubLabel = computed(() => {
  switch (chatState.value) {
    case 'listening': return '正在聆听你的问题';
    case 'thinking': return '正在思考如何回答';
    case 'answered': return '回答已生成';
    default: return '等待提问';
  }
});

const stateLabelClass = computed(() => {
  switch (chatState.value) {
    case 'listening': return 'bg-[#c9a96e]/20 text-[#c9a96e] border border-[#c9a96e]/30';
    case 'thinking': return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    case 'answered': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    default: return 'bg-white/5 text-white/40 border border-white/10';
  }
});

const imageContainerBorderClass = computed(() => {
  switch (chatState.value) {
    case 'listening': return 'shadow-[0_0_40px_rgba(201,169,110,0.2)] border-[#c9a96e]/40';
    case 'thinking': return 'shadow-[0_0_40px_rgba(245,158,11,0.2)] border-amber-500/40';
    case 'answered': return 'shadow-[0_0_40px_rgba(16,185,129,0.2)] border-emerald-500/40';
    default: return 'border-white/15';
  }
});

const onInputFocus = () => {
  isInputFocused.value = true;
  if (chatState.value === 'idle' || chatState.value === 'answered') {
    chatState.value = 'listening';
  }
};

const onInputBlur = () => {
  isInputFocused.value = false;
  // 延迟切换回 idle，避免与发送按钮点击冲突
  setTimeout(() => {
    if (!isInputFocused.value && chatState.value === 'listening' && !inputText.value) {
      chatState.value = 'idle';
    }
  }, 200);
};

const fetchCelebrity = async () => {
  try {
    const id = route.params.id;
    const res = await api.get(`/famous/${id}`);
    if (res.data.success) {
      celebrity.value = res.data.data;
    }
  } catch (error) {
    console.error('获取名人详情失败:', error);
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || loading.value) return;

  const c = celebrity.value;
  if (!c) return;

  chatState.value = 'thinking';

  messages.value.push({ role: 'user', content: text });
  await scrollToBottom();

  loading.value = true;
  try {
    // 使用 Agent 智能体进行 RAG 回答
    const res = await api.post('/agent/celebrity-chat', {
      celebrity_id: c.id,
      celebrity_name: c.name,
      query: text
    });
    if (res.data.success) {
      messages.value.push({ role: 'assistant', content: res.data.reply });
    } else {
      messages.value.push({ role: 'assistant', content: '抱歉，我暂时无法回答这个问题。' });
    }
  } catch {
    // 降级到普通 AI 聊天
    try {
      let context = `你正在扮演${c.name}。`;
      const intro = stripMd(c.introduction, 200);
      if (intro) context += `\n简介：${intro}`;
      const story = stripMd(c.life_story, 500);
      if (story) context += `\n生平：${story}`;
      const works = stripMd(c.works, 300);
      if (works) context += `\n著作：${works}`;
      context += `\n\n请以他的口吻、思想和风格来回答以下问题。保持回答简洁、有深度，符合他的理论体系：\n\n${text}`;

      const fallbackRes = await api.post('/ai/chat', { message: context });
      if (fallbackRes.data.success) {
        messages.value.push({ role: 'assistant', content: fallbackRes.data.reply });
      } else {
        messages.value.push({ role: 'assistant', content: '抱歉，我暂时无法回答这个问题。' });
      }
    } catch {
      messages.value.push({ role: 'assistant', content: '网络连接失败，请稍后重试。' });
    }
  } finally {
    loading.value = false;
    chatState.value = 'answered';
    await scrollToBottom();
  }
};

// 当用户又开始输入时，从 answered 切回 listening
watch(inputText, (val) => {
  if (val && (chatState.value === 'answered' || chatState.value === 'idle')) {
    chatState.value = 'listening';
  }
});

onMounted(() => {
  fetchCelebrity();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

/* 滚动条 */
.left-panel ::-webkit-scrollbar {
  width: 4px;
}
.left-panel ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}
.left-panel ::-webkit-scrollbar-track {
  background: transparent;
}

/* 动画 */
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
.animate-bounce {
  animation: bounce 1.2s ease-in-out infinite;
}
</style>
