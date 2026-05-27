<template>
  <div class="w-full">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20 bg-black">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
    </div>

    <!-- 加载失败时 -->
    <div v-else-if="!book" class="h-screen flex items-center justify-center bg-black">
      <div class="text-center">
        <p class="text-lg text-gray-400">书籍未找到</p>
        <button @click="$router.push('/books')" class="mt-4 text-white hover:underline">返回列表</button>
      </div>
    </div>

    <!-- 暗色背景：封面模糊 + 暗色遮罩 -->
    <div v-else class="relative h-screen overflow-hidden bg-black">
      <!-- 模糊封面背景 -->
      <img
        :src="book.cover_image || 'https://placehold.co/1920x1080/1a1a2e/555?text=No+Cover'"
        class="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40"
      />

      <!-- 暗色渐变遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/70"></div>

      <!-- 右上角返回按钮 -->
      <button
        @click="$router.back()"
        class="absolute top-4 right-4 z-20 px-4 py-2 font-bold text-sm text-white
               hover:opacity-70 transition-opacity"
      >
        ← 返回
      </button>

      <!-- 前景内容 -->
      <div class="relative z-10 flex h-full">
        <!-- 左侧：封面 + 书名竖排 -->
        <div class="flex-shrink-0 flex h-full">
          <!-- 封面 -->
          <div class="flex-shrink-0 h-full">
            <img
              :src="book.cover_image || 'https://placehold.co/400x600?text=No+Cover'"
              :alt="book.title"
              class="h-full w-auto object-cover shadow-2xl"
            />
          </div>
          <!-- 书名竖排（艺术字） -->
          <div class="flex-shrink-0 flex items-start justify-start px-3 md:px-5 border-r border-white/20 pt-0">
            <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text
                       leading-tight tracking-[0.2em] drop-shadow-[0_0_8px_rgba(205,173,0,0.4)]"
                style="writing-mode: vertical-rl; text-orientation: mixed;
                       font-family: 'STKaiti', 'KaiTi', '华文楷体', '楷体', serif;
                       background-image: linear-gradient(180deg, #555 0%, #999 25%, #fff 50%, #999 75%, #555 100%);
                       -webkit-background-clip: text;
                       filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, 0.5));">
              {{ book.title }}
            </h1>
          </div>
        </div>

        <!-- 右侧：信息 -->
        <div class="flex-1 px-6 md:px-10 py-8 md:py-12 space-y-6 max-w-2xl overflow-y-auto">
          <!-- 作者 -->
          <p class="text-xl md:text-2xl font-mono text-white/80">{{ book.author }}</p>

          <!-- 基本信息 -->
          <div class="space-y-3">
            <div class="flex items-baseline gap-3">
              <span class="text-xs font-black text-white/60 tracking-wide w-16 flex-shrink-0">出版社</span>
              <span class="text-base font-mono text-white/90">{{ book.publisher || '未知' }}</span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-xs font-black text-white/60 tracking-wide w-16 flex-shrink-0">出版日期</span>
              <span class="text-base font-mono text-white/90">{{ new Date(book.publish_date).toLocaleDateString() }}</span>
            </div>
            <div class="flex items-baseline gap-3">
              <span class="text-xs font-black text-white/60 tracking-wide w-16 flex-shrink-0">ISBN</span>
              <span class="text-base font-mono text-white/90">{{ book.isbn || '未知' }}</span>
            </div>
          </div>

          <!-- 内容简介 -->
          <div v-if="parsedSummary.intro" class="pt-4 border-t border-white/20">
            <p class="text-white/90 leading-relaxed text-sm md:text-base">{{ parsedSummary.intro }}</p>
            <div v-if="parsedSummary.highlights && parsedSummary.highlights.length" class="mt-4">
              <p class="text-xs font-black text-white/60 tracking-wide mb-2">精彩看点</p>
              <ul class="space-y-1.5">
                <li v-for="(highlight, idx) in parsedSummary.highlights" :key="idx" class="text-sm text-white/80 leading-relaxed pl-3 border-l-2 border-white/30">
                  {{ highlight }}
                </li>
              </ul>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex flex-wrap gap-3 pt-2">
            <a
              v-if="book.ebook_url"
              :href="book.ebook_url"
              target="_blank"
              class="inline-flex items-center px-5 py-2.5 font-black text-sm bg-white text-black border-2 border-white hover:bg-white/80 transition-colors"
            >
              在线阅读 / 购买
            </a>
            <button
              @click="$router.back()"
              class="px-5 py-2.5 font-black text-sm border-2 border-white/50 text-white hover:bg-white/10 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/lib/axios';

const route = useRoute();
const book = ref<any>(null);
const loading = ref(true);

const parsedSummary = computed(() => {
  if (book.value && book.value.summary) {
    if (typeof book.value.summary === 'string') {
      try {
        return JSON.parse(book.value.summary);
      } catch(e) {
        return { intro: book.value.summary };
      }
    }
    return book.value.summary;
  }
  return { intro: '' };
});

onMounted(async () => {
  try {
    const res = await api.get(`/books/${route.params.id}`);
    if (res.data.success) {
      book.value = res.data.book;
    }
  } catch (error) {
    console.error('Fetch book error', error);
  } finally {
    loading.value = false;
  }
});
</script>
