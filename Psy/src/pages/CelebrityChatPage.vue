<template>
  <div class="celebrity-chat h-full bg-gray-50">
    <!-- ========== 左侧 40%：展示区（固定不动） ========== -->
    <div class="left-panel fixed top-0 left-0 w-[40%] h-full overflow-hidden z-10">
      <!-- 深色渐变背景（无照片时显示） -->
      <div class="absolute inset-0 bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-950 transition-opacity duration-700"
        :class="displayPhoto ? 'opacity-0' : 'opacity-100'"></div>
      <!-- 照片展示层（自动轮播 / 悬停，渐变切换） -->
      <div class="absolute inset-0"
        :class="displayPhoto ? 'opacity-100' : 'opacity-0'">
        <Transition name="photo-fade" mode="out-in">
          <img
            v-if="displayPhoto"
            :key="displayPhoto"
            :src="displayPhoto"
            class="absolute inset-0 w-full h-full object-cover"
            :alt="displayName"
          />
        </Transition>
        <div class="absolute inset-0 bg-black/55"></div>
      </div>
      <!-- 点阵纹理 -->
      <div class="absolute inset-0 opacity-[0.04] pointer-events-none"
        style="background-image: radial-gradient(circle, #fff 1px, transparent 1px); background-size: 32px 32px;"></div>
    </div>

    <!-- 视窗底部固定：名字 -->
    <div class="fixed bottom-0 left-0 w-[40%] z-50 pb-10 text-center transition-all duration-500 pointer-events-none"
      :class="displayName ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'">
      <h2 class="text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-2xl tracking-wide mb-3"
        style="font-family: 'Playfair Display', serif;">
        {{ displayName }}
      </h2>
      <div class="w-12 h-[2px] bg-white/40 rounded-full mx-auto"></div>
    </div>

    <!-- ========== 右侧：名人选择区 ========== -->
    <div class="right-panel ml-[40%] h-full overflow-y-auto px-6 md:px-10 py-8">
      <!-- 加载状态 -->
      <div v-if="loadingCelebrities" class="flex items-center justify-center h-full">
        <p class="text-gray-400 text-lg">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="celebrities.length === 0" class="flex items-center justify-center h-full">
        <p class="text-gray-400 text-lg">暂无名人数据，请在后台添加</p>
      </div>

      <!-- 名人卡片网格：每行两个 -->
      <div v-else class="grid grid-cols-2 gap-4">
        <div
          v-for="(celebrity, idx) in celebrities"
          :key="celebrity.id"
          @click="startChat(celebrity, idx)"
          @mouseenter="onCardEnter(celebrity)"
          @mouseleave="onCardLeave()"
          class="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-indigo-100 hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 group"
        >
          <!-- 头像：方形 -->
          <div class="aspect-square w-full overflow-hidden bg-gray-100 relative">
            <img
              v-if="celebrity.photo"
              :src="celebrity.photo"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              :alt="celebrity.name"
            />
            <div
              v-else
              class="w-full h-full flex items-center justify-center text-5xl font-bold text-gray-300"
              :style="{ background: colorPalette[idx % colorPalette.length] }"
            >
              {{ celebrity.name.charAt(0) }}
            </div>
          </div>
          <!-- 姓名 -->
          <div class="py-3 px-3 text-center">
            <h3 class="text-sm md:text-base font-bold text-gray-700 group-hover:text-indigo-600 transition-colors truncate">
              {{ celebrity.name }}
            </h3>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 对话弹窗 ========== -->
    <el-dialog
      v-model="chatVisible"
      :title="`与 ${currentCelebrity?.name} 对话`"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="chat-window h-[450px] flex flex-col">
        <!-- 消息列表 -->
        <div ref="chatContainer" class="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          <div v-if="messages.length === 0" class="text-center text-gray-400 mt-20">
            <div class="w-16 h-16 mx-auto mb-4 border-4 border-black overflow-hidden flex items-center justify-center"
              :style="{ background: currentColor }">
              <img v-if="currentCelebrity?.photo" :src="currentCelebrity.photo" class="w-full h-full object-cover" :alt="currentCelebrity.name" />
              <span v-else class="text-3xl">{{ currentCelebrity?.name?.charAt(0) }}</span>
            </div>
            <p>开始与 {{ currentCelebrity?.name }} 的对话吧</p>
          </div>

          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            :class="msg.role === 'user' ? 'flex justify-end' : 'flex gap-3'"
          >
            <div
              v-if="msg.role === 'assistant'"
              class="w-8 h-8 flex items-center justify-center text-sm border-2 border-black flex-shrink-0 overflow-hidden"
              :style="{ background: currentColor }"
            >
              <img v-if="currentCelebrity?.photo" :src="currentCelebrity.photo" class="w-full h-full object-cover" :alt="currentCelebrity.name" />
              <span v-else>{{ currentCelebrity?.name?.charAt(0) }}</span>
            </div>
            <div
              :class="[
                'max-w-[75%] px-4 py-2.5 border-2 border-black text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-white'
              ]"
            >
              {{ msg.content }}
            </div>
          </div>

          <div v-if="loading" class="flex gap-3">
            <div
              class="w-8 h-8 flex items-center justify-center text-sm border-2 border-black flex-shrink-0 overflow-hidden"
              :style="{ background: currentColor }"
            >
              <img v-if="currentCelebrity?.photo" :src="currentCelebrity.photo" class="w-full h-full object-cover" :alt="currentCelebrity?.name" />
              <span v-else>{{ currentCelebrity?.name?.charAt(0) }}</span>
            </div>
            <div class="px-4 py-2.5 border-2 border-black bg-white">
              <span class="animate-pulse">...</span>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="flex gap-2">
          <input
            v-model="inputText"
            @keydown.enter="sendMessage"
            :disabled="loading"
            :placeholder="`向 ${currentCelebrity?.name} 提问...`"
            class="flex-1 px-4 py-2.5 border-2 border-black text-sm focus:outline-none disabled:bg-gray-100"
          />
          <button
            @click="sendMessage"
            :disabled="loading || !inputText.trim()"
            class="px-6 py-2.5 bg-black text-white font-bold text-sm border-2 border-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue';
