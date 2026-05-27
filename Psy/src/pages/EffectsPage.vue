<template>
  <div class="w-full">
    <div class="mb-8 text-left">
      <h1 class="font-black uppercase tracking-tight text-4xl md:text-5xl text-primary mb-2">心理学效应</h1>
      <p class="text-base md:text-lg text-gray-600 font-mono">探索人类行为的奥秘</p>
    </div>

    <!-- 搜索框 -->
    <div class="mb-8 flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜索心理学效应..."
          class="w-full px-4 py-3 border-4 border-black bg-white text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
        <svg class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- 效应列表 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link
        v-for="(effect, index) in effects"
        :key="effect.id"
        :to="`/effects/${effect.id}`"
        class="p-6 bg-white border-2 border-primary rounded-lg hover:shadow-brutal transition-all card-brutal group cursor-pointer block"
      >
        <div class="flex items-center gap-4 mb-4">
          <div 
            class="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
            :class="getAccentClass(index)"
          >
            {{ effect.name.charAt(0) }}
          </div>
          <div>
            <h3 class="text-lg font-heading font-bold text-primary group-hover:text-accent-blue transition-colors">{{ effect.name }}</h3>
            <p class="text-sm text-text-muted">{{ effect.proposer }}</p>
          </div>
        </div>
        <p class="text-text-secondary text-sm line-clamp-3" v-html="renderMd(effect.description)"></p>
      </router-link>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && effects.length === 0" class="text-center py-20">
      <p class="text-lg text-text-muted">暂无相关心理学效应</p>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex justify-center mt-12 gap-2">
      <button 
        @click="changePage(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="px-4 py-2 border-4 border-black bg-white text-primary font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f0e8] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        上一页
      </button>
      <span class="px-4 py-2 font-black text-gray-600 flex items-center">{{ currentPage }} / {{ totalPages }}</span>
      <button 
        @click="changePage(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="px-4 py-2 border-4 border-black bg-white text-primary font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f0e8] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import api from '@/lib/axios';
import { renderMd } from '@/lib/md';

const effects = ref<any[]>([]);
const loading = ref(true);
const searchKeyword = ref('');
const currentPage = ref(1);
const totalPages = ref(1);

const accentClasses = [
  'bg-accent-red',
  'bg-accent-blue',
  'bg-accent-orange',
  'bg-accent-purple',
];

const getAccentClass = (index: number) => {
  return accentClasses[index % accentClasses.length];
};

const fetchEffects = async () => {
  loading.value = true;
  try {
    const res = await api.get('/effects', {
      params: {
        page: currentPage.value,
        limit: 12,
        keyword: searchKeyword.value
      }
    });
    if (res.data.success) {
      effects.value = res.data.effects;
      totalPages.value = res.data.pagination.totalPages;
    }
  } catch (error) {
    console.error('Fetch effects error', error);
  } finally {
    loading.value = false;
  }
};

// 防抖搜索
let searchTimeout: number | null = null;
watch(searchKeyword, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    currentPage.value = 1;
    fetchEffects();
  }, 500);
});

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchEffects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

onMounted(fetchEffects);
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
