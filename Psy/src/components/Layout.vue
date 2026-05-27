<template>
  <div class="min-h-screen flex flex-col text-primary font-sans relative overflow-x-hidden bg-grid">
    <!-- 装饰性透明正方形 -->
    <div v-if="!hideLayout" class="deco-squares">
      <div class="deco-square" style="--size: 250px; --top: 8%; --left: 2%; --rotate: 15deg; --color: rgba(231,76,60,0.10);"></div>
      <div class="deco-square" style="--size: 200px; --top: 55%; --right: 3%; --rotate: -25deg; --color: rgba(52,152,219,0.08);"></div>
      <div class="deco-square" style="--size: 220px; --top: 78%; --left: 8%; --rotate: 35deg; --color: rgba(155,89,182,0.07);"></div>
      <div class="deco-square" style="--size: 160px; --top: 30%; --right: 15%; --rotate: -10deg; --color: rgba(243,156,18,0.08);"></div>
      <div class="deco-square" style="--size: 180px; --top: 62%; --left: 4%; --rotate: 20deg; --color: rgba(46,204,113,0.08);"></div>
    </div>
    <!-- 顶部导航 -->
    <header v-if="!hideLayout" class="sticky top-0 z-50 bg-white border-b-4 border-black">
      <div class="w-full px-6 md:px-10 lg:px-16 py-4 flex justify-between items-center">
        <router-link to="/" class="text-xl md:text-2xl font-black tracking-tight text-primary hover:text-primary/80 transition-colors flex items-center gap-3">
          <span class="text-2xl leading-none">🧠</span>
          <span class="leading-none font-black uppercase">PSYCHOLOGY</span>
        </router-link>

        <nav class="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-wider">
          <router-link 
            to="/effects" 
            class="px-4 py-2 text-primary hover:bg-secondary transition-colors border-2 border-transparent hover:border-black"
          >
            效应库
          </router-link>
          <router-link 
            to="/books" 
            class="px-4 py-2 text-primary hover:bg-secondary transition-colors border-2 border-transparent hover:border-black"
          >
            图书推荐
          </router-link>
          <router-link 
            to="/videos" 
            class="px-4 py-2 text-primary hover:bg-secondary transition-colors border-2 border-transparent hover:border-black"
          >
            视频资料
          </router-link>
          <router-link 
            to="/self-test" 
            class="px-4 py-2 text-primary hover:bg-secondary transition-colors border-2 border-transparent hover:border-black"
          >
            心理自测
          </router-link>
          <router-link 
            to="/search" 
            class="px-4 py-2 text-primary hover:bg-secondary transition-colors border-2 border-transparent hover:border-black flex items-center gap-2"
          >
            <el-icon><Search /></el-icon> 搜索
          </router-link>
        </nav>

        <!-- 移动端菜单按钮 -->
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden p-2 border-2 border-black">
          <el-icon :size="24"><Menu /></el-icon>
        </button>
      </div>

      <!-- 移动端菜单 -->
      <div v-if="mobileMenuOpen" class="md:hidden bg-white border-t-4 border-black px-6 py-4">
        <nav class="flex flex-col gap-2">
          <router-link to="/effects" @click="mobileMenuOpen = false" class="px-4 py-3 text-primary hover:bg-secondary font-bold uppercase border-2 border-transparent hover:border-black">效应库</router-link>
          <router-link to="/books" @click="mobileMenuOpen = false" class="px-4 py-3 text-primary hover:bg-secondary font-bold uppercase border-2 border-transparent hover:border-black">图书推荐</router-link>
          <router-link to="/videos" @click="mobileMenuOpen = false" class="px-4 py-3 text-primary hover:bg-secondary font-bold uppercase border-2 border-transparent hover:border-black">视频资料</router-link>
          <router-link to="/self-test" @click="mobileMenuOpen = false" class="px-4 py-3 text-primary hover:bg-secondary font-bold uppercase border-2 border-transparent hover:border-black">心理自测</router-link>
          <router-link to="/search" @click="mobileMenuOpen = false" class="px-4 py-3 text-primary hover:bg-secondary font-bold uppercase border-2 border-transparent hover:border-black">搜索</router-link>
        </nav>
      </div>
    </header>

    <main :class="hideLayout ? 'flex-1 w-full' : 'flex-1 w-full px-6 md:px-10 lg:px-20 py-10 relative z-10 max-w-[1400px] mx-auto'">
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </main>

    <!-- 页脚 -->
    <footer v-if="!hideLayout" class="bg-black text-white py-10 mt-auto border-t-4 border-black">
      <div class="max-w-[1400px] mx-auto px-6 md:px-10 lg:px-16">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">🧠</span>
            <span class="font-black uppercase tracking-wider">PSYCHOLOGY</span>
          </div>
          <p class="text-sm text-gray-400 font-mono">探索心理学的奥秘，了解人类行为的科学</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { Search, Menu } from '@element-plus/icons-vue';

const route = useRoute();
const mobileMenuOpen = ref(false);

// AI聊天页面和后台管理页面隐藏Layout的header和footer
const hideLayout = computed(() => route.path === '/ai-chat' || route.meta.noLayout);
</script>

<style scoped>
/* 装饰性透明正方形 */
.deco-squares {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.deco-square {
  position: absolute;
  width: var(--size);
  height: var(--size);
  top: var(--top, 0);
  left: var(--left, auto);
  right: var(--right, auto);
  background: var(--color);
  transform: rotate(var(--rotate));
  transition: transform 0.5s ease;
}

.deco-square:hover {
  transform: rotate(calc(var(--rotate) + 10deg)) scale(1.1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
