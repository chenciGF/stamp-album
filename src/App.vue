<!-- <script setup>
import { ref } from 'vue'
// 引入刚才写好的外部数据
import { stampsData } from './data/stamps'

// 响应式数据
const stamps = ref(stampsData)
const selectedStamp = ref(null)

// 动作：选中邮票
const selectStamp = (stamp) => {
  selectedStamp.value = stamp
}
</script>

<template>
  <div class="w-screen h-screen bg-gray-900 flex items-center justify-center p-4 md:p-10">
    
    <div class="w-full max-w-7xl h-[85vh] bg-amber-50 rounded-xl shadow-2xl flex overflow-hidden border-[10px] border-amber-900">
      
      <div class="w-5/12 bg-amber-100 p-4 border-r-2 border-amber-200 overflow-y-auto custom-scrollbar">
        <h2 class="text-xl font-serif text-amber-900 mb-4 font-bold flex items-center gap-2">
          <span>📮</span> 珍藏目录
        </h2>
        
        <div class="grid grid-cols-3 lg:grid-cols-4 gap-3">
          <div 
            v-for="stamp in stamps" 
            :key="stamp.id"
            @click="selectStamp(stamp)"
            class="group cursor-pointer relative"
          >
            <div 
              class="aspect-square rounded shadow-sm border-2 border-white overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-md"
              :class="selectedStamp?.id === stamp.id ? 'ring-2 ring-amber-600 scale-105' : ''"
            >
              <img 
                v-if="stamp.imageUrl" 
                :src="stamp.imageUrl" 
                class="w-full h-full object-cover"
                :class="{ 'grayscale opacity-60': !stamp.isCollected }"
              />
              <div v-else class="w-full h-full bg-gray-200 flex items-center justify-center flex-col text-gray-400">
                 <span class="text-2xl">?</span>
                 <span class="text-[10px]">缺失</span>
              </div>
            </div>

            <p class="text-center mt-1 text-[10px] text-amber-800 truncate px-1">
              {{ stamp.title }}
            </p>
          </div>
        </div>
      </div>

      <div class="w-7/12 p-8 md:p-12 bg-white relative overflow-y-auto custom-scrollbar">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40 pointer-events-none"></div>

        <div v-if="selectedStamp" class="z-10 relative animate-fade-in max-w-2xl mx-auto">
          
          <div class="w-full aspect-video bg-gray-100 rounded-lg shadow-inner mb-8 overflow-hidden border-4 border-white flex items-center justify-center">
             <img 
               v-if="selectedStamp.imageUrl"
               :src="selectedStamp.imageUrl" 
               class="w-full h-full object-contain"
               :class="{ 'grayscale': !selectedStamp.isCollected }"
             />
             <div v-else class="text-gray-400 text-center">
               <p class="text-4xl mb-2">🔒</p>
               <p>此藏品尚未解锁</p>
             </div>
          </div>

          <div class="flex items-end justify-between border-b-2 border-amber-100 pb-4 mb-6">
            <h1 class="text-3xl font-serif text-gray-900 font-bold">{{ selectedStamp.title }}</h1>
            <span v-if="selectedStamp.isCollected" class="text-sm text-amber-600 font-mono bg-amber-50 px-2 py-1 rounded">
              收录于: {{ selectedStamp.acquiredDate }}
            </span>
          </div>

          <div 
            class="text-gray-700 leading-relaxed text-lg font-serif"
            v-html="selectedStamp.desc"
          ></div>

        </div>

        <div v-else class="h-full flex flex-col items-center justify-center text-amber-800/40 z-10 relative">
          <p class="text-6xl mb-4">📖</p>
          <p class="text-xl font-serif">点击左侧邮票，翻阅记忆...</p>
        </div>
      </div>

    </div>
  </div>
</template>

<style>
/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #d6b98d;
  border-radius: 20px;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style> -->


<!-- V2-->
<!-- 
<script setup>
import { ref } from 'vue'
import { stampsData } from './data/stamps'

const stamps = ref(stampsData)
// selectedStamp 现在用来控制弹窗的显示
const selectedStamp = ref(null)

// 动作：打开弹窗
const openStamp = (stamp) => {
  selectedStamp.value = stamp
}

// 动作：关闭弹窗
const closeStamp = () => {
  selectedStamp.value = null
}
</script>

