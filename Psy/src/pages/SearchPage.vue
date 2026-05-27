<template>
  <div class="w-full">
    <div class="mb-8 text-left">
      <h1 class="font-black uppercase tracking-tight text-4xl md:text-5xl text-primary mb-2">搜索</h1>
      <p class="text-base md:text-lg text-gray-600 font-mono">查找心理学效应、图书和视频</p>
    </div>

    <!-- 搜索框 -->
    <div class="mb-8">
      <div class="relative">
        <input
          v-model="keyword"
          type="text"
          placeholder="输入关键词搜索..."
          class="w-full p-4 pl-12 border-4 border-black bg-white text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          @keyup.enter="handleSearch"
        >
        <el-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500"><Search /></el-icon>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
    </div>

    <div v-else>
      <!-- 搜索结果统计 -->
      <div v-if="keyword" class="mb-6 text-gray-600">
        找到 <span class="font-black text-primary">{{ totalResults }}</span> 个相关结果
      </div>

      <!-- 心理学效应结果 -->
      <div v-if="effects.length > 0" class="mb-10">
        <h3 class="text-xl font-black uppercase tracking-wide text-primary mb-4 flex items-center gap-2">
          <span class="w-8 h-8 bg-accent-purple text-white flex items-center justify-center text-sm font-black border-2 border-black">效</span>
          心理学效应
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <router-link
            v-for="effect in effects"
            :key="effect.id"
            :to="`/effects/${effect.id}`"
            class="col-card"
          >
            <div class="col-tag">心理学效应</div>
            <h4 class="col-title">{{ effect.name }}</h4>
            <p class="text-sm text-gray-500 mb-2 font-mono">提出者：{{ effect.proposer }}</p>
            <p class="text-sm text-gray-600 line-clamp-2">{{ effect.description }}</p>
          </router-link>
        </div>
      </div>

      <!-- 图书结果 -->
      <div v-if="books.length > 0" class="mb-10">
        <h3 class="text-xl font-black uppercase tracking-wide text-primary mb-4 flex items-center gap-2">
          <span class="w-8 h-8 bg-accent-blue text-white flex items-center justify-center text-sm font-black border-2 border-black">书</span>
          图书推荐
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <router-link
            v-for="book in books"
            :key="book.id"
            :to="`/books/${book.id}`"
            class="col-card flex gap-4"
          >
            <div class="w-16 h-20 bg-[#f5f0e8] border-2 border-black overflow-hidden flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              <img :src="book.cover_image || 'https://placehold.co/100x120?text=无'" alt="Cover" class="w-full h-full object-cover">
            </div>
            <div>
              <div class="col-tag text-accent-blue">图书</div>
              <h4 class="col-title">{{ book.title }}</h4>
              <p class="text-sm text-gray-500">{{ book.author }}</p>
              <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ book.summary || book.description }}</p>
            </div>
          </router-link>
        </div>
      </div>

      <!-- 视频结果 -->
      <div v-if="videos.length > 0" class="mb-10">
        <h3 class="text-xl font-black uppercase tracking-wide text-primary mb-4 flex items-center gap-2">
          <span class="w-8 h-8 bg-accent-orange text-white flex items-center justify-center text-sm font-black border-2 border-black">视</span>
          视频资料
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <router-link
            v-for="video in videos"
            :key="video.id"
            :to="`/videos/${video.id}`"
            class="col-card"
          >
            <div class="col-tag text-accent-orange">视频</div>
            <h4 class="col-title">{{ video.title }}</h4>
            <p class="text-sm text-gray-500">{{ video.author }} | {{ video.episode_count || 0 }}集</p>
            <p class="text-sm text-gray-600 mt-2 line-clamp-2">{{ video.description }}</p>
          </router-link>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="keyword && effects.length === 0 && books.length === 0 && videos.length === 0" class="text-center py-20">
        <p class="text-lg text-gray-500">未找到相关结果</p>
        <p class="text-sm text-gray-500 mt-2">请尝试其他关键词</p>
      </div>

      <!-- 初始状态 -->
      <div v-if="!keyword" class="text-center py-20">
        <el-icon :size="60" class="text-gray-400"><Search /></el-icon>
        <p class="mt-4 text-lg text-gray-500">输入关键词开始搜索</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import api from '@/lib/axios';

const keyword = ref('');
const loading = ref(false);
const effects = ref<any[]>([]);
const books = ref<any[]>([]);
const videos = ref<any[]>([]);
const totalResults = ref(0);

let searchTimeout: number | null = null;

const handleSearch = async () => {
  if (!keyword.value.trim()) {
    effects.value = [];
    books.value = [];
    videos.value = [];
    totalResults.value = 0;
    return;
  }

  loading.value = true;
  try {
    const [effectsRes, booksRes] = await Promise.all([
      api.get('/effects', { params: { keyword: keyword.value, limit: 6 } }),
      api.get('/books', { params: { keyword: keyword.value, limit: 6 } })
    ]);

    effects.value = effectsRes.data.success ? effectsRes.data.effects : [];
    books.value = booksRes.data.success ? booksRes.data.books : [];
    totalResults.value = effects.value.length + books.value.length;
  } catch (error) {
    console.error('Search error', error);
    effects.value = [];
    books.value = [];
  } finally {
    loading.value = false;
  }
};

watch(keyword, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(handleSearch, 500);
});
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>