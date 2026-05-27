<template>
  <div class="w-full">
    <!-- Hero Section -->
    <div class="mb-6 text-left">
      <h1 class="hero-title mb-6">
        <span class="char" style="--rotate: -15deg; color: #e74c3c; font-size: 1.3em; vertical-align: 0.2em;">每</span>
        <span class="char" style="--rotate: 12deg; color: #3498db; font-size: 0.9em; vertical-align: -0.3em;">日</span>
        <span class="char" style="--rotate: -8deg; color: #2ecc71; font-size: 1.1em; vertical-align: 0.1em;">心</span>
        <span class="char" style="--rotate: 18deg; color: #9b59b6; font-size: 0.85em; vertical-align: -0.2em;">理</span>
        <span class="char" style="--rotate: -12deg; color: #f39c12; font-size: 1.2em; vertical-align: 0.25em;">学</span>
      </h1>
      <p class="typewriter text-lg md:text-xl text-gray-600 max-w-2xl font-mono">
        {{ typewriterText }}<span class="cursor">|</span>
      </p>
    </div>

    <!-- AI 助手横幅 -->
    <div class="mb-6 h-[730px] w-full bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] overflow-hidden mt-8">
      <AIBanner />
    </div>

    <!-- 分割线 -->
    <div class="section-divider"></div>

    <!-- 今日推荐 -->
    <div v-if="dailyEffect" class="section-wrapper section-red mt-[50px]">
      <div class="section-header">
        <h3 class="section-title">今日推荐</h3>
        <div class="daily-date text-base text-gray-300">{{ new Date().toLocaleDateString('zh-CN') }}</div>
      </div>
      <router-link
        :to="`/effects/${dailyEffect.id}`"
        class="daily-card flex gap-8 items-center p-8"
        style="transform: rotate(-0.5deg);"
      >
        <div class="flex-shrink-0">
          <div class="daily-char w-32 h-32 bg-accent-orange text-white flex items-center justify-center text-5xl font-black border-4 border-black">
            {{ dailyEffect.name.charAt(0) }}
          </div>
        </div>
        <div class="flex-1">
          <div class="col-tag text-accent-orange text-sm">推荐阅读</div>
          <h2 class="daily-title text-3xl md:text-4xl font-bold text-primary mb-3" style="font-family: Georgia, serif;">{{ dailyEffect.name }}</h2>
          <p class="daily-proposer text-gray-500 mb-3 font-mono">提出者：{{ dailyEffect.proposer }}</p>
          <p class="daily-desc text-lg text-gray-600 leading-relaxed" v-html="renderMd(dailyEffect.description)"></p>
        </div>
        <div class="flex-shrink-0 self-center">
          <span class="inline-flex items-center gap-2 px-6 py-4 bg-black text-white text-lg font-black uppercase border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
            深入了解 →
          </span>
        </div>
      </router-link>
    </div>

    <!-- 展开按钮 -->
    <div v-if="!showMore" class="text-center my-10">
      <button @click="showMore = true" class="px-8 py-4 bg-white text-xl font-black border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.15)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
        探索更多 ↓
      </button>
    </div>

    <!-- 更多内容 -->
    <div v-if="showMore">
    <!-- 搜索框 -->
    <div class="mt-[150px] mb-10">
      <div class="relative">
        <input
          v-model="exploreKeyword"
          type="text"
          placeholder="搜索心理学效应..."
          class="w-full p-4 pl-12 border-4 border-black bg-white text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        />
        <el-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500"><Search /></el-icon>
      </div>
    </div>

    <!-- 分割线 -->
    <div class="section-divider"></div>

    <div v-if="loading" class="flex justify-center py-16">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
    </div>

    <div v-else>
      <!-- 效应列表 -->
      <div class="section-wrapper mb-[120px]">
        <div class="section-header">
          <h3 class="section-title">心理学效应</h3>
          <router-link to="/effects" class="section-link">查看全部 →</router-link>
        </div>

        <div v-if="exploreLoading" class="flex justify-center py-10">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <router-link
            v-for="effect in exploreEffects.slice(0, 6)"
            :key="effect.id"
            :to="`/effects/${effect.id}`"
            class="effect-card cursor-pointer block"
          >
            <div class="flex items-center gap-4">
              <div class="effect-icon text-3xl md:text-4xl font-black">
                {{ effect.name.charAt(0) }}
              </div>
              <div class="flex-1">
                <h4 class="effect-title">{{ effect.name }}</h4>
                <p class="effect-proposer">提出者：{{ effect.proposer }}</p>
              </div>
            </div>
            <p class="effect-desc" v-html="renderMd(effect.description)"></p>
          </router-link>
        </div>

        <div v-if="!exploreLoading && exploreEffects.length === 0" class="py-10 text-center text-gray-500">
          未找到相关效应
        </div>
      </div>

      <!-- 分割线 -->
      <div class="section-divider"></div>

      <!-- 图书推荐轮播 -->
      <div class="section-wrapper mb-[120px]">
        <div class="section-header">
        <h3 class="section-title">图书推荐</h3>
          <router-link to="/books" class="section-link">查看全部 →</router-link>
        </div>

        <div v-if="booksLoading" class="flex justify-center py-10">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-black border-t-transparent"></div>
        </div>

        <div v-else-if="recommendBooks.length > 0" class="relative">
          <!-- 轮播容器 -->
          <div class="relative overflow-hidden">
            <div 
              class="flex transition-transform duration-500 ease-out"
              :style="{ transform: `translateX(-${currentBookIndex * 100}%)` }"
            >
              <router-link
                v-for="book in recommendBooks"
                :key="book.id"
                :to="`/books/${book.id}`"
                class="w-full flex-shrink-0 px-4"
              >
                <div class="col-card flex gap-6 items-center mx-auto" style="transform: rotate(0deg);">
                  <div class="w-40 h-56 flex-shrink-0 bg-[#f5f0e8] border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    <img
                      :src="book.cover_image || 'https://placehold.co/300x400?text=No+Cover'"
                      alt="Cover"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="flex-1">
                    <span class="inline-block px-2 py-1 bg-accent-blue text-white text-xs font-black uppercase mb-2 border-2 border-black">精选</span>
                    <h4 class="text-2xl font-bold text-primary mb-2" style="font-family: Georgia, serif;">{{ book.title }}</h4>
                    <p class="text-gray-600 mb-1 text-lg">{{ book.author }}</p>
                    <p class="text-sm text-gray-500">{{ book.publisher }}</p>
                    <p class="text-sm text-gray-500 mt-1 font-mono">出版年份：{{ new Date(book.publish_date).getFullYear() }}</p>
                  </div>
                </div>
              </router-link>
            </div>
          </div>

          <!-- 指示器 -->
          <div class="flex justify-center gap-2 mt-6">
            <button
              v-for="(_, index) in recommendBooks"
              :key="index"
              @click="currentBookIndex = index; startBookCarousel();"
              class="w-3 h-3 rounded-full border-2 border-black transition-all"
              :class="currentBookIndex === index ? 'bg-black' : 'bg-white'"
            ></button>
          </div>
        </div>

        <div v-else class="py-10 text-center text-gray-500">
          暂无图书推荐
        </div>
      </div>
    </div>

    <!-- 分割线 -->
    <div class="section-divider"></div>

    <!-- 视频推荐 -->
    <div class="section-wrapper">
      <div class="section-header">
        <h3 class="section-title">视频推荐</h3>
          <router-link to="/videos" class="section-link">查看全部 →</router-link>
        </div>

        <router-link
          to="/videos"
          class="col-card flex items-center gap-6"
          style="transform: rotate(-0.3deg);"
        >
          <div class="w-24 h-24 bg-accent-blue text-white flex items-center justify-center flex-shrink-0 border-4 border-black">
            <el-icon :size="48"><VideoCamera /></el-icon>
          </div>
          <div class="flex-1">
            <div class="col-tag text-accent-blue">视频专区</div>
            <h4 class="text-xl font-bold text-primary mb-1" style="font-family: Georgia, serif;">精选心理学与哲学视频</h4>
            <p class="text-gray-600 text-sm">汇聚优质视频资源，通过生动影像深入理解心理学原理与哲学思考</p>
          </div>
          <div class="hidden md:block">
            <span class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white font-black uppercase border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              立即观看 →
            </span>
          </div>
        </router-link>
      </div>
    </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { Search, VideoCamera } from '@element-plus/icons-vue';