import api from '@/lib/axios';

interface Celebrity {
  id: number;
  name: string;
  introduction: string;
  life_story: string;
  works: string;
  photo: string;
  status_idle: string;
  status_listening: string;
  status_thinking: string;
  status_answered: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// 预设色板用于卡片背景
const colorPalette = ['#f5f0e8', '#e8f0f5', '#f0f5e8', '#f5e8f0', '#e8f5f0', '#faf0e6', '#f0e6fa', '#e6faf0'];

// 去除MD标记，提取纯文本简介
const stripMd = (md: string, maxLen = 80) => {
  if (!md) return '';
  const text = md.replace(/[#*`>\-\[\]()!]/g, '').replace(/\n/g, ' ');
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
};

const celebrities = ref<Celebrity[]>([]);
const loadingCelebrities = ref(true);
const hoveredPhoto = ref('');
const hoveredName = ref('');
const isHovering = ref(false);

// 自动轮播
const autoIndex = ref(0);
let autoTimer: ReturnType<typeof setInterval> | null = null;

const celebritiesWithPhotos = computed(() =>
  celebrities.value.filter(c => c.photo)
);

const autoPhoto = computed(() => {
  if (celebritiesWithPhotos.value.length === 0) return '';
  return celebritiesWithPhotos.value[autoIndex.value]?.photo || '';
});

const autoName = computed(() => {
  if (celebritiesWithPhotos.value.length === 0) return '';
  return celebritiesWithPhotos.value[autoIndex.value]?.name || '';
});

const displayPhoto = computed(() => hoveredPhoto.value || autoPhoto.value);
const displayName = computed(() => hoveredName.value || autoName.value);

const startAutoPlay = () => {
  stopAutoPlay();
  if (celebritiesWithPhotos.value.length <= 1) return;
  autoTimer = setInterval(() => {
    autoIndex.value = (autoIndex.value + 1) % celebritiesWithPhotos.value.length;
  }, 10000);
};

const stopAutoPlay = () => {
  if (autoTimer) {
    clearInterval(autoTimer);
    autoTimer = null;
  }
};

const onCardEnter = (celebrity: Celebrity) => {
  isHovering.value = true;
  stopAutoPlay();
  hoveredPhoto.value = celebrity.photo || '';
  hoveredName.value = celebrity.name;
};

const onCardLeave = () => {
  isHovering.value = false;
  hoveredPhoto.value = '';
  hoveredName.value = '';
  startAutoPlay();
};

const fetchCelebrities = async () => {
  loadingCelebrities.value = true;
  try {
    const res = await api.get('/famous', { params: { limit: 50 } });
    if (res.data.success) {
      celebrities.value = res.data.data;
    }
  } catch (error) {
    console.error('加载名人列表失败:', error);
  } finally {
    loadingCelebrities.value = false;
  }
};

const chatVisible = ref(false);
const currentCelebrity = ref<Celebrity | null>(null);
const currentCelebrityIndex = ref(0);
const currentColor = ref('');
const messages = ref<Message[]>([]);
const inputText = ref('');
const loading = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

const startChat = (celebrity: Celebrity, idx: number) => {
  currentCelebrity.value = celebrity;
  currentCelebrityIndex.value = idx;
  currentColor.value = colorPalette[idx % colorPalette.length];
  messages.value = [];
  inputText.value = '';
  chatVisible.value = true;
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

  const c = currentCelebrity.value;
  if (!c) return;

  messages.value.push({ role: 'user', content: text });
  inputText.value = '';
  await scrollToBottom();

  // 构建包含生平和著作上下文的角色扮演提示词
  let context = `你正在扮演${c.name}。`;
  const intro = stripMd(c.introduction, 200);
  if (intro) context += `\n简介：${intro}`;
  const story = stripMd(c.life_story, 500);
  if (story) context += `\n生平：${story}`;
  const works = stripMd(c.works, 300);
  if (works) context += `\n著作：${works}`;
  context += `\n\n请以他的口吻、思想和风格来回答以下问题。保持回答简洁、有深度，符合他的理论体系：\n\n${text}`;

  loading.value = true;
  try {
    const res = await api.post('/ai/chat', { message: context });
    if (res.data.success) {
      messages.value.push({ role: 'assistant', content: res.data.reply });
    } else {
      messages.value.push({ role: 'assistant', content: '抱歉，我暂时无法回答这个问题。' });
    }
  } catch {
    messages.value.push({ role: 'assistant', content: '网络连接失败，请稍后重试。' });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

onMounted(() => {
  fetchCelebrities();
});

watch(celebrities, (val) => {
  if (val.length > 0 && !isHovering.value) {
    autoIndex.value = 0;
    startAutoPlay();
  }
});

onUnmounted(() => {
  stopAutoPlay();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

/* 照片渐变切换 */
.photo-fade-enter-active,
.photo-fade-leave-active {
  transition: opacity 0.25s ease;
}
.photo-fade-enter-from,
.photo-fade-leave-to {
  opacity: 0;
}

.chat-window ::-webkit-scrollbar {
  width: 6px;
}
.chat-window ::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