<template>
  <div class="w-screen h-screen bg-gray-900 flex items-center justify-center p-4 md:p-10 relative">
    
    <div class="w-full max-w-7xl h-[85vh] bg-amber-50 rounded-xl shadow-2xl flex overflow-hidden border-[10px] border-amber-900 z-10">
      
      <div class="w-5/12 bg-amber-100 p-4 border-r-2 border-amber-200 overflow-y-auto custom-scrollbar relative">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 pointer-events-none"></div>
        
        <h2 class="text-xl font-serif text-amber-900 mb-4 font-bold flex items-center gap-2 relative z-10">
          <span>📮</span> 珍藏目录
        </h2>
        
        <div class="grid grid-cols-3 lg:grid-cols-4 gap-3 relative z-10">
          <div 
            v-for="stamp in stamps" 
            :key="stamp.id"
            @click="openStamp(stamp)"
            class="group cursor-pointer relative hover:z-20"
          >
            <div 
              class="aspect-square rounded shadow-sm border-2 border-white overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-md bg-gray-200"
            >
              <img 
                v-if="stamp.imageUrl" 
                :src="stamp.imageUrl" 
                class="w-full h-full object-cover"
                :class="{ 'grayscale opacity-60': !stamp.isCollected }"
              />
              <div v-else class="w-full h-full flex items-center justify-center flex-col text-gray-400">
                 <span class="text-2xl">?</span>
              </div>
            </div>
            <p class="text-center mt-1 text-[10px] text-amber-800 truncate px-1">{{ stamp.title }}</p>
          </div>
        </div>
      </div>

      <div class="w-7/12 p-8 md:p-12 bg-white relative flex flex-col items-center justify-center text-amber-900/50">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 pointer-events-none"></div>
        <div class="z-10 text-center">
          <p class="text-7xl mb-6 opacity-80">📖</p>
          <h3 class="text-2xl font-serif font-bold mb-2">集邮册预览模式</h3>
          <p class="font-serif">点击左侧目录，以弹窗形式查看详情。</p>
        </div>
      </div>

    </div>


    <Transition name="modal">
      <div v-if="selectedStamp" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        
        <div class="absolute inset-0 bg-gray-900/90 backdrop-blur-sm" @click="closeStamp"></div>

        <div class="relative bg-amber-50 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-up border-4 border-amber-100">
          
          <button 
            @click="closeStamp"
            class="absolute top-4 right-4 z-30 bg-white text-gray-800 hover:bg-red-600 hover:text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-200 border-2 border-gray-200 hover:border-transparent"
            title="关闭"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="w-full md:w-1/2 bg-gray-200 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
             <div class="absolute inset-0 bg-amber-900/10 mix-blend-multiply pointer-events-none"></div>
             <img 
               v-if="selectedStamp.imageUrl"
               :src="selectedStamp.imageUrl" 
               class="max-w-full max-h-[40vh] md:max-h-[70vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[8px] border-white transform rotate-2"
               :class="{'grayscale opacity-80': !selectedStamp.isCollected}"
             />
             <div v-else class="text-gray-400 text-center">
               <span class="text-6xl">🔒</span>
             </div>
          </div>

          <div class="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] relative">
            
            <div class="mb-8 border-b-2 border-amber-200/50 pb-4">
              <h2 class="text-4xl font-bold font-serif text-amber-900 mb-3">{{ selectedStamp.title }}</h2>
              <div class="flex items-center gap-3 text-sm font-serif">
                 <span v-if="selectedStamp.isCollected" class="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full">
                   ✅ 已收藏
                 </span>
                 <span class="text-amber-700">
                   收录时间：{{ selectedStamp.acquiredDate || '未知' }}
                 </span>
              </div>
            </div>

            <div 
              class="prose prose-lg prose-amber text-gray-800 leading-loose font-serif"
              v-html="selectedStamp.desc"
            ></div>
            
          </div>
        </div>

      </div>
    </Transition>

  </div>
</template>

<style>
/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d6b98d; border-radius: 20px; }