import AIBanner from '@/components/AIBanner.vue';
import api from '@/lib/axios';
import { renderMd } from '@/lib/md';

// 状态
const dailyEffect = ref<any>(null);
const loading = ref(true);
const exploreKeyword = ref('');
const exploreLoading = ref(false);
const exploreEffects = ref<any[]>([]);
const booksLoading = ref(false);
const recommendBooks = ref<any[]>([]);
const currentBookIndex = ref(0);
let bookCarouselInterval: ReturnType<typeof setInterval> | null = null;
const typewriterText = ref('');
const fullText = '像做一次轻量的心理学漫游：今天学一个效应，明天更懂自己一点。把心理学，变成你每天都用得上的小工具。';
const showMore = ref(false);

// 防抖
let searchTimeout: number | null = null;

watch(exploreKeyword, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = window.setTimeout(() => {
    fetchExploreEffects(val);
  }, 500);
});

const fetchExploreEffects = async (keyword = '') => {
  exploreLoading.value = true;
  try {
    const res = await api.get('/effects', { params: { page: 1, limit: 9, keyword } });
    if (res.data.success) {
      exploreEffects.value = res.data.effects || [];
    }
  } catch (error) {
    console.error('Fetch explore effects error', error);
    exploreEffects.value = [];
  } finally {
    exploreLoading.value = false;
  }
};

const fetchRecommendBooks = async () => {
  booksLoading.value = true;
  try {
    const res = await api.get('/books', { params: { page: 1, limit: 10 } });
    if (res.data.success) {
      recommendBooks.value = res.data.books || [];
      startBookCarousel();
    }
  } catch (error) {
    console.error('Fetch recommend books error', error);
    recommendBooks.value = [];
  } finally {
    booksLoading.value = false;
  }
};

const startBookCarousel = () => {
  if (bookCarouselInterval) clearInterval(bookCarouselInterval);
  bookCarouselInterval = setInterval(() => {
    if (recommendBooks.value.length > 1) {
      currentBookIndex.value = (currentBookIndex.value + 1) % recommendBooks.value.length;
    }
  }, 4000);
};

const prevBook = () => {
  if (recommendBooks.value.length > 1) {
    currentBookIndex.value = currentBookIndex.value === 0 
      ? recommendBooks.value.length - 1 
      : currentBookIndex.value - 1;
    startBookCarousel();
  }
};

const nextBook = () => {
  if (recommendBooks.value.length > 1) {
    currentBookIndex.value = (currentBookIndex.value + 1) % recommendBooks.value.length;
    startBookCarousel();
  }
};

onMounted(async () => {
  document.title = '首页 - 每日心理学'
  
  // 确保初始状态正确
  loading.value = true
  
  try {
    const res = await api.get('/daily-effect')
    if (res.data.success) {
      dailyEffect.value = res.data.effect
    }
  } catch (error) {
    console.error('Failed to fetch daily effect', error)
    dailyEffect.value = null
  } finally {
    loading.value = false
    await nextTick()
    
    // 初始化其他数据，使用独立的错误处理避免一个失败影响其他
    fetchExploreEffects('').catch(err => console.error('Failed to fetch effects', err))
    fetchRecommendBooks().catch(err => console.error('Failed to fetch books', err))
    
    // 打字机效果
    let index = 0
    const typeInterval = setInterval(() => {
      if (index <= fullText.length) {
        typewriterText.value = fullText.slice(0, index)
        index++
      } else {
        clearInterval(typeInterval)
      }
    }, 50)
  }
});

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (bookCarouselInterval) clearInterval(bookCarouselInterval);
});
</script>

<style scoped>
.hero-title {
  font-size: clamp(3.5rem, 11vw, 9rem);
  font-weight: 900;
  line-height: 1;
  display: flex;
  gap: 0.05em;
  flex-wrap: wrap;
  align-items: flex-end;
}

.char {
  display: inline-block;
  text-transform: uppercase;
  transform: rotate(var(--rotate));
  transition: transform 0.3s ease;
}

.char:hover {
  transform: rotate(0deg) scale(1.1);
}

