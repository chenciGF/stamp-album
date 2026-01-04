<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
  gridStyle: { type: Object, default: () => ({}) },
});
const emit = defineEmits(["select"]);

// 仅用于左上角彩色点：1~7 彩虹色（你数据没给也没关系，用 id fallback）
const RAINBOW = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#06b6d4",
  6: "#3b82f6",
  7: "#a855f7",
};

function getColorIndex(stamp) {
  const raw = stamp?.colorIndex ?? stamp?.colorId ?? stamp?.color ?? null;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1 && n <= 7) return n;
  const id = Number(stamp?.id ?? 1);
  return ((id - 1) % 7) + 1;
}

function hexOf(i) {
  return RAINBOW[i] ?? RAINBOW[1];
}
</script>

<template>
  <div class="stamp-grid" :style="props.gridStyle">
    <div
      v-for="stamp in props.items"
      :key="stamp.id ?? stamp.title"
      class="stamp-card"
      @click="emit('select', stamp)"
    >
      <!-- 卡牌本体 -->
      <div
        class="stamp-inner"
        :style="{ '--edge': hexOf(getColorIndex(stamp)) }"
      >
        <img
          v-if="stamp.imageUrl"
          :src="stamp.imageUrl"
          class="stamp-img"
          :class="{ 'grayscale opacity-70': !stamp.isCollected }"
          alt=""
        />
        <div v-else class="missing-placeholder">?</div>

        <!-- 轻微色调贴膜（不属于“框”，保留） -->
        <div class="tone"></div>

        <!-- ✅ 只保留左上角：白框 + 彩色圆点 -->
        <div class="corner" aria-hidden="true">
          <span class="dot"></span>
        </div>

        <!-- ✅ 锁：保留 -->
        <div v-if="stamp.isCollected === false" class="lock">🔒</div>
      </div>

      <!-- ✅ 标题移到卡牌下面：居中、不重叠 -->
      <div class="stamp-title" :title="stamp.title">
        {{ stamp.title }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 网格：固定像素列宽，保持像素级 5:7 卡牌不被拉伸 */
.stamp-grid{
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--card-w));
  gap: var(--gap);
  justify-content: center;
  align-content: start;
}

/* ✅ 卡片整体：竖向排版（卡 + 标题） */
.stamp-card{
  user-select: none;
  cursor: pointer;
  width: var(--card-w);
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 卡牌本体：由 App 传入 --card-w/--card-h，确保 5:7 像素级 */
.stamp-inner{
  width: var(--card-w);
  height: var(--card-h);
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 251, 235, 0.85);
  border: 1px solid rgba(0,0,0,0.10);
  box-shadow: 0 10px 26px rgba(0,0,0,0.10);
}

.stamp-img{
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1);
  transition: transform 180ms ease;
}

.stamp-card:hover .stamp-img{
  transform: scale(1.03);
}

.missing-placeholder{
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 34px;
  color: rgba(46,49,62,0.55);
}

/* 色调贴膜：非常轻 */
.tone{
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 90% at 20% 10%,
      color-mix(in srgb, var(--edge) 20%, transparent),
      transparent 55%),
    linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.14));
  mix-blend-mode: multiply;
  opacity: 0.35;
  pointer-events: none;
}

/* ✅ 左上角极简角标：白框 + 彩色点（无文字） */
.corner{
  position: absolute;
  left: 8px;
  top: 8px;
  padding: 5px 7px;
  border-radius: 999px;
  background: rgba(255,255,255,0.85);
  border: 1px solid rgba(0,0,0,0.10);
  box-shadow: 0 8px 18px rgba(0,0,0,0.10);
  pointer-events: none;
}

.dot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: block;
  background: var(--edge);
}

/* ✅ 锁：保留 */
.lock{
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 34px;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 10px 28px rgba(0,0,0,0.55);
  background: rgba(0,0,0,0.20);
}

/* ✅ 标题在卡下方：居中、固定高度、防溢出、防重叠 */
.stamp-title{
  margin-top: 8px;
  width: 100%;
  height: 36px;              /* 固定高度：避免上下卡标题挤压 */
  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(0,0,0,0.10);
  box-shadow: 0 10px 22px rgba(0,0,0,0.08);

  font-size: 13px;
  font-weight: 800;
  color: rgba(46,49,62,0.92);

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
