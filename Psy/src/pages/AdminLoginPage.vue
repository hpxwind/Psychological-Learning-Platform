<template>
  <div class="max-w-md mx-auto py-20">
    <div class="border-4 border-black bg-white p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h1 class="text-2xl md:text-3xl font-black uppercase tracking-wide text-center mb-8 text-primary">管理员登录</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label class="block text-sm font-bold uppercase tracking-wide mb-2 text-gray-600">用户名</label>
          <input 
            v-model="username"
            type="text" 
            class="w-full px-4 py-3 border-4 border-black bg-white text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            required
          >
        </div>
        
        <div>
          <label class="block text-sm font-bold uppercase tracking-wide mb-2 text-gray-600">密码</label>
          <input 
            v-model="password"
            type="password" 
            class="w-full px-4 py-3 border-4 border-black bg-white text-primary placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            required
          >
        </div>

        <div v-if="error" class="text-accent-red text-sm font-bold text-center">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full px-6 py-3 font-black uppercase tracking-wide bg-black text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  
  const success = await authStore.login({
    username: username.value,
    password: password.value
  });

  loading.value = false;

  if (success) {
    router.push({ name: 'admin-dashboard' });
  } else {
    error.value = '用户名或密码错误';
  }
};
</script>
