<template>
  <div class="w-full">
    <div class="mb-8 text-left">
      <h1 class="font-black uppercase tracking-tight text-4xl md:text-5xl text-primary mb-2">视频资料</h1>
      <p class="text-base md:text-lg text-gray-600 font-mono">精选心理学与哲学相关视频资源</p>
    </div>

    <!-- 分类筛选 -->
    <div class="mb-8 flex flex-wrap gap-3">
      <button 
        v-for="cat in categories" 
        :key="cat.category"
        :class="[
          'px-5 py-2 border-4 font-black uppercase tracking-wide transition-all',
          selectedCategory === cat.category 
            ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
            : 'bg-white text-primary border-black hover:bg-[#f5f0e8] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
        ]"
        @click="selectedCategory = cat.category"
      >
        {{ getCategoryName(cat.category) }}
        <span class="ml-1 opacity-70">({{ cat.count }})</span>
      </button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- 视频列表 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="(video, index) in videoList" 
        :key="video.id" 
        class="bg-white border-4 border-black overflow-hidden hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all card-brutal cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        @click="goToDetail(video.id)"
      >
        <!-- 封面图 -->
        <div class="h-48 bg-[#f5f0e8] relative group overflow-hidden border-b-4 border-black">
          <img 
            v-if="video.cover_image"
            :src="video.cover_image" 
            :alt="video.title"
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          >
          <div v-else class="w-full h-full flex items-center justify-center border-2 border-black" :class="getAccentClass(index)">
            <el-icon :size="48" class="text-white"><VideoCamera /></el-icon>
          </div>
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <span class="bg-black text-white font-black uppercase px-6 py-2 opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 border-2 border-white">
              查看详情
            </span>
          </div>
          <div class="absolute bottom-3 right-3 bg-black text-white px-3 py-1 text-sm font-black border-2 border-black" v-if="video.episode_count > 1">
            {{ video.episode_count }}集
          </div>
        </div>

        <!-- 视频信息 -->
        <div class="p-5">
          <h3 class="text-lg font-black uppercase tracking-wide mb-2 text-primary">{{ video.title }}</h3>
          <div class="flex items-center gap-3 mb-3">
            <span class="text-sm text-gray-600 flex items-center gap-1 font-mono">
              <el-icon><User /></el-icon>
              {{ video.author || '未知作者' }}
            </span>
            <span class="text-xs px-2 py-0.5 bg-accent-blue text-white font-black" v-if="video.source === 'bilibili'">
              B站
            </span>
          </div>
          <p class="text-sm text-gray-600 line-clamp-2">{{ video.description }}</p>
          
          <!-- 预览集数 -->
          <div class="mt-4 pt-3 border-t-2 border-black" v-if="video.preview_episodes?.length">
            <div class="text-xs text-gray-500 mb-2 font-mono">最近更新</div>
            <div v-for="ep in video.preview_episodes.slice(0, 2)" :key="ep.id" class="flex items-center gap-2 text-sm py-1">
              <span class="font-black" :class="getAccentTextClass(index)">第{{ ep.episode_number }}集</span>
              <span class="text-gray-600 truncate">{{ ep.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && videoList.length === 0" class="text-center py-20">
      <el-icon :size="60" class="text-text-muted"><VideoCamera /></el-icon>
      <p class="mt-4 text-lg text-text-muted">暂无视频资源</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { VideoCamera, User } from '@element-plus/icons-vue';
import axios from 'axios';

interface VideoSeries {
  id: number;
  title: string;
  cover_image: string;
  author: string;
  source: string;
  description: string;
  episode_count: number;
  preview_episodes: Array<{
    id: number;
    episode_number: number;
    title: string;
  }>;
}

interface Category {
  category: string;
  count: number;
}

const router = useRouter();
const loading = ref(false);
const videoList = ref<VideoSeries[]>([]);
const categories = ref<Category[]>([
  { category: 'all', count: 0 },
  { category: 'psychology', count: 0 },
  { category: 'philosophy', count: 0 }
]);
const selectedCategory = ref('all');

const accentClasses = [
  'bg-accent-red',
  'bg-accent-blue',
  'bg-accent-orange',
  'bg-accent-purple',
];

const getAccentClass = (index: number) => accentClasses[index % accentClasses.length];
const getAccentTextClass = (index: number) => {
  const classes = ['text-accent-red', 'text-accent-blue', 'text-accent-orange', 'text-accent-purple'];
  return classes[index % classes.length];
};

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'all': '全部',
    'psychology': '心理学',
    'philosophy': '哲学'
  };
  return names[category] || category;
};

const fetchVideos = async () => {
  loading.value = true;
  try {
    const params = selectedCategory.value !== 'all' ? { category: selectedCategory.value } : {};
    const res = await axios.get('/api/videos/series', { params });
    
    if (res.data.success) {
      videoList.value = res.data.data;
    }
  } catch (error) {
    console.error('获取视频列表失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取分类统计
const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/videos/categories');
    if (res.data.success) {
      const categoryData = res.data.data;
      const totalCount = categoryData.reduce((sum: number, cat: any) => sum + cat.count, 0);
      categories.value = [
        { category: 'all', count: totalCount },
        ...categoryData
      ];
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

const goToDetail = (id: number) => {
  router.push(`/videos/${id}`);
};

watch(selectedCategory, fetchVideos);

onMounted(() => {
  document.title = '视频学习 - 每日心理学'
  fetchCategories();
  fetchVideos();
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
