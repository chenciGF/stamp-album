
<script setup>
import { ref, computed, watch } from "vue";
import { stampsData } from "./data/stamps";
import StampGrid from "./components/StampGrid.vue";

const stamps = ref(stampsData);

// ===== 弹窗逻辑（保留）=====
const selectedStamp = ref(null);
const openStamp = (stamp) => {
  selectedStamp.value = stamp;
};
const closeStamp = () => {
  selectedStamp.value = null;
};

// ===== 分页/翻页 =====
const stampsPerPage = ref(2);     // ✅ 每“单页”显示多少枚邮票（你想调就改这里）
const spreadIndex = ref(0);        // ✅ 跨页索引（一次显示左右两页）
const isFlipping = ref(false);
const direction = ref(null);       // 'next' | 'prev'

const pages = computed(() => {
  const out = [];
  for (let i = 0; i < stamps.value.length; i += stampsPerPage.value) {
    out.push(stamps.value.slice(i, i + stampsPerPage.value));
  }
  return out;
});

const spreads = computed(() => {
  const out = [];
  for (let i = 0; i < pages.value.length; i += 2) {
    out.push({
      left: pages.value[i] ?? [],
      right: pages.value[i + 1] ?? [],
    });
  }
  return out;
});

const current = computed(() => spreads.value[spreadIndex.value] ?? { left: [], right: [] });
const next = computed(() => spreads.value[spreadIndex.value + 1] ?? null);
const prev = computed(() => spreads.value[spreadIndex.value - 1] ?? null);

const hasNext = computed(() => !!next.value);
const hasPrev = computed(() => !!prev.value);

// 数据变化（未来筛选）防止越界
watch(
  spreads,
  () => {
    const max = Math.max(0, spreads.value.length - 1);
    if (spreadIndex.value > max) spreadIndex.value = max;
  },
  { immediate: true }
);

// 翻页过程中“底下露出来的内容”
const underLeft = computed(() => {
  if (!isFlipping.value) return current.value.left;
  return direction.value === "prev" ? (prev.value?.left ?? []) : current.value.left;
});
const underRight = computed(() => {
  if (!isFlipping.value) return current.value.right;
  return direction.value === "next" ? (next.value?.right ?? []) : current.value.right;
});

// 翻页那张“纸”的正反面
const sheetFront = computed(() => (direction.value === "next" ? current.value.right : current.value.left));
const sheetBack = computed(() =>
  direction.value === "next" ? (next.value?.left ?? []) : (prev.value?.right ?? [])
);

// 避免翻页中误点弹窗
const safeOpenStamp = (stamp) => {
  if (isFlipping.value) return;
  openStamp(stamp);
};

const flipNext = () => {
  if (isFlipping.value || !hasNext.value) return;
  direction.value = "next";
  isFlipping.value = true;
};
const flipPrev = () => {
  if (isFlipping.value || !hasPrev.value) return;
  direction.value = "prev";
  isFlipping.value = true;
};

const onFlipEnd = () => {
  if (direction.value === "next") spreadIndex.value += 1;
  if (direction.value === "prev") spreadIndex.value -= 1;
  isFlipping.value = false;
  direction.value = null;
};

// ===== 空白处：0.3s 双击翻页 + cooldown =====
const DOUBLE_CLICK_MS = 300;
const COOLDOWN_MS = 850; // 稍大于翻页动画，避免误触连翻

const lastBlankLeft = ref(0);
const lastBlankRight = ref(0);
const cooldownLeftUntil = ref(0);
const cooldownRightUntil = ref(0);

function isClickOnStamp(e) {
  return !!e.target?.closest?.(".stamp-card");
}

function onPageBlankClick(side, e) {
  // 只处理“空白处”的点击：点在 stamp-card 上直接忽略
  if (isFlipping.value) return;
  if (isClickOnStamp(e)) return;

  const now = Date.now();

  if (side === "left") {
    if (now < cooldownLeftUntil.value) return;

    if (lastBlankLeft.value && now - lastBlankLeft.value <= DOUBLE_CLICK_MS) {
      lastBlankLeft.value = 0;
      cooldownLeftUntil.value = now + COOLDOWN_MS;
      flipPrev();
      return;
    }
    lastBlankLeft.value = now;
    return;
  }

  if (side === "right") {
    if (now < cooldownRightUntil.value) return;

    if (lastBlankRight.value && now - lastBlankRight.value <= DOUBLE_CLICK_MS) {
      lastBlankRight.value = 0;
      cooldownRightUntil.value = now + COOLDOWN_MS;
      flipNext();
      return;
    }
    lastBlankRight.value = now;
    return;
  }
}

// ===== 页码（右下角显示：第X页/共Y页；双页显示会显示范围）=====
const totalPages = computed(() => pages.value.length);

const pageLabel = computed(() => {
  const total = totalPages.value;
  if (!total) return "第 0 页 / 共 0 页";

  const leftNo = spreadIndex.value * 2 + 1;
  const rightNo = Math.min(leftNo + 1, total);

  if (rightNo === leftNo) {
    return `第 ${leftNo} 页 / 共 ${total} 页`;
  }
  return `第 ${leftNo}-${rightNo} 页 / 共 ${total} 页`;
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-amber-100 to-amber-200 text-amber-950">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <div class="flex items-end justify-between gap-4 mb-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Stamp Album</h1>
          <p class="text-sm opacity-80 mt-1">点邮票看详情 · 空白处双击翻页</p>
        </div>
      </div>

      <!-- 书本容器 -->
      <div class="book-shell relative mx-auto">
        <div
          class="w-full h-[82vh] bg-amber-50 rounded-xl shadow-2xl overflow-hidden border-[8px] border-amber-900 relative"
        >
          <!-- 纸张纹理层（不挡点击） -->
          <div
            class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40 pointer-events-none z-0"
          ></div>

          <!-- underlay：翻页时底下露出来的 -->
          <div class="absolute inset-0 grid grid-cols-2 z-10">
            <div class="p-4 md:p-6">
              <StampGrid :items="underLeft" @select="safeOpenStamp" />
            </div>
            <div class="p-4 md:p-6">
              <StampGrid :items="underRight" @select="safeOpenStamp" />
            </div>
          </div>

          <!-- 中线光晕/书脊（不挡点击） -->
          <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0 z-30 pointer-events-none">
            <div class="absolute inset-y-0 -left-4 w-8 bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
            <div class="absolute inset-y-0 left-0 w-[1px] bg-amber-900/20"></div>
          </div>

          <!-- current：不翻页时显示当前跨页 + 空白处双击检测 -->
          <div v-if="!isFlipping" class="absolute inset-0 grid grid-cols-2 z-20">
            <div class="p-4 md:p-6" @click="onPageBlankClick('left', $event)">
              <StampGrid :items="current.left" @select="safeOpenStamp" />
            </div>
            <div class="p-4 md:p-6" @click="onPageBlankClick('right', $event)">
              <StampGrid :items="current.right" @select="safeOpenStamp" />
            </div>
          </div>

          <!-- turn-layer：翻页那张“纸”（不挡点击） -->
          <div v-if="isFlipping" class="absolute inset-0 z-40 pointer-events-none">
            <div class="sheet" :class="direction" @animationend="onFlipEnd">
              <div class="face front">
                <div class="p-4 md:p-6 h-full">
                  <StampGrid :items="sheetFront" />
                </div>
              </div>

              <div class="face back">
                <div class="p-4 md:p-6 h-full">
                  <StampGrid :items="sheetBack" />
                </div>
              </div>

              <div class="shadow"></div>
            </div>
          </div>

          <!-- ✅ 左/右大箭头：中间偏左 / 中间偏右 -->
          <button
            class="nav-arrow nav-left"
            :disabled="isFlipping || !hasPrev"
            @click.stop="flipPrev"
            aria-label="Previous page"
            title="向前翻一页"
          >
            ❮
          </button>

          <button
            class="nav-arrow nav-right"
            :disabled="isFlipping || !hasNext"
            @click.stop="flipNext"
            aria-label="Next page"
            title="向后翻一页"
          >
            ❯
          </button>

          <!-- ✅ 右下角页码 -->
          <div class="page-indicator">
            {{ pageLabel }}
          </div>
        </div>
      </div>

      <!-- Modal：点击邮票弹窗（保留） -->
      <Transition name="modal">
        <div v-if="selectedStamp" class="modal-overlay" @click.self="closeStamp">
          <div class="modal-content">
            <button class="modal-close" @click="closeStamp" aria-label="Close">✕</button>

            <div class="modal-body">
              <div class="modal-img-wrap">
                <img
                  v-if="selectedStamp.imageUrl"
                  :src="selectedStamp.imageUrl"
                  class="modal-img"
                  :class="{ 'grayscale opacity-70': !selectedStamp.isCollected }"
                />
                <div v-else class="modal-missing">
                  <span v-if="selectedStamp.isCollected">?</span>
                  <span v-else>🔒</span>
                </div>
              </div>

              <div class="modal-text">
                <h2 class="text-xl font-bold mb-2">{{ selectedStamp.title }}</h2>

                <p class="text-sm opacity-80 mb-3">
                  <span v-if="selectedStamp.isCollected">已收录</span>
                  <span v-else>未解锁</span>
                  <span v-if="selectedStamp.collectedAt"> · {{ selectedStamp.collectedAt }}</span>
                </p>

                <div class="modal-desc" v-if="selectedStamp.description" v-html="selectedStamp.description"></div>
                <p class="text-sm opacity-70" v-else>暂无描述。</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style>
/* ===== 书本视角（让翻页更立体）===== */
.book-shell {
  width: min(1200px, 96vw);
  perspective: 1400px;
}

/* ===== 翻页动画（手撕版，无依赖）===== */
.sheet {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  transform-style: preserve-3d;
}

.sheet.next {
  left: 50%;
  transform-origin: left center;
  animation: flip-next 520ms ease-in-out forwards;
}

.sheet.prev {
  left: 0%;
  transform-origin: right center;
  animation: flip-prev 520ms ease-in-out forwards;
}
.face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  border-radius: 18px;
  overflow: hidden;

  /* ✅ 跟书本底色一致（Tailwind amber-50 ≈ #FFFBEB） */
  background: #fffbeb;

  /* 可选：略微加一点边界，让翻页更像“纸” */
  border: 1px solid rgba(120, 53, 15, 0.10);
}

/* ✅ 给翻页“纸张”加同款纹理，但不影响内部内容透明度 */
.face::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("https://www.transparenttextures.com/patterns/cream-paper.png");
  opacity: 0.40;
  pointer-events: none;
  z-index: 0;
}

/* ✅ 保证内容在纹理之上 */
.face > * {
  position: relative;
  z-index: 1;
}

.face.back {
  transform: rotateY(180deg);
}

.shadow {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.18), transparent 55%);
  opacity: 0;
  animation: shadow-pulse 520ms ease-in-out forwards;
}

@keyframes flip-next {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(-180deg); }
}
@keyframes flip-prev {
  from { transform: rotateY(0deg); }
  to   { transform: rotateY(180deg); }
}
@keyframes shadow-pulse {
  0%   { opacity: 0.05; }
  50%  { opacity: 0.25; }
  100% { opacity: 0.08; }
}

/* ===== 显眼箭头：中间偏左/偏右 ===== */
.nav-arrow {
  position: absolute;
  top: 80%;
  transform: translateY(-50%);
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(120, 53, 15, 0.25);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
  display: grid;
  place-items: center;
  font-size: 34px;
  line-height: 1;
  color: rgba(120, 53, 15, 0.92);
  z-index: 60;
  cursor: pointer;
  transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
  user-select: none;
}

.nav-left {
  left: calc(50% - 140px); /* ✅ 中间偏左 */
}

.nav-right {
  right: calc(50% - 140px); /* ✅ 中间偏右 */
}

.nav-arrow:hover:not(:disabled) {
  transform: translateY(-50%) scale(1.04);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.22);
}

.nav-arrow:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.10);
}

/* ===== 右下角页码 ===== */
.page-indicator {
  position: absolute;
  right: 14px;
  bottom: 12px;
  z-index: 55;
  padding: 6px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(120, 53, 15, 0.18);
  font-size: 13px;
  color: rgba(120, 53, 15, 0.9);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.10);
  user-select: none;
}

/* ===== 邮票卡片样式（供 closest('.stamp-card') 判断）===== */
.stamp-card {
  cursor: pointer;
  user-select: none;
}

.stamp-inner {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(120, 53, 15, 0.15);
  aspect-ratio: 4 / 5;
}

.stamp-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1);
  transition: transform 200ms ease;
}

.stamp-card:hover .stamp-img {
  transform: scale(1.03);
}

.missing-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 2rem;
  color: rgba(120, 53, 15, 0.55);
}

.stamp-title {
  margin-top: 6px;
  font-size: 0.875rem;
  line-height: 1.2;
  opacity: 0.9;
}

/* ===== Modal（简洁版）===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  z-index: 999;
  padding: 18px;
}

.modal-content {
  width: min(980px, 96vw);
  background: #fffaf0;
  border-radius: 18px;
  border: 1px solid rgba(120, 53, 15, 0.22);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
}

.modal-close {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(120, 53, 15, 0.2);
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

.modal-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  padding: 18px;
}

@media (min-width: 900px) {
  .modal-body {
    grid-template-columns: 420px 1fr;
    gap: 18px;
    padding: 22px;
  }
}

.modal-img-wrap {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(120, 53, 15, 0.15);
  background: #fff;
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
}

.modal-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-missing {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 3rem;
  color: rgba(120, 53, 15, 0.55);
}

.modal-desc {
  font-size: 0.95rem;
  line-height: 1.7;
  opacity: 0.9;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 160ms ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
