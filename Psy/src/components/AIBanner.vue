<template>
  <div class="ai-banner">
    <div class="ai-banner-bg"></div>
    <div class="speech-bubble" :style="bubbleStyle">
      {{ displayMessage }}
    </div>
    <div class="ai-banner-header">
      <div class="ai-icon">
        <img :src="thinkIcon" alt="AI助手" />
      </div>
      <div class="ai-title">
        <h3>AI 心理助手</h3>
        <p>探索心理学的奥秘</p>
      </div>
    </div>
    
    <div class="ai-banner-content">
      <div class="eye-cards-wrapper">
        <div 
          v-for="(monster, index) in monsters" 
          :key="index"
          class="eye-card"
          :style="{ 
            backgroundColor: monster.color,
            height: monster.height + 'px',
            width: monster.width + 'px',
            borderRadius: monster.borderRadius
          }"
          @mouseenter="hoveredMonster = monster; displayMessage = monster.message"
          @mouseleave="hoveredMonster = null; displayMessage = monsters[currentAutoIndex].message"
        >
          <div class="eyes-container" :style="{ gap: monster.eyeGap + 'px' }">
            <div class="eye" :style="{ width: monster.eyeSize + 'px', height: monster.eyeSize + 'px' }">
              <div class="pupil" :style="{ width: monster.pupilSize + 'px', height: monster.pupilSize + 'px', transform: pupilPositions[index * 2] }"></div>
            </div>
            <div class="eye" :style="{ width: monster.eyeSize + 'px', height: monster.eyeSize + 'px' }">
              <div class="pupil" :style="{ width: monster.pupilSize + 'px', height: monster.pupilSize + 'px', transform: pupilPositions[index * 2 + 1] }"></div>
            </div>
          </div>
          <div class="mouth" :class="[monster.mouth, 'default-mouth']"></div>
          <div class="mouth hover-mouth surprise"></div>
          <div class="effect-float"><span v-html="formatEffect(monster.effect)" @click="selectRecommend(monster.effect)"></span></div>
        </div>
      </div>
      
      <div class="ai-input-wrapper">
        <div class="recommend-search">
          <span 
            v-for="(item, index) in recommendSearches" 
            :key="index"
            class="recommend-item"
            @click="selectRecommend(item)"
          >
            {{ item }}
          </span>
        </div>
        <div class="input-row">
          <input 
            type="text" 
            class="ai-input" 
            placeholder="输入问题，AI助手为您解答..."
            v-model="inputQuestion"
            @keyup.enter="submitQuestion"
          />
          <button class="ai-submit" @click="submitQuestion">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import thinkIcon from '../assets/think.svg'

const router = useRouter()
const inputQuestion = ref('')

const submitQuestion = () => {
  if (inputQuestion.value.trim()) {
    router.push({
      path: '/ai-chat',
      query: { q: inputQuestion.value }
    })
  }
}

const recommendSearches = [
  '什么是焦虑症？',
  '如何缓解压力',
  '抑郁症的表现',
  '人际交往技巧',
  '自我认知方法'
]

const selectRecommend = (text: string) => {
  inputQuestion.value = text
  submitQuestion()
}

const formatEffect = (str: string) => {
  return str.replace(/(.{5})/g, '$1<br>').replace(/<br>$/, '')
}

interface Monster {
  width: number
  height: number
  eyeSize: number
  eyeGap: number
  pupilSize: number
  color: string
  mouth: string
  borderRadius: string
  message: string
  effect: string
}