.cursor {
  animation: blink 0.8s infinite;
  color: #2d2d2d;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* 今日推荐样式 */
.daily-section {
  margin-top: 40px;
}

.daily-header {
  padding-left: 20px;
}

.daily-icon {
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.daily-label {
  font-size: 1.25rem;
}

.daily-card {
  background: #fff;
  border: 3px solid #2d2d2d;
  padding: 2rem;
  transition: all 0.3s ease;
}

.daily-card:hover {
  box-shadow: 10px 10px 0 rgba(0,0,0,0.15);
}

.daily-char {
  font-size: 3.5rem;
}

.daily-title {
  font-size: 2rem;
}

.daily-proposer {
  font-size: 1.1rem;
}

.daily-desc {
  font-size: 1.1rem;
  line-height: 1.8;
}

/* 栏目通用样式 */
.section-wrapper {
  position: relative;
  background: #fff;
  border: 3px solid #2d2d2d;
  padding: 24px;
  box-shadow: 8px 8px 0 rgba(0,0,0,0.12);
  transform: rotate(-0.5deg);
}

.section-divider {
  height: 3px;
  background: #2d2d2d;
  margin-top: 30px;
  margin-bottom: 30px;
}

/* 胶带装饰 - 紧贴标题栏 */
.section-wrapper::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 40px;
  width: 80px;
  height: 24px;
  background: repeating-linear-gradient(
    90deg,
    rgba(243, 156, 18, 0.9) 0px,
    rgba(243, 156, 18, 0.9) 5px,
    transparent 5px,
    transparent 10px
  );
  transform: rotate(-3deg);
  z-index: 10;
}

.section-red::before {
  background: repeating-linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.9) 0px,
    rgba(255, 255, 255, 0.9) 5px,
    transparent 5px,
    transparent 10px
  );
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  margin: -24px -24px 20px -24px;
  background: #2d2d2d;
  border-bottom: 3px solid #2d2d2d;
}

.section-red .section-header {
  background: #e74c3c;
  border-bottom-color: #c0392b;
}

/* 心理学效应卡片 - 与图书推荐风格一致 */
.effect-card {
  position: relative;
  background: #fff;
  border: 2px solid var(--col-dark);
  padding: 24px;
  transition: all 0.3s ease;
}

/* 不同旋转角度 */
.effect-card:nth-child(3n+1) { transform: rotate(-1deg); }
.effect-card:nth-child(3n+2) { transform: rotate(0.5deg); }
.effect-card:nth-child(3n) { transform: rotate(-0.5deg); }

.effect-card:hover {
  transform: rotate(0deg) translateY(-4px);
  box-shadow: 8px 8px 0 rgba(0,0,0,0.15);
}

/* 胶带装饰 - 左上角 */
.effect-card::before {
  content: "";
  position: absolute;
  top: -8px;
  left: 20px;
  width: 60px;
  height: 18px;
  background: repeating-linear-gradient(
    90deg,
    rgba(155, 89, 182, 0.6) 0px,
    rgba(155, 89, 182, 0.6) 4px,
    rgba(255,255,255,0.3) 4px,
    rgba(255,255,255,0.3) 8px
  );
  transform: rotate(-3deg);
  z-index: 10;
}

.effect-card:nth-child(3n+2)::before {
  background: repeating-linear-gradient(
    90deg,
    rgba(52, 152, 219, 0.6) 0px,
    rgba(52, 152, 219, 0.6) 4px,
    rgba(255,255,255,0.3) 4px,
    rgba(255,255,255,0.3) 8px
  );
}

.effect-card:nth-child(3n)::before {
  background: repeating-linear-gradient(
    90deg,
    rgba(243, 156, 18, 0.6) 0px,
    rgba(243, 156, 18, 0.6) 4px,
    rgba(255,255,255,0.3) 4px,
    rgba(255,255,255,0.3) 8px
  );
}

/* 底部彩色边条 */
.effect-card::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--col-purple);
}

.effect-card:nth-child(3n+2)::after { background: var(--col-blue); }
.effect-card:nth-child(3n)::after { background: var(--col-yellow); }

.effect-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid #2d2d2d;
  flex-shrink: 0;
}

.effect-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: #2d2d2d;
  margin: 0 0 8px 0;
}

.effect-proposer {
  font-size: 1rem;
  color: #666;
  font-family: monospace;
  margin: 0;
}

.effect-desc {
  font-size: 1.1rem;
  color: #555;
  line-height: 1.6;
  margin: 16px 0 0 0;
}

.daily-date {
  font-weight: 600;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 900;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.section-link {
  font-size: 1rem;
  font-weight: bold;
  color: #3498db;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-link:hover {
  color: white;
  text-decoration: underline;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
