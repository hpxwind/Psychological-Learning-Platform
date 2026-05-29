<template>
  <div class="celebrity-info h-full relative bg-gray-950">
    <!-- 模糊背景 -->
    <div class="fixed inset-0 overflow-hidden">
      <img
        v-if="celebrity?.photo"
        :src="celebrity.photo"
        class="absolute inset-0 w-full h-full object-cover blur-sm opacity-30"
        :alt="celebrity.name"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-gray-950/80 via-gray-950/60 to-gray-950/90"></div>
    </div>

    <!-- 返回按钮（右上角） -->
    <button
      @click="$router.back()"
      class="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-all duration-300 hover:scale-110"
      title="返回"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- 加载 / 错误状态 -->
    <div v-if="loading" class="relative z-10 flex items-center justify-center h-full">
      <p class="text-white/60 text-lg">加载中...</p>
    </div>
    <div v-else-if="!celebrity" class="relative z-10 flex items-center justify-center h-full">
      <p class="text-white/60 text-lg">未找到该名人</p>
    </div>

    <!-- 主内容区：左侧正文 -->
    <div v-else class="relative z-10 h-full overflow-y-auto" ref="scrollContainer">
      <div class="flex max-w-7xl mx-auto px-6 lg:px-10 py-12 md:py-16 gap-10">

        <!-- 左侧正文 -->
        <div class="flex-1 min-w-0 lg:max-w-3xl">
          <!-- 头像 + 名字 -->
          <div class="flex flex-col items-center mb-10">
            <div class="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-3 border-white/20 shadow-2xl mb-5">
              <img
                v-if="celebrity.photo"
                :src="celebrity.photo"
                class="w-full h-full object-cover"
                :alt="celebrity.name"
              />
              <div v-else class="w-full h-full bg-white/10 flex items-center justify-center text-3xl font-bold text-white/40">
                {{ celebrity.name.charAt(0) }}
              </div>
            </div>
            <h1 class="text-2xl md:text-3xl font-black text-white mb-1" style="font-family: 'Playfair Display', serif;">
              {{ celebrity.name }}
            </h1>
            <span class="text-white/40 text-sm">详细信息</span>
          </div>

          <!-- 简介 -->
          <section id="section-intro" class="mb-10" data-toc="简介">
            <h3 class="text-lg font-bold text-white/60 mb-3 border-l-2 border-white/30 pl-3" style="font-family: 'Playfair Display', serif;">简介</h3>
            <div v-if="celebrity.introduction" class="prose prose-invert max-w-none text-white/80 leading-relaxed" v-html="renderMd(celebrity.introduction)"></div>
            <p v-else class="text-white/30 text-sm italic">暂无内容</p>
          </section>

          <!-- 生平经历 -->
          <section id="section-life" class="mb-10" data-toc="生平经历">
            <h3 class="text-lg font-bold text-white/60 mb-3 border-l-2 border-white/30 pl-3" style="font-family: 'Playfair Display', serif;">生平经历</h3>
            <div v-if="celebrity.life_story" class="prose prose-invert max-w-none text-white/80 leading-relaxed" v-html="renderMd(celebrity.life_story)"></div>
            <p v-else class="text-white/30 text-sm italic">暂无内容</p>
          </section>

          <!-- 代表著作 -->
          <section id="section-works" class="mb-10" data-toc="代表著作">
            <h3 class="text-lg font-bold text-white/60 mb-3 border-l-2 border-white/30 pl-3" style="font-family: 'Playfair Display', serif;">代表著作</h3>
            <div v-if="celebrity.works" class="prose prose-invert max-w-none text-white/80 leading-relaxed" v-html="renderMd(celebrity.works)"></div>
            <p v-else class="text-white/30 text-sm italic">暂无内容</p>
          </section>

          <!-- 理论思想 -->
          <section id="section-theory" class="mb-10" data-toc="理论思想">
            <h3 class="text-lg font-bold text-white/60 mb-3 border-l-2 border-white/30 pl-3" style="font-family: 'Playfair Display', serif;">理论思想</h3>
            <div v-if="celebrity.theory" class="prose prose-invert max-w-none text-white/80 leading-relaxed" v-html="renderMd(celebrity.theory)"></div>
            <p v-else class="text-white/30 text-sm italic">暂无内容</p>
          </section>

          <!-- 人物影响 -->
          <section id="section-influence" class="mb-10" data-toc="人物影响">
            <h3 class="text-lg font-bold text-white/60 mb-3 border-l-2 border-white/30 pl-3" style="font-family: 'Playfair Display', serif;">人物影响</h3>
            <div v-if="celebrity.influence" class="prose prose-invert max-w-none text-white/80 leading-relaxed" v-html="renderMd(celebrity.influence)"></div>
            <p v-else class="text-white/30 text-sm italic">暂无内容</p>
          </section>

          <!-- 人物评价 -->
          <section id="section-evaluation" class="mb-10" data-toc="人物评价">
            <h3 class="text-lg font-bold text-white/60 mb-3 border-l-2 border-white/30 pl-3" style="font-family: 'Playfair Display', serif;">人物评价</h3>
            <div v-if="celebrity.evaluation" class="prose prose-invert max-w-none text-white/80 leading-relaxed" v-html="renderMd(celebrity.evaluation)"></div>
            <p v-else class="text-white/30 text-sm italic">暂无内容</p>
          </section>

          <!-- 出版图书 -->
          <section id="section-books" class="mb-10" data-toc="出版图书">
            <h3 class="text-lg font-bold text-white/60 mb-3 border-l-2 border-white/30 pl-3" style="font-family: 'Playfair Display', serif;">出版图书</h3>
            <div v-if="celebrity.published_books_detail && celebrity.published_books_detail.length > 0" class="flex flex-wrap gap-3">
              <router-link
                v-for="book in celebrity.published_books_detail"
                :key="book.id"
                :to="`/books/${book.id}`"
                class="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/20 hover:border-white/40 transition-all duration-300 backdrop-blur-sm group"
              >
                <img
                  v-if="book.cover_image"
                  :src="book.cover_image"
                  class="w-10 h-14 object-cover rounded shadow-md group-hover:scale-105 transition-transform"
                  :alt="book.title"
                />
                <div v-else class="w-10 h-14 rounded bg-white/10 flex items-center justify-center text-white/40 text-xs">暂无</div>
                <span class="text-white/80 text-sm font-medium group-hover:text-white transition-colors">{{ book.title }}</span>
                <svg class="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </router-link>
            </div>
            <p v-else class="text-white/30 text-sm italic">暂无内容</p>
          </section>

          <!-- 图片集 -->
          <section id="section-gallery" class="mb-10" data-toc="图片集">
            <h3 class="text-lg font-bold text-white/60 mb-3 border-l-2 border-white/30 pl-3" style="font-family: 'Playfair Display', serif;">图片集</h3>
            <div v-if="galleryUrls.length > 0" class="grid gap-3" :class="galleryUrls.length <= 2 ? 'grid-cols-2' : galleryUrls.length === 3 ? 'grid-cols-3' : 'grid-cols-4'">
              <div v-for="(url, i) in galleryUrls" :key="i" class="aspect-square rounded-lg overflow-hidden border border-white/10">
                <img :src="url" class="w-full h-full object-cover" :alt="`${celebrity.name} - 图${i + 1}`" />
              </div>
            </div>
            <p v-else class="text-white/30 text-sm italic">暂无内容</p>
          </section>

          <!-- 底部留白 -->
          <div class="h-32"></div>
        </div>


      </div>
    </div>

    <!-- 右侧固定目录（随视窗滑动） -->
    <aside v-if="!loading && celebrity" class="hidden lg:block fixed right-6 top-1/2 -translate-y-1/2 z-20 w-44">
      <nav class="bg-gray-950/80 backdrop-blur-md rounded-xl p-4 border border-white/10 shadow-xl">
        <h4 class="text-xs font-semibold text-white/30 uppercase tracking-wider mb-4 pl-3">目录</h4>
        <ul class="space-y-1">
          <li v-for="item in tocItems" :key="item.id">
            <a
              :href="`#${item.id}`"
              @click.prevent="scrollToSection(item.id)"
              class="block py-2 px-3 rounded-lg text-sm transition-all duration-200"
              :class="activeSection === item.id
                ? 'text-white bg-white/10 font-medium'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watchEffect } from 'vue';
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
}

interface TocItem {
  id: string;
  label: string;
}

const route = useRoute();
const celebrity = ref<Celebrity | null>(null);
const loading = ref(true);
const scrollContainer = ref<HTMLElement | null>(null);
const activeSection = ref('');
const tocItems = ref<TocItem[]>([]);

const galleryUrls = computed(() => {
  if (!celebrity.value?.gallery) return [];
  try {
    const arr = JSON.parse(celebrity.value.gallery);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
});

// 从 DOM 中收集所有带有 data-toc 属性的 section 生成目录
const collectTocItems = () => {
  const sections = document.querySelectorAll('section[data-toc]');
  const items: TocItem[] = [];
  sections.forEach((el) => {
    items.push({
      id: el.id,
      label: el.getAttribute('data-toc') || ''
    });
  });
  tocItems.value = items;
};

// IntersectionObserver 监听滚动位置，高亮当前 section
let observer: IntersectionObserver | null = null;

const setupObserver = () => {
  if (observer) observer.disconnect();
  const sections = document.querySelectorAll('section[data-toc]');
  if (sections.length === 0) return;
  observer = new IntersectionObserver(
    (entries) => {
      // 找出所有当前可见的 section，取第一个
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) {
        activeSection.value = visible[0].target.id;
      }
    },
    { rootMargin: '-10% 0px -60% 0px', threshold: 0 }
  );
  sections.forEach((s) => observer!.observe(s));
};

// 🔑 关键：等 loading=false 且 celebrity 有值后，DOM 才真正渲染，此时收集 TOC
watchEffect(async (onCleanup) => {
  if (!loading.value && celebrity.value) {
    // 等 Vue 把 v-else 分支挂到 DOM
    await nextTick();
    await nextTick(); // 双保险，确保所有子组件就绪
    collectTocItems();
    setupObserver();
  }
  onCleanup(() => {
    if (observer) observer.disconnect();
  });
});

// 点击目录项滚动到对应位置
const scrollToSection = (id: string) => {
  activeSection.value = id;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const fetchCelebrity = async () => {
  loading.value = true;
  celebrity.value = null;
  tocItems.value = [];
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

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');

/* 滚动容器平滑滚动 */
:deep(.celebrity-info > div.overflow-y-auto) {
  scroll-behavior: smooth;
}
</style>