const monsters: Monster[] = [
  { width: 112, height: 245, eyeSize: 36, eyeGap: 7, pupilSize: 14, color: '#FF6B6B', mouth: 'big-smile', borderRadius: '28px 28px 0 0', message: '你好！有什么心理问题想聊聊吗？', effect: '羊群效应' },
  { width: 109, height: 231, eyeSize: 34, eyeGap: 6, pupilSize: 13, color: '#4ECDC4', mouth: 'surprise', borderRadius: '25px 31px 0 0', message: '哇！你对心理学感兴趣吗？', effect: '锚定效应' },
  { width: 115, height: 259, eyeSize: 38, eyeGap: 8, pupilSize: 15, color: '#FCBAD3', mouth: 'smile', borderRadius: '31px 25px 0 0', message: '今天心情怎么样？', effect: '皮格马利翁效应' },
  { width: 111, height: 238, eyeSize: 35, eyeGap: 6, pupilSize: 14, color: '#AA96DA', mouth: 'neutral', borderRadius: '21px 35px 0 0', message: '我可以帮你分析一些心理现象', effect: '马太效应' },
  { width: 113, height: 217, eyeSize: 37, eyeGap: 7, pupilSize: 14, color: '#95E1D3', mouth: 'sad', borderRadius: '35px 21px 0 0', message: '别担心，一切都会好起来的', effect: '安慰剂效应' },
]

const hoveredMonster = ref<Monster | null>(null)
const bubbleStyle = ref({})
const displayMessage = ref('')
const currentAutoIndex = ref(0)
let autoSwitchInterval: ReturnType<typeof setInterval> | null = null
let lastMouseMove = Date.now()

const startAutoSwitch = () => {
  if (autoSwitchInterval) clearInterval(autoSwitchInterval)
  autoSwitchInterval = setInterval(() => {
    const timeSinceLastMove = Date.now() - lastMouseMove
    if (timeSinceLastMove >= 10000) {
      currentAutoIndex.value = (currentAutoIndex.value + 1) % monsters.length
      displayMessage.value = monsters[currentAutoIndex.value].message
    }
  }, 10000)
}

const pupilPositions = ref<string[]>(monsters.flatMap(() => ['translate(0px, 0px)', 'translate(0px, 0px)']))

const updatePupils = (e: MouseEvent) => {
  lastMouseMove = Date.now()
  const eyes = document.querySelectorAll('.eye-card .eye')
  const positions: string[] = []
  
  eyes.forEach((eyeWrapper) => {
    const eye = eyeWrapper as HTMLElement
    const rect = eye.getBoundingClientRect()
    const eyeCenterX = rect.left + rect.width / 2
    const eyeCenterY = rect.top + rect.height / 2
    
    const dx = e.clientX - eyeCenterX
    const dy = e.clientY - eyeCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    const eyeRadius = rect.width / 2
    const pupilRadius = 9
    const maxMovement = Math.max(0, eyeRadius - pupilRadius - 2)
    
    if (distance < 1) {
      positions.push('translate(0px, 0px)')
      return
    }
    
    const nx = dx / distance
    const ny = dy / distance
    const moveX = Math.min(distance, maxMovement) * nx
    const moveY = Math.min(distance, maxMovement) * ny
    
    positions.push(`translate(${moveX}px, ${moveY}px)`)
  })
  
  pupilPositions.value = positions
}

onMounted(() => {
  window.addEventListener('mousemove', updatePupils)
  displayMessage.value = monsters[0].message
  startAutoSwitch()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', updatePupils)
  if (autoSwitchInterval) clearInterval(autoSwitchInterval)
})
</script>

<style scoped>
.ai-banner {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
  background: linear-gradient(180deg, #f8e8e8 0%, #f5d5d5 40%, #e8c4b8 40%, #d4a574 100%);
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.ai-banner-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/background/08b6d38da1c74a599f3f2c9616faca86.png');
  background-size: auto 100%;
  background-repeat: repeat-x;
  background-position: 95px bottom;
  opacity: 0.6;
  pointer-events: none;
}

.ai-banner-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.ai-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 600px;
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
}

.input-row {
  display: flex;
  gap: 12px;
}

