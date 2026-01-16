<script setup>
  const props = defineProps({
    items: { type: Array, default: () => [] },
    gridStyle: { type: Object, default: () => ({}) },
    showAcquiredDate: { type: Boolean, default: true },
  });
  const emit = defineEmits(["select"]);

  // 主题色：提供 hex + rgb（rgb 用来做透明色影，避免 color-mix 兼容问题）
  const RAINBOW = {
    1: { hex: "#ef4444", rgb: "239, 68, 68" },   // 赤
    2: { hex: "#f97316", rgb: "249, 115, 22" }, // 橙
    3: { hex: "#eab308", rgb: "234, 179, 8" },  // 黄
    4: { hex: "#22c55e", rgb: "34, 197, 94" },  // 绿
    5: { hex: "#06b6d4", rgb: "6, 182, 212" },  // 青
    6: { hex: "#3b82f6", rgb: "59, 130, 246" }, // 蓝
    7: { hex: "#a855f7", rgb: "168, 85, 247" }, // 紫
  };

  function getColorIndex(stamp) {
    const raw = stamp?.colorIndex ?? stamp?.colorId ?? stamp?.color ?? null;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1 && n <= 7) return n;
    const id = Number(stamp?.id ?? 1);
    return ((id - 1) % 7) + 1;
  }

  function colorOf(i) {
    return RAINBOW[i] ?? RAINBOW[1];
  }

  function formatDateYMD(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = String(dateStr).split("-");
    if (!y || !m || !d) return String(dateStr);
    return `${y}年${Number(m)}月${Number(d)}日`;
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
      <div
        class="stamp-inner"
        :style="{
          '--edge': colorOf(getColorIndex(stamp)).hex,
          '--edge-rgb': colorOf(getColorIndex(stamp)).rgb,
        }"
      >
        <img
          v-if="stamp.imageUrl"
          :src="stamp.imageUrl"
          class="stamp-img"
          :class="{ 'grayscale opacity-70': !stamp.isCollected }"
          alt=""
        />
        <div v-else class="missing-placeholder">?</div>

        <div class="tone"></div>
        <div v-if="stamp.isCollected === false" class="lock">🔒</div>
      </div>

      <!-- ✅ 固定占位：标题两行 + 日期一行（日期只做显隐，不塌高度） -->
      <div class="stamp-meta">
        <div class="stamp-title" :title="stamp.title">
          {{ stamp.title }}
        </div>

        <div class="stamp-date" :class="{ 'date-hidden': !props.showAcquiredDate }">
          <span v-if="stamp.isCollected && stamp.acquiredDate">
            获得：{{ formatDateYMD(stamp.acquiredDate) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stamp-grid{
  width: 100%;
  box-sizing: border-box;

  display: grid;
  grid-template-columns: repeat(var(--cols), var(--card-w));
  gap: var(--gap);

  /* ✅ 左/右页：外侧/内侧 padding 不同（把中线当“页面边框”） */
  padding-left: var(--pad-left, 0px);
  padding-right: var(--pad-right, 0px);

  /* ✅ 行内尽量均分空白（多列 space-between，单列 center） */
  justify-content: var(--justify);

  align-content: start;
}

.stamp-card{
  user-select: none;
  cursor: pointer;
  width: var(--card-w);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stamp-inner{
  width: var(--card-w);
  height: var(--card-h);
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(255, 251, 235, 0.88);
  border: 1px solid rgba(0,0,0,0.10);
  box-shadow:
    0 0 18px rgba(var(--edge-rgb), 0.16),
    0 10px 26px rgba(0,0,0,0.10);
}
.stamp-inner::after{
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 14px;
  border: 4px solid rgba(var(--edge-rgb), 0.59);
  pointer-events: none;
  z-index: 10;
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

.tone{
  position: absolute;
  inset: 0;
  background:
    radial-gradient(120% 90% at 20% 10%,
      rgba(var(--edge-rgb), 0.10),
      transparent 55%),
    linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.12));
  mix-blend-mode: multiply;
  opacity: 0.35;
  pointer-events: none;
}

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

/* ✅ 文字区：固定高度（由 App.vue 动态计算并通过 CSS 变量传入） */
.stamp-meta{
  margin-top: var(--meta-gap, 8px);
  width: 100%;
  height: var(--meta-h, 58px);
  padding: 6px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(0,0,0,0.10);
  box-shadow: 0 10px 22px rgba(0,0,0,0.08);
  box-sizing: border-box;

  display: grid;
  grid-template-rows: calc(var(--meta-line-h, 14px) * 2) var(--meta-line-h, 14px);
  row-gap: 2px;
}

.stamp-title{
  font-size: calc(var(--meta-line-h, 14px) - 1px);
  font-weight: 800;
  line-height: var(--meta-line-h, 14px);
  color: rgba(46,49,62,0.92);
  text-align: center;

  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;         /* 标准属性：用于兼容/消警告 */
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.stamp-date{
  font-size: calc(var(--meta-line-h, 14px) - 3px);
  font-weight: 700;
  line-height: var(--meta-line-h, 14px);
  color: rgba(46,49,62,0.78);
  text-align: center;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ✅ 关键：隐藏但不塌高度 */
.date-hidden{
  visibility: hidden;
  opacity: 0;
}
</style>