/* 弹窗动画 */
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .animate-scale-up { animation: scaleUp 0.3s ease-out; }
.modal-leave-active .animate-scale-up { animation: scaleUp 0.3s ease-in reverse; }
@keyframes scaleUp {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style> -->


<script setup>
import { ref, computed } from 'vue'
import { stampsData } from './data/stamps'

const stamps = ref(stampsData)
const selectedStamp = ref(null)

// ==========================================
// 核心逻辑：像切蛋糕一样，把数据切成两半
// ==========================================
const midPoint = computed(() => Math.ceil(stamps.value.length / 2))

const leftStamps = computed(() => stamps.value.slice(0, midPoint.value))
const rightStamps = computed(() => stamps.value.slice(midPoint.value))

// 动作
const openStamp = (stamp) => { selectedStamp.value = stamp }
const closeStamp = () => { selectedStamp.value = null }
</script>

<template>
  <div class="w-screen h-screen bg-gray-900 flex items-center justify-center p-4 md:p-8 relative font-sans">
    
    <div class="w-full max-w-7xl h-[85vh] bg-amber-50 rounded-xl shadow-2xl flex overflow-hidden border-[8px] border-amber-900 z-10 relative">
      
      <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40 pointer-events-none z-0"></div>

      <div class="w-1/2 h-full p-4 md:p-6 overflow-y-auto custom-scrollbar relative z-10">
        <h2 class="text-lg font-serif text-amber-900/70 mb-4 font-bold flex items-center gap-2 border-b border-amber-200 pb-2">
          <span>Part I</span> 早期珍藏
        </h2>
        
        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <div 
            v-for="stamp in leftStamps" 
            :key="stamp.id"
            @click="openStamp(stamp)"
            class="stamp-card group"
          >
            <div class="stamp-inner">
              <img v-if="stamp.imageUrl" :src="stamp.imageUrl" class="stamp-img" :class="{ 'grayscale opacity-60': !stamp.isCollected }"/>
              <div v-else class="missing-placeholder"><span>?</span></div>
            </div>
            <p class="stamp-title">{{ stamp.title }}</p>
          </div>
        </div>
      </div>

      <div class="relative w-0 z-20">
         <div class="absolute inset-y-0 -left-4 w-8 bg-gradient-to-r from-transparent via-black/10 to-transparent pointer-events-none"></div>
         <div class="absolute inset-y-0 left-0 w-[1px] bg-amber-900/20"></div>
      </div>

      <div class="w-1/2 h-full p-4 md:p-6 overflow-y-auto custom-scrollbar relative z-10">
        <h2 class="text-lg font-serif text-amber-900/70 mb-4 font-bold flex items-center justify-end gap-2 border-b border-amber-200 pb-2">
          近期收录 <span>Part II</span>
        </h2>

        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          <div 
            v-for="stamp in rightStamps" 
            :key="stamp.id"
            @click="openStamp(stamp)"
            class="stamp-card group"
          >
            <div class="stamp-inner">
              <img v-if="stamp.imageUrl" :src="stamp.imageUrl" class="stamp-img" :class="{ 'grayscale opacity-60': !stamp.isCollected }"/>
              <div v-else class="missing-placeholder"><span>?</span></div>
            </div>
            <p class="stamp-title">{{ stamp.title }}</p>
          </div>
        </div>
      </div>

    </div>


    <Transition name="modal">
      <div v-if="selectedStamp" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
        <div class="absolute inset-0 bg-gray-900/90 backdrop-blur-sm" @click="closeStamp"></div>
        <div class="relative bg-amber-50 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-up border-4 border-amber-100">
          <button @click="closeStamp" class="absolute top-4 right-4 z-30 bg-white text-gray-800 hover:bg-red-600 hover:text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-200 border-2 border-gray-200 hover:border-transparent">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div class="w-full md:w-1/2 bg-gray-200 flex items-center justify-center p-6 md:p-12 relative overflow-hidden">
             <div class="absolute inset-0 bg-amber-900/10 mix-blend-multiply pointer-events-none"></div>
             <img v-if="selectedStamp.imageUrl" :src="selectedStamp.imageUrl" class="max-w-full max-h-[40vh] md:max-h-[70vh] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-[8px] border-white transform rotate-2" :class="{'grayscale opacity-80': !selectedStamp.isCollected}"/>
             <div v-else class="text-gray-400 text-center"><span class="text-6xl">🔒</span></div>
          </div>
          <div class="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] relative">
            <div class="mb-8 border-b-2 border-amber-200/50 pb-4">
              <h2 class="text-4xl font-bold font-serif text-amber-900 mb-3">{{ selectedStamp.title }}</h2>
              <div class="flex items-center gap-3 text-sm font-serif">
                 <span v-if="selectedStamp.isCollected" class="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full">✅ 已收藏</span>
                 <span class="text-amber-700">收录时间：{{ selectedStamp.acquiredDate || '未知' }}</span>
              </div>
            </div>
            <div class="prose prose-lg prose-amber text-gray-800 leading-loose font-serif" v-html="selectedStamp.desc"></div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
/* 为了代码整洁，我提取了一些重复的 CSS 类到这里 */

/* 邮票卡片容器 */
.stamp-card {
  @apply cursor-pointer relative hover:z-20 transition-transform duration-300 hover:scale-105;
}

/* 邮票内部方块 */
.stamp-inner {
  @apply aspect-square rounded shadow-sm border-2 border-white overflow-hidden bg-gray-200 hover:shadow-md;
}

/* 图片通用样式 */
.stamp-img {
  @apply w-full h-full object-cover;
}

/* 缺失占位符 */
.missing-placeholder {
  @apply w-full h-full flex items-center justify-center flex-col text-gray-400 text-2xl;
}

/* 标题 */
.stamp-title {
  @apply text-center mt-1 text-[10px] text-amber-800 truncate px-1 font-serif;
}

/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d6b98d; border-radius: 20px; }

/* 动画 */
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .animate-scale-up { animation: scaleUp 0.3s ease-out; }
.modal-leave-active .animate-scale-up { animation: scaleUp 0.3s ease-in reverse; }
@keyframes scaleUp {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>