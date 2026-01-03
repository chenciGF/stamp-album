<script setup>
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
</style>