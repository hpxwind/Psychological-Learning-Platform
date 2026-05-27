<template>
  <div class="w-full">
    <div class="mb-8 text-left">
      <h1 class="font-black uppercase tracking-tight text-4xl md:text-5xl text-primary mb-2">心理学书单</h1>
      <p class="text-base md:text-lg text-gray-600 font-mono">推荐必读的心理学经典著作</p>
    </div>

    <!-- 搜索框 -->
    <div class="mb-8 flex justify-end">
      <div class="relative w-full md:w-80">
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜索书籍..."
          class="input-brutal pr-10"
        >
        <el-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"><Search /></el-icon>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
    </div>

    <!-- 书籍列表 -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link
        v-for="book in books"
        :key="book.id"
        :to="`/books/${book.id}`"
        class="bg-white border-4 border-black overflow-hidden hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all card-brutal flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
      >
        <div class="h-64 bg-[#f5f0e8] border-b-4 border-black relative group overflow-hidden">
          <img 
            :src="book.cover_image || 'https://placehold.co/300x400?text=No+Cover'" 
            alt="Cover" 
            class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          >
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <span class="bg-black text-white font-black uppercase px-6 py-2 opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 border-2 border-black">
              查看详情
            </span>
          </div>
        </div>
        <div class="p-6 flex-grow flex flex-col">
          <h3 class="text-xl font-black uppercase tracking-wide mb-1 text-primary leading-tight">{{ book.title }}</h3>
          <p class="text-sm text-gray-600 mb-4">{{ book.author }}</p>
          <div class="mt-auto flex justify-between items-center text-xs text-gray-500 font-mono">
            <span>{{ book.publisher }}</span>
            <span>{{ new Date(book.publish_date).getFullYear() || '未知' }}</span>
          </div>
        </div>
      </router-link>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && books.length === 0" class="text-center py-20">
      <p class="text-lg text-text-muted">暂无相关书籍</p>
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex justify-center mt-12 gap-2">
      <button 
        @click="changePage(currentPage - 1)" 
        :disabled="currentPage === 1"
        class="px-4 py-2 border-2 border-primary bg-white text-primary font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
      >
        上一页
      </button>
      <span class="px-4 py-2 font-semibold text-text-secondary flex items-center">{{ currentPage }} / {{ totalPages }}</span>
      <button 
        @click="changePage(currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="px-4 py-2 border-2 border-primary bg-white text-primary font-semibold rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary transition"
      >
        下一页
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Search } from '@element-plus/icons-vue';
import api from '@/lib/axios';

const books = ref<any[]>([]);
const loading = ref(true);
const searchKeyword = ref('');
const currentPage = ref(1);
const totalPages = ref(1);

function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

const fetchBooks = async () => {
  loading.value = true;
  try {
    const res = await api.get('/books', {
      params: {
        page: currentPage.value,
        limit: 12,
        keyword: searchKeyword.value
      }
    });
    if (res.data.success) {
      books.value = res.data.books;
      totalPages.value = res.data.pagination.totalPages;
    }
  } catch (error) {
    console.error('Fetch books error', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = debounce(() => {
  currentPage.value = 1;
  fetchBooks();
}, 500);

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    fetchBooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

watch(searchKeyword, handleSearch);

onMounted(() => {
  document.title = '书籍推荐 - 每日心理学'
  fetchBooks()
});
</script>
