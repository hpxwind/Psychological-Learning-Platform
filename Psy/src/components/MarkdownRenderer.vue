<template>
  <div class="markdown-content" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content: string
}>()

// 配置 marked 选项
marked.setOptions({
  breaks: true,
  gfm: true
})

const renderedHtml = computed(() => {
  if (!props.content) return ''
  return marked(props.content)
})
</script>

<style scoped>
.markdown-content {
  color: #4b5563;
  line-height: 1.6;
}

.markdown-content :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-top: 12px;
  margin-bottom: 8px;
}

.markdown-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin-top: 10px;
  margin-bottom: 6px;
}

.markdown-content :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-top: 8px;
  margin-bottom: 4px;
}

.markdown-content :deep(p) {
  margin-bottom: 8px;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 8px;
  padding-left: 20px;
}

.markdown-content :deep(li) {
  margin-bottom: 4px;
}

.markdown-content :deep(strong) {
  font-weight: 600;
}

.markdown-content :deep(em) {
  font-style: italic;
}
</style>