.recommend-search {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.recommend-item {
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid #ccc;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recommend-item:hover {
  background: #2d2d2d;
  color: white;
  border-color: #2d2d2d;
}

.ai-banner-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.ai-icon {
  width: 48px;
  height: 48px;
  background: #2d2d2d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.2);
  flex-shrink: 0;
}

.ai-icon img {
  width: 28px;
  height: 28px;
}

.ai-title h3 {
  font-size: 20px;
  font-weight: 900;
  color: #2d2d2d;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.ai-title p {
  font-size: 13px;
  color: #666;
  margin: 4px 0 0 0;
  font-family: monospace;
}

.eye-cards-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.speech-bubble {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 4px solid #2d2d2d;
  border-radius: 24px;
  padding: 20px 32px;
  font-size: 18px;
  font-weight: 600;
  color: #2d2d2d;
  z-index: 100;
  max-width: 400px;
  min-width: 300px;
  text-align: center;
  box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.2);
}

.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  border: 12px solid transparent;
  border-top-color: #2d2d2d;
}

.speech-bubble::before {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border: 10px solid transparent;
  border-top-color: white;
  z-index: 1;
}

.eye-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-sizing: border-box;
  padding-top: 80px;
  position: relative;
  overflow: visible;
  border: 2px solid #2d2d2d;
  box-shadow: 8px 0 0 rgba(0, 0, 0, 0.4);
}

.eye-card:hover {
  padding-top: 40px;
}

.eye-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: #2d2d2d;
}

.eyes-container {
  display: flex;
  align-items: center;
}

.effect-float {
  font-size: 11px;
  font-weight: 700;
  color: #2d2d2d;
  background: transparent;
  padding: 4px 8px;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  margin-top: 8px;
}

.effect-float::before {
  content: '>';
  margin-right: 4px;
  font-weight: 900;
}

.effect-float::after {
  content: '<';
  margin-left: 4px;
  font-weight: 900;
}

.effect-float span {
  border: 2px solid #2d2d2d;
  border-radius: 0;
  padding: 6px 12px;
  background: white;
  display: inline-block;
  line-height: 1.4;
  cursor: pointer;
}

.effect-float span:hover {
  background: #f0f0f0;
}

.eye-card:hover .effect-float {
  opacity: 1;
  transform: translateY(0);
}

.eye {
  background: white;
  border-radius: 50%;
  border: 2px solid #2d2d2d;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.15);
}

.pupil {
  background: #2d2d2d;
  border-radius: 50%;
  transition: transform 0.05s ease-out;
  position: relative;
  box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
}

.mouth {
  border: 2px solid #2d2d2d;
  border-top: none;
  background: transparent;
  z-index: 2;
  position: relative;
}

.hover-mouth {
  display: none;
}

.eye-card:hover .default-mouth {
  display: none;
}

.eye-card:hover .hover-mouth {
  display: block;
}

.mouth.smile {
  width: 24px;
  height: 12px;
  border-radius: 0 0 24px 24px;
}

.mouth.big-smile {
  width: 32px;
  height: 18px;
  border-radius: 0 0 32px 32px;
}

.mouth.surprise {
  width: 14px;
  height: 18px;
  border: 2px solid #2d2d2d;
  border-radius: 50%;
  background: transparent;
  border-top: 2px solid #2d2d2d;
}

.mouth.sad {
  width: 24px;
  height: 12px;
  border: 2px solid #2d2d2d;
  border-bottom: none;
  border-radius: 24px 24px 0 0;
  transform: rotate(180deg);
}

.mouth.neutral {
  width: 20px;
  height: 3px;
  background: #2d2d2d;
  border: none;
  border-radius: 2px;
}

.ai-input {
  flex: 1;
  padding: 12px 20px;
  font-size: 15px;
  border: 2px solid #2d2d2d;
  border-radius: 24px;
  outline: none;
  background: white;
}

.ai-input:focus {
  border-color: #4ECDC4;
}

.ai-submit {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 600;
  background: #2d2d2d;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.ai-submit:hover {
  transform: translateY(-2px);
}
</style>
