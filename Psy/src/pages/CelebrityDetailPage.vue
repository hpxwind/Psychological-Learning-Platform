<template>
  <div class="celebrity-detail h-full relative bg-gray-950">
    <!-- 模糊背景 -->
    <div class="fixed inset-0 overflow-hidden">
      <img
        v-if="celebrity?.photo"
        :src="celebrity.photo"
        class="absolute inset-0 w-full h-full object-cover blur-sm opacity-40"
        :alt="celebrity.name"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950/90"></div>
    </div>

    <!-- 返回按钮 -->
    <button
      @click="$router.back()"
      class="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all duration-300 hover:scale-110"
      title="返回"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- 内容区 -->
    <div v-if="loading" class="relative z-10 flex items-center justify-center h-full">
      <p class="text-white/60 text-lg">加载中...</p>
    </div>

    <div v-else-if="!celebrity" class="relative z-10 flex items-center justify-center h-full">
      <p class="text-white/60 text-lg">未找到该名人</p>
    </div>

    <div v-else class="relative z-10 h-full overflow-y-auto">
      <div class="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <!-- 头像 + 名字 -->
        <div class="flex flex-col items-center mb-10">
          <div class="w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl mb-6">
            <img
              v-if="celebrity.photo"
              :src="celebrity.photo"
              class="w-full h-full object-cover"
              :alt="celebrity.name"
            />
            <div v-else class="w-full h-full bg-white/10 flex items-center justify-center text-4xl font-bold text-white/40">
              {{ celebrity.name.charAt(0) }}
            </div>
          </div>
          <h1 class="text-3xl md:text-4xl font-black text-white mb-2" style="font-family: 'Playfair Display', serif;">
            {{ celebrity.name }}
          </h1>
          <div class="w-10 h-[2px] bg-white/30 rounded-full"></div>
        </div>

        <!-- 简介 -->
        <div v-if="celebrity.introduction" class="mb-10">
          <div
            class="prose prose-invert prose-lg max-w-none text-white/80 leading-relaxed"
            v-html="renderedIntro"
          ></div>
        </div>

        <!-- 按钮组 -->
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            @click="$router.push(`/celebrity/${celebrity.id}/chat`)"
            class="px-8 py-3.5 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            开始对话
          </button>
          <button
            @click="$router.push(`/celebrity/${celebrity.id}/info`)"
            class="px-8 py-3.5 bg-white/10 text-white font-bold rounded-lg border border-white/30 hover:bg-white/20 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
          >
            查看详细信息
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/lib/axios';
import { renderMd } from '@/lib/md';

interface Celebrity {
  id: number;
  name: string;
  introduction: string;
  life_story: string;
  works: string;
  theory: string;
  influence: string;
  evaluation: string;
  published_books: string;
  published_books_detail?: { id: number; title: string; cover_image: string }[];
  gallery: string;
  photo: string;
  status_idle: string;
  status_listening: string;
  status_thinking: string;
  status_answered: string;
}

const route = useRoute();
const celebrity = ref<Celebrity | null>(null);
const loading = ref(true);

const renderedIntro = computed(() => renderMd(celebrity.value?.introduction || ''));

const fetchCelebrity = async () => {
  loading.value = true;
  try {
    const id = route.params.id;
    const res = await api.get(`/famous/${id}`);
    if (res.data.success) {
      celebrity.value = res.data.data;
    }
  } catch (error) {
    console.error('获取名人详情失败:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCelebrity();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
</style>
