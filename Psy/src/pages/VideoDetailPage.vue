<template>
  <div class="w-full">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20 bg-black">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
    </div>

    <!-- 未找到 -->
    <div v-else-if="!videoSeries" class="h-screen flex items-center justify-center bg-black">
      <div class="text-center">
        <p class="text-lg text-white/60">视频未找到</p>
        <button @click="$router.back()" class="mt-4 text-white hover:underline">返回</button>
      </div>
    </div>

    <!-- 暗色背景：封面模糊 + 遮罩 -->
    <div v-else class="relative h-screen overflow-hidden bg-black">
      <!-- 模糊封面背景 -->
      <img
        v-if="videoSeries.cover_image"
        :src="videoSeries.cover_image"
        class="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-30"
      />
      <div v-else class="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800"></div>

      <!-- 暗色渐变遮罩 -->
      <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/80"></div>

      <!-- 前景内容 -->
      <div class="relative z-10 flex h-full">
        <!-- 左侧 40%：系列介绍 -->
        <div class="w-[40%] flex-shrink-0 px-8 md:px-10 py-8 md:py-12 overflow-y-auto border-r border-white/15 relative">
          <!-- 返回按钮（左侧区域内右上角） -->
          <button
            @click="$router.back()"
            class="absolute top-4 right-4 font-bold text-sm text-white hover:opacity-70 transition-opacity"
          >
            ← 返回
          </button>

          <!-- 标题 -->
          <h1 class="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight mb-4 drop-shadow-lg pr-16">
            {{ videoSeries.title }}
          </h1>

          <!-- 作者 & 基本信息 -->
          <div class="flex flex-wrap items-center gap-3 mb-6">
            <span class="text-white/80 font-mono text-sm">👤 {{ videoSeries.author || '未知作者' }}</span>
            <span class="px-2 py-0.5 bg-white/15 text-white/90 text-xs font-black rounded">
              {{ getCategoryName(videoSeries.category) }}
            </span>
            <span class="text-white/60 font-mono text-sm">共{{ videoSeries.episodes?.length || 0 }}集</span>
          </div>

          <!-- 简介 -->
          <div v-if="videoSeries.description" class="mb-6">
            <h2 class="text-xs font-black text-white/50 tracking-wide uppercase mb-2">简介</h2>
            <p class="text-white/75 text-sm leading-relaxed">{{ videoSeries.description }}</p>
          </div>

          <!-- AI介绍 -->
          <div v-if="formatIntro(videoSeries.intro)" class="mb-6">
            <h2 class="text-xs font-black text-white/50 tracking-wide uppercase mb-2">AI 助手介绍</h2>
            <p class="text-white/70 text-sm leading-relaxed">{{ formatIntro(videoSeries.intro) }}</p>
          </div>

          <!-- 观看按钮 -->
          <a
            v-if="videoSeries.source_url"
            :href="videoSeries.source_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center px-5 py-2.5 font-black text-sm bg-white text-black hover:bg-white/80 transition-colors"
          >
            在B站观看
          </a>
        </div>

        <!-- 右侧 60%：剧集列表 -->
        <div class="flex-1 px-6 md:px-8 py-8 md:py-12 overflow-y-auto">
          <h2 class="text-lg font-black text-white/80 tracking-wide mb-6">
            全部剧集
          </h2>

          <div v-if="videoSeries.episodes?.length" class="space-y-4">
            <div
              v-for="(episode, index) in videoSeries.episodes"
              :key="episode.id"
              class="flex items-center gap-5 p-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 transition-all group"
            >
              <!-- 大的艺术字阿拉伯数字 -->
              <div class="flex-shrink-0 w-16 flex items-center justify-center">
                <span
                  class="text-6xl font-black select-none artistic-num inline-flex items-center"
                >
                  {{ episode.episode_number }}
                </span>
              </div>

              <!-- 集数 和 BV -->
              <div class="flex-grow min-w-0">
                <h3 class="font-bold text-white/90 text-base group-hover:text-white transition-colors">
                  第{{ episode.episode_number }}集
                </h3>
                <span v-if="episode.bv_number" class="text-xs text-white/40 font-mono tracking-wider">
                  BV: {{ episode.bv_number }}
                </span>
              </div>

              <!-- 播放按钮 -->
              <button
                @click="playVideo(episode)"
                class="flex-shrink-0 w-12 h-12 flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-90"
                title="播放"
              >
                <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
          <div v-else class="text-white/40 text-sm">暂无剧集</div>
        </div>
      </div>
    </div>

    <!-- 全屏播放 -->
    <div v-if="showPlayer" class="fixed inset-0 z-[999] bg-black">
      <!-- 右上角返回按钮 -->
      <button
        @click="showPlayer = false"
        class="absolute top-4 right-4 z-[1000] w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-bold text-lg transition-all rounded-full"
        title="返回"
      >
        ✕
      </button>

      <!-- 视频区域 -->
      <div class="w-full h-full flex items-center justify-center p-8 md:p-12">
        <div class="w-full max-w-[1400px] aspect-video">
          <iframe
            v-if="currentEpisode?.bv_number"
            :src="`https://player.bilibili.com/player.html?bvid=${currentEpisode.bv_number}&autoplay=1&high_quality=1`"
            style="width: 100%; height: 100%; border: none;"
            allowfullscreen
          ></iframe>
          <div v-else-if="currentEpisode?.video_url" class="flex items-center justify-center h-full bg-gray-900 rounded">
            <a :href="currentEpisode.video_url" target="_blank" rel="noopener noreferrer" class="px-6 py-3 bg-white text-black font-bold hover:bg-white/80 transition-colors">
              在新窗口打开
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '@/lib/axios';

interface Episode {
  id: number;
  episode_number: number;
  title: string;
  bv_number: string;
  video_url: string;
  duration: string;
  description: string;
  intro: string;
}

const route = useRoute();
const loading = ref(true);
const videoSeries = ref<any>(null);
const showPlayer = ref(false);
const currentEpisode = ref<Episode | null>(null);

const accentBgs = [
  'bg-red-600/80',
  'bg-blue-600/80',
  'bg-orange-600/80',
  'bg-purple-600/80',
];

const getAccentBg = (index: number) => accentBgs[index % accentBgs.length];

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    'psychology': '心理学',
    'philosophy': '哲学'
  };
  return names[category] || category;
};

const formatIntro = (intro: any) => {
  if (!intro) return '';
  if (typeof intro === 'string') {
    try {
      const parsed = JSON.parse(intro);
      return parsed.content || parsed.intro || intro;
    } catch {
      return intro;
    }
  }
  return intro.content || intro.intro || '';
};

const fetchVideoDetail = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/videos/series/${route.params.id}`);
    if (res.data.success) {
      videoSeries.value = res.data.data;
    }
  } catch (error) {
    console.error('获取视频详情失败:', error);
    ElMessage.error('加载视频详情失败');
  } finally {
    loading.value = false;
  }
};

const playVideo = (episode: Episode) => {
  currentEpisode.value = episode;
  showPlayer.value = true;
};

onMounted(fetchVideoDetail);
</script>

<style scoped>
.artistic-num {
  font-family: 'Georgia', 'Times New Roman', serif;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.25);
  color: transparent;
  transition: -webkit-text-stroke 0.2s;
  line-height: 1;
}

.group:hover .artistic-num {
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.45);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
