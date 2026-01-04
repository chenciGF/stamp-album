<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
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

// ===== 动态布局：根据页面实际尺寸决定 cols/rows -> stampsPerPage =====
const pageMeasureEl = ref(null);

// 你可以微调：最小卡宽（越小越能塞多）
const MIN_CARD_W = 70;
const MAX_COLS = 4;

const layout = ref({
  cols: 2,
  rows: 2,
  cardW: 100,
  cardH: 140,
  gap: 12,
});

// ✅ 每“单页”显示多少枚卡（动态决定）
const stampsPerPage = ref(2);

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/**
 * 像素级 5:7：
 * - cardW 强制为 5 的倍数 -> cardH = cardW/5*7 是整数像素
 */
function computeLayout(pageW, pageH) {
  const gap = pageW < 380 ? 10 : 12;

  let cols = Math.floor((pageW + gap) / (Math.max(MIN_CARD_W, 1) + gap));
  cols = clamp(cols, 1, MAX_COLS);

  let cardW = Math.floor((pageW - gap * (cols - 1)) / cols);
  cardW = Math.max(cardW, MIN_CARD_W);
  cardW = Math.floor(cardW / 5) * 5; // ✅ 像素比例关键
  if (cardW < 50) cardW = 50;

  const cardH = (cardW * 7) / 5;

  let rows = Math.floor((pageH + gap) / (cardH + gap));
  rows = clamp(rows, 1, pageW < 380 ? 3 : 4);

  return { cols, rows, cardW, cardH, gap };
}

let ro;
const refreshLayout = () => {
  const el = pageMeasureEl.value;
  if (!el) return;

  const w = el.clientWidth;
  const h = el.clientHeight;

  const nextLayout = computeLayout(w, h);
  layout.value = nextLayout;

  const nextPerPage = nextLayout.cols * nextLayout.rows;
  if (nextPerPage !== stampsPerPage.value) stampsPerPage.value = nextPerPage;
};

onMounted(() => {
  refreshLayout();
  ro = new ResizeObserver(() => refreshLayout());
  if (pageMeasureEl.value) ro.observe(pageMeasureEl.value);
  window.addEventListener("resize", refreshLayout, { passive: true });
});

onBeforeUnmount(() => {
  ro?.disconnect?.();
  window.removeEventListener("resize", refreshLayout);
});

const gridStyle = computed(() => ({
  "--cols": layout.value.cols,
  "--card-w": `${layout.value.cardW}px`,
  "--card-h": `${layout.value.cardH}px`,
  "--gap": `${layout.value.gap}px`,
}));

// ===== 分页/翻页 =====
const spreadIndex = ref(0);
const isFlipping = ref(false);
const direction = ref(null); // 'next' | 'prev'

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

// 数据变化防止越界
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
const COOLDOWN_MS = 850;

const lastBlankLeft = ref(0);
const lastBlankRight = ref(0);
const cooldownLeftUntil = ref(0);
const cooldownRightUntil = ref(0);

function isClickOnStamp(e) {
  return !!e.target?.closest?.(".stamp-card");
}

function onPageBlankClick(side, e) {
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
  }
}

// ===== 页码 =====
const totalPages = computed(() => pages.value.length);
const pageLabel = computed(() => {
  const total = totalPages.value;
  if (!total) return "第 0 页 / 共 0 页";

  const leftNo = spreadIndex.value * 2 + 1;
  const rightNo = Math.min(leftNo + 1, total);

  if (rightNo === leftNo) return `第 ${leftNo} 页 / 共 ${total} 页`;
  return `第 ${leftNo}-${rightNo} 页 / 共 ${total} 页`;
});
</script>

<template>
  <div class="min-h-screen app-bg">
    <div class="max-w-7xl mx-auto px-4 py-6 text-slate-100">
      <div class="flex items-end justify-between gap-4 mb-4">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold tracking-tight">Stamp Album</h1>
          <p class="text-sm opacity-80 mt-1">点卡看详情 · 空白处双击翻页</p>
        </div>
        <div class="text-xs opacity-70">
          自动排版：{{ layout.cols }}×{{ layout.rows }} / 单页 {{ stampsPerPage }}
        </div>
      </div>

      <div class="book-shell relative mx-auto">
        <div class="book-cover">
          <div class="book-pages text-amber-950">
            <div class="absolute inset-0 page-texture pointer-events-none z-0"></div>

            <!-- underlay -->
            <div class="absolute inset-0 grid grid-cols-2 z-10">
              <div ref="pageMeasureEl" class="p-4 md:p-6">
                <StampGrid :items="underLeft" :gridStyle="gridStyle" @select="safeOpenStamp" />
              </div>
              <div class="p-4 md:p-6">
                <StampGrid :items="underRight" :gridStyle="gridStyle" @select="safeOpenStamp" />
              </div>
            </div>

            <!-- 书脊 -->
            <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0 z-30 pointer-events-none">
              <div class="absolute inset-y-0 -left-4 w-8 bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
              <div class="absolute inset-y-0 left-0 w-[1px] bg-black/10"></div>
            </div>

            <!-- current -->
            <div v-if="!isFlipping" class="absolute inset-0 grid grid-cols-2 z-20">
              <div class="p-4 md:p-6" @click="onPageBlankClick('left', $event)">
                <StampGrid :items="current.left" :gridStyle="gridStyle" @select="safeOpenStamp" />
              </div>
              <div class="p-4 md:p-6" @click="onPageBlankClick('right', $event)">
                <StampGrid :items="current.right" :gridStyle="gridStyle" @select="safeOpenStamp" />
              </div>
            </div>

            <!-- turn-layer -->
            <div v-if="isFlipping" class="absolute inset-0 z-40 pointer-events-none">
              <div class="sheet" :class="direction" @animationend="onFlipEnd">
                <div class="face front">
                  <div class="p-4 md:p-6 h-full">
                    <StampGrid :items="sheetFront" :gridStyle="gridStyle" />
                  </div>
                </div>

                <div class="face back">
                  <div class="p-4 md:p-6 h-full">
                    <StampGrid :items="sheetBack" :gridStyle="gridStyle" />
                  </div>
                </div>

                <div class="shadow"></div>
              </div>
            </div>

            <!-- arrows -->
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

            <!-- page label -->
            <div class="page-indicator">{{ pageLabel }}</div>
          </div>
        </div>
      </div>

      <!-- Modal -->
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
:root{
  --cover: rgb(46,49,62);
  --cover-hi: rgb(60,64,82);
  --paper: #fffbeb;

  /* ✅ 原来的“棕色边框感” */
  --brown: #78350f;
}

.app-bg{
  background:
    radial-gradient(1200px 700px at 30% 0%, rgba(255,255,255,0.06), transparent 60%),
    radial-gradient(900px 600px at 85% 25%, rgba(255,255,255,0.05), transparent 65%),
    linear-gradient(180deg, var(--cover-hi), var(--cover));
}

.book-shell {
  width: min(1200px, 96vw);
  perspective: 1400px;
}

.book-cover{
  width: 100%;
  height: 82vh;
  background: var(--cover);
  border-radius: 22px;
  box-shadow: 0 28px 90px rgba(0,0,0,0.45);
  padding: 10px;
  position: relative;
}

/* ✅ 只改这一处：内页边框恢复棕色粗边 */
.book-pages{
  width: 100%;
  height: 100%;
  background: var(--paper);
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  border: 8px solid var(--brown);
}

.page-texture{
  background-image: url("https://www.transparenttextures.com/patterns/cream-paper.png");
  opacity: 0.35;
}

/* ===== 翻页动画（保持你现有）===== */
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
  background: var(--paper);
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.face::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("https://www.transparenttextures.com/patterns/cream-paper.png");
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
}
.face > * { position: relative; z-index: 1; }
.face.back { transform: rotateY(180deg); }

.shadow {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: linear-gradient(to left, rgba(0, 0, 0, 0.18), transparent 55%);
  opacity: 0;
  animation: shadow-pulse 520ms ease-in-out forwards;
}

@keyframes flip-next { from { transform: rotateY(0deg); } to { transform: rotateY(-180deg); } }
@keyframes flip-prev { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
@keyframes shadow-pulse { 0% { opacity: 0.05; } 50% { opacity: 0.25; } 100% { opacity: 0.08; } }

/* arrows */
.nav-arrow {
  position: absolute;
  top: 80%;
  transform: translateY(-50%);
  width: 64px;
  height: 64px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
  display: grid;
  place-items: center;
  font-size: 34px;
  line-height: 1;
  color: rgba(46, 49, 62, 0.95);
  z-index: 60;
  cursor: pointer;
  transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
  user-select: none;
}
.nav-left { left: calc(50% - 140px); }
.nav-right { right: calc(50% - 140px); }
.nav-arrow:hover:not(:disabled) { transform: translateY(-50%) scale(1.04); background: rgba(255, 255, 255, 0.95); }
.nav-arrow:disabled { opacity: 0.35; cursor: not-allowed; }

/* page label */
.page-indicator {
  position: absolute;
  right: 14px;
  bottom: 12px;
  z-index: 55;
  padding: 6px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(0, 0, 0, 0.10);
  font-size: 13px;
  color: rgba(46, 49, 62, 0.92);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.10);
  user-select: none;
}

/* ===== Modal：只改字体颜色恢复黑色（不改布局）===== */
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
  border: 1px solid rgba(0, 0, 0, 0.10);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;

  /* ✅ 强制弹窗文字为黑色 */
  color: #111827;
}

.modal-close {
  position: absolute;
  right: 12px;
  top: 12px;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.10);
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
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
}

.modal-img { width: 100%; height: 100%; object-fit: cover; }
.modal-missing { width: 100%; height: 100%; display: grid; place-items: center; font-size: 3rem; color: rgba(46,49,62,0.55); }
.modal-desc { font-size: 0.95rem; line-height: 1.7; opacity: 0.9; }

.modal-enter-active,
.modal-leave-active { transition: opacity 160ms ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
</style>
