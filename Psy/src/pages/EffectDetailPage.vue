<template>
  <div class="w-full">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <div v-else-if="effect">
      <!-- 效应详情 - 全宽展示 -->
      <div class="full-width-card relative border-y-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-8">
        <!-- 卡片模糊背景 -->
        <div v-if="images.length > 0" class="absolute inset-0 z-0 overflow-hidden">
          <img
            :src="images[0]"
            class="absolute inset-0 w-full h-full object-cover blur-xl scale-110"
            alt=""
          />
          <div class="absolute inset-0 bg-white/75"></div>
        </div>

        <!-- 内容区 -->

        <!-- 头部 -->
        <div class="py-3 border-b-4 border-black bg-[#f5f0e8] relative z-10">
          <div class="max-w-[1200px] mx-auto px-6 md:px-10">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-16 h-16 bg-accent-purple text-white flex items-center justify-center text-3xl font-black border-4 border-black flex-shrink-0">
                  {{ effect.name.charAt(0) }}
                </div>
                <div>
                  <h1 class="text-3xl md:text-4xl font-black uppercase tracking-wide text-primary">{{ effect.name }}</h1>
                  <p class="text-gray-600 mt-1 font-mono">提出者：{{ effect.proposer }}</p>
                </div>
              </div>
              <button @click="router.back()" class="flex items-center gap-2 text-gray-500 hover:text-primary transition font-bold uppercase tracking-wide border-4 border-transparent hover:border-black px-4 py-2 cursor-pointer flex-shrink-0">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span class="hidden md:inline">返回</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 内容区 -->
        <div class="max-w-[1200px] mx-auto px-6 md:px-10 py-4 relative z-10">
          <!-- 简介正文（无分割线） -->
          <div class="md-content" v-html="renderMd(effect.description)"></div>

          <!-- 实验：分隔条在外，标题在外，正文在框内 -->
          <div v-if="experimentContent">
            <div class="section-bar"></div>
            <h1 v-if="experimentTitle" class="text-2xl md:text-3xl font-black text-primary mb-2 mt-[28px]">{{ experimentTitle }}</h1>
            <div class="p-4 bg-[#f5f0e8] border-4 border-black">
              <div class="md-content" v-html="renderMd(experimentBody)"></div>
            </div>
          </div>

          <!-- 深度解析分隔条 -->
          <div v-if="effect.explanation">
            <div class="section-bar"></div>
            <div class="md-content" v-html="renderMd(effect.explanation)"></div>
          </div>

        </div>
      </div>

      <!-- 相关效应 - 底部水平排列 -->
      <div v-if="relatedEffects.length > 0" class="mb-8">
        <h3 class="text-2xl font-black uppercase tracking-wide text-primary mb-3 flex items-center gap-2">
          <span class="w-8 h-8 bg-accent-green text-white flex items-center justify-center text-sm font-black border-2 border-black">关</span>
          相关效应
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <router-link
            v-for="related in relatedEffects"
            :key="related.id"
            :to="`/effects/${related.id}`"
            class="related-card cursor-pointer"
          >
            <h4 class="related-name">{{ related.name }}</h4>
            <p class="related-proposer">{{ related.proposer }}</p>
            <p class="related-desc">{{ related.description }}</p>
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20">
      <p class="text-lg text-text-muted">效应未找到</p>
      <button @click="$router.push('/effects')" class="mt-4 text-accent-blue font-semibold hover:underline">返回列表</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { renderMd } from '@/lib/md';
import api from '@/lib/axios';

const route = useRoute();
const router = useRouter();

const effect = ref<any>(null);
const loading = ref(true);
const relatedEffects = ref<any[]>([]);
const images = ref<string[]>([]);
const experimentContent = ref('');

// 从实验内容中提取第一行标题，其余为正文
const experimentTitle = computed(() => {
  const raw = experimentContent.value.trim();
  const match = raw.match(/^#\s+(.+)/);
  return match ? match[1] : '';
});

const experimentBody = computed(() => {
  const raw = experimentContent.value.trim();
  return raw.replace(/^#\s+.+\n*/, '').trim();
});



const fetchEffect = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/effects/${route.params.id}`);
    if (res.data.success) {
      effect.value = res.data.effect;

      // 解析 experiment_detail JSON → title + content
      if (effect.value?.experiment_detail) {
        try {
          const exp = typeof effect.value.experiment_detail === 'string'
            ? JSON.parse(effect.value.experiment_detail)
            : effect.value.experiment_detail;
          experimentContent.value = exp?.content || '';
        } catch {
          experimentContent.value = '';
        }
      }

      // 解析图片
      if (effect.value?.media && effect.value.media.length > 0) {
        images.value = effect.value.media
          .filter((m: any) => m.media_type === 'image')
          .map((m: any) => m.file_url);
      }
    }
  } catch (error) {
    console.error('Fetch effect error', error);
  } finally {
    loading.value = false;
  }
};

const fetchRelated = async () => {
  try {
    const res = await api.get('/effects', { params: { limit: 6 } });
    if (res.data.success) {
      relatedEffects.value = res.data.effects
        .filter((e: any) => e.id !== Number(route.params.id))
        .slice(0, 3);
    }
  } catch (error) {
    console.error('Fetch related effects error', error);
  }
};

onMounted(() => {
  fetchEffect();
  fetchRelated();
});
</script>

<style scoped>
/* 全宽卡片 - 突破父容器 padding */
.full-width-card {
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

/* Markdown 内容样式 */
.md-content :deep(h1) { font-size: 1.75rem; font-weight: 900; margin: 1em 0 0.5em; color: #2d2d2d; }
.md-content :deep(h2) { font-size: 1.5rem; font-weight: 800; margin: 1em 0 0.5em; color: #2d2d2d; }
.md-content :deep(h3) { font-size: 1.25rem; font-weight: 700; margin: 1em 0 0.5em; color: #2d2d2d; }
.md-content :deep(p) { margin: 0.75em 0; line-height: 1.8; font-size: 1.05rem; color: #4a4a4a; white-space: pre-wrap; }
.md-content :deep(ul),
.md-content :deep(ol) { padding-left: 1.5em; margin: 0.75em 0; }
.md-content :deep(li) { margin: 0.35em 0; line-height: 1.7; color: #4a4a4a; }
.md-content :deep(blockquote) {
  border-left: 4px solid #333;
  margin: 1em 0;
  padding: 0.5em 1em;
  background: #f5f5f5;
  font-style: italic;
  color: #666;
}
.md-content :deep(code) {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}
.md-content :deep(pre) {
  background: #2d2d2d;
  color: #e0e0e0;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}
.md-content :deep(pre code) { background: none; padding: 0; color: inherit; }
.md-content :deep(a) { color: #2563eb; text-decoration: underline; }
/* 默认图片：可内联，文字环绕 */
.md-content :deep(img) {
  max-width: 100%;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin: 0.5em 1em 0.5em 0;
  vertical-align: middle;
}
/* 左浮动：文字在右侧绕排 */
.md-content :deep(.img-left),
.md-content :deep(img[align="left"]) {
  float: left;
  max-width: 45%;
  margin: 0.25em 1em 0.5em 0;
}
/* 右浮动：文字在左侧绕排 */
.md-content :deep(.img-right),
.md-content :deep(img[align="right"]) {
  float: right;
  max-width: 45%;
  margin: 0.25em 0 0.5em 1em;
}
/* 居中大图 */
.md-content :deep(.img-center),
.md-content :deep(img[align="center"]) {
  display: block;
  max-width: 100%;
  margin: 0.75em auto;
}
/* 小图内联，不浮动 */
.md-content :deep(.img-inline) {
  display: inline-block;
  max-width: 100px;
  margin: 0 4px;
  vertical-align: middle;
}
/* 清除浮动 */
.md-content :deep(br[clear]) {
  clear: both;
}
.md-content :deep(table) { border-collapse: collapse; width: 100%; margin: 1em 0; }
.md-content :deep(th),
.md-content :deep(td) { border: 2px solid #333; padding: 8px 12px; text-align: left; }
.md-content :deep(th) { background: #f5f0e8; font-weight: 700; }
.md-content :deep(hr) { border: none; border-top: 2px solid #ddd; margin: 1.5em 0; }
.md-content :deep(strong) { font-weight: 700; color: #2d2d2d; }

/* 相关效应卡片 */
.related-card {
  background: #fff;
  border: 3px solid #2d2d2d;
  padding: 20px 24px;
  transition: all 0.3s ease;
  display: block;
  text-decoration: none;
}

.related-card:hover {
  box-shadow: 5px 5px 0 rgba(0,0,0,0.2);
  transform: translate(-3px, -3px);
  border-color: #000;
}

.related-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #2d2d2d;
  margin: 0 0 6px 0;
}

.related-proposer {
  font-size: 0.85rem;
  color: #999;
  margin: 0 0 10px 0;
}

.related-desc {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bg-accent-green {
  background-color: #27ae60;
}

/* 全宽细分隔条 */
.section-bar {
  height: 2px;
  background: #333;
  border-radius: 1px;
  margin: 10px 0 8px;
}
</style>
