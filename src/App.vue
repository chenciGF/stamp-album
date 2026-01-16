<script setup>
  import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
  import { stampsData } from "./data/stamps";
  import StampGrid from "./components/StampGrid.vue";
  
  const stamps = ref(stampsData);
    // ===== 设置（右上角齿轮）=====
  // ✅ 仅控制“显隐”，不参与重排（占位高度固定，避免翻页乱序）
  const showAcquiredDate = ref(true);
  const settingsOpen = ref(false);
  const settingsEl = ref(null);

  const toggleSettings = () => { settingsOpen.value = !settingsOpen.value; };
  const closeSettings = () => { settingsOpen.value = false; };

  function formatDateYMD(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = String(dateStr).split("-");
    if (!y || !m || !d) return String(dateStr);
    return `${y}年${Number(m)}月${Number(d)}日`;
  }

  function onDocPointerDown(e) {
    if (!settingsOpen.value) return;
    const root = settingsEl.value;
    if (!root) return;
    if (root.contains(e.target)) return;
    closeSettings();
  }
  // ===== 弹窗逻辑（保留）=====
  const selectedStamp = ref(null);
  const openStamp = (stamp) => { selectedStamp.value = stamp; };
  const closeStamp = () => { selectedStamp.value = null; };
  
  // ===== 动态布局（保留）=====
  const pageMeasureEl = ref(null);
  const MIN_CARD_W = 70;
  const MAX_COLS = 4;
  
  const layout = ref({
    cols: 2,
    rows: 2,
    cardW: 100,
    cardH: 140,
    gap: 12,
    metaLineH: 14,
    metaGap: 8,
    metaH: 58,
    padOuter: 24,               // ✅ 外侧安全边距（靠书边）
    padInner: 44,               // ✅ 内侧安全边距（靠书脊/中线）
    justify: "space-between",   // ✅ 行内尽量均分
  });
  
  const stampsPerPage = ref(2);
  
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  
  // 让 gap 落在偶数像素，视觉更稳
  function roundToEvenPx(x) {
    return Math.round(x / 2) * 2;
  }
  
  function computeLayout(pageW, pageH) {
    // ✅ 更松弛：沿用 0.16
    const GAP_RATIO = 0.16;
    const GAP_MIN = 16;
    const GAP_MAX = 32;
  
    // ✅ 外侧/内侧（书脊）安全边距：外侧较小、内侧较大
    const OUTER_MIN = pageW < 420 ? 18 : 24;
    const OUTER_MAX = pageW < 420 ? 34 : 56;
    const INNER_MIN = pageW < 420 ? 30 : 44;
    const INNER_MAX = pageW < 420 ? 56 : 86;
  
    let cols = MAX_COLS;
    let gap = GAP_MIN;
    let padOuter = OUTER_MIN;
    let padInner = INNER_MIN;
  
    // 逐列尝试：放不下就少一列（自然“下一行”）
    while (cols > 1) {
      // 先用最小边距/最小 gap 做可行性快速判断
      const availW0 = pageW - OUTER_MIN - INNER_MIN;
      const w0 = Math.floor((availW0 - GAP_MIN * (cols - 1)) / cols);
      if (w0 < MIN_CARD_W) {
        cols -= 1;
        continue;
      }
  
      // 先估 cardW（后续会收敛到 5 的倍数）
      let cardW = Math.floor((availW0 - GAP_MIN * (cols - 1)) / cols);
      cardW = Math.max(cardW, MIN_CARD_W);
      cardW = Math.floor(cardW / 5) * 5;
  
      // gap：跟随 cardW，带护栏，且取偶数像素
      gap = clamp(roundToEvenPx(cardW * GAP_RATIO), GAP_MIN, GAP_MAX);
  
      // 外侧边距：略大于 gap，像书页留白
      padOuter = clamp(roundToEvenPx(Math.max(OUTER_MIN, gap * 1.10)), OUTER_MIN, OUTER_MAX);
  
      // 内侧边距（书脊/中线）：
      // 1) >= 外侧 + 10（形成明显“书脊留白”）
      // 2) >= gap * 1.8（让卡牌别贴中线）
      // 3) >= INNER_MIN（小屏兜底）
      padInner = clamp(
        roundToEvenPx(Math.max(INNER_MIN, padOuter + 10, gap * 1.8)),
        INNER_MIN,
        INNER_MAX
      );
  
      // 用最终 padOuter/padInner/gap 再算一次是否仍能放下
      const availW = pageW - padOuter - padInner;
      const w1 = Math.floor((availW - gap * (cols - 1)) / cols);
      if (w1 < MIN_CARD_W) {
        cols -= 1;
        continue;
      }
  
      // 收敛卡宽：像素级稳定（5 的倍数）
      cardW = Math.floor(w1 / 5) * 5;
      if (cardW < 50) cardW = 50;
      const cardH = (cardW * 7) / 5;

      // ✅ 固定“文字占位”：标题两行 + 时间一行（开关只做显隐，不触发布局重排）
      const metaLineH = clamp(roundToEvenPx(cardW * 0.16), 12, 16);
      const metaGap = 8;
      const metaH = metaLineH * 3 + 16; // 3 行 + 内边距/边框余量
      const cardTotalH = cardH + metaGap + metaH;

      // 行数：row-gap 用同一个 gap，保持纵向统一
      let rows = Math.floor((pageH + gap) / (cardTotalH + gap));
      rows = clamp(rows, 1, pageW < 380 ? 3 : 4);

      return {
        cols,
        rows,
        cardW,
        cardH,
        metaLineH,
        metaGap,
        metaH,
        gap,
        padOuter,
        padInner,
        justify: cols === 1 ? "center" : "space-between",
      };
    }
  
    // cols == 1 的兜底（手机/极窄情况）
    padOuter = clamp(roundToEvenPx(OUTER_MIN), OUTER_MIN, OUTER_MAX);
    padInner = clamp(roundToEvenPx(Math.max(INNER_MIN, padOuter + 12)), INNER_MIN, INNER_MAX);
  
    const availW = Math.max(50, pageW - padOuter - padInner);
    let cardW = Math.floor(availW / 5) * 5;
    cardW = Math.max(cardW, 50);
    const cardH = (cardW * 7) / 5;
    gap = clamp(roundToEvenPx(cardW * GAP_RATIO), GAP_MIN, GAP_MAX);

    // ✅ 固定“文字占位”：标题两行 + 时间一行（开关只做显隐，不触发布局重排）
    const metaLineH = clamp(roundToEvenPx(cardW * 0.16), 12, 16);
    const metaGap = 8;
    const metaH = metaLineH * 3 + 16; // 3 行 + 内边距/边框余量
    const cardTotalH = cardH + metaGap + metaH;

    let rows = Math.floor((pageH + gap) / (cardTotalH + gap));
    rows = clamp(rows, 1, pageW < 380 ? 3 : 4);

    return { cols: 1, rows, cardW, cardH, metaLineH, metaGap, metaH, gap, padOuter, padInner, justify: "center" };

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
    document.addEventListener("pointerdown", onDocPointerDown);
    if (pageMeasureEl.value) ro.observe(pageMeasureEl.value);
    window.addEventListener("resize", refreshLayout, { passive: true });
  });
  
  onBeforeUnmount(() => {
    ro?.disconnect?.();
    document.removeEventListener("pointerdown", onDocPointerDown);
    window.removeEventListener("resize", refreshLayout);
  });
  
  const gridStyle = computed(() => ({
    "--cols": layout.value.cols,
    "--card-w": `${layout.value.cardW}px`,
    "--card-h": `${layout.value.cardH}px`,
    "--gap": `${layout.value.gap}px`,
    "--meta-line-h": `${layout.value.metaLineH}px`,
    "--meta-gap": `${layout.value.metaGap}px`,
    "--meta-h": `${layout.value.metaH}px`,
  }));
  
  // ✅ 左/右页：外侧/内侧 padding 不同（中线当“页面边框”处理）
  const leftGridStyle = computed(() => ({
    ...gridStyle.value,
    "--pad-left": `${layout.value.padOuter}px`,
    "--pad-right": `${layout.value.padInner}px`,
    "--justify": layout.value.justify,
  }));
  
  const rightGridStyle = computed(() => ({
    ...gridStyle.value,
    "--pad-left": `${layout.value.padInner}px`,
    "--pad-right": `${layout.value.padOuter}px`,
    "--justify": layout.value.justify,
  }));
  
  // ===== 分页/翻页（保留）=====
  const spreadIndex = ref(0);
  const isFlipping = ref(false);
  const direction = ref(null);
  
  // 翻页层里的那一张“纸”：根据方向决定它属于左页还是右页
  const sheetGridStyle = computed(() => (direction.value === "next" ? rightGridStyle.value : leftGridStyle.value));
  
  // 供 CSS 放置翻页按钮：把内侧留白（书脊 gutter）暴露为变量
  const bookVars = computed(() => ({
    "--inner-pad": `${layout.value.padInner}px`,
  }));
  
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
      out.push({ left: pages.value[i] ?? [], right: pages.value[i + 1] ?? [] });
    }
    return out;
  });
  
  const current = computed(() => spreads.value[spreadIndex.value] ?? { left: [], right: [] });
  const next = computed(() => spreads.value[spreadIndex.value + 1] ?? null);
  const prev = computed(() => spreads.value[spreadIndex.value - 1] ?? null);
  
  const hasNext = computed(() => !!next.value);
  const hasPrev = computed(() => !!prev.value);
  
  watch(
    spreads,
    () => {
      const max = Math.max(0, spreads.value.length - 1);
      if (spreadIndex.value > max) spreadIndex.value = max;
    },
    { immediate: true }
  );
  
  const underLeft = computed(() => {
    if (!isFlipping.value) return current.value.left;
    return direction.value === "prev" ? (prev.value?.left ?? []) : current.value.left;
  });
  const underRight = computed(() => {
    if (!isFlipping.value) return current.value.right;
    return direction.value === "next" ? (next.value?.right ?? []) : current.value.right;
  });
  
  const sheetFront = computed(() => (direction.value === "next" ? current.value.right : current.value.left));
  const sheetBack = computed(() =>
    direction.value === "next" ? (next.value?.left ?? []) : (prev.value?.right ?? [])
  );
  
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
  
  // ===== 空白处双击（保留）=====
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
  
  // ===== 页码（保留）=====
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
          <div class="flex items-center gap-3">
  <div class="text-xs opacity-70 whitespace-nowrap">
    自动排版：{{ layout.cols }}×{{ layout.rows }} / 单页 {{ stampsPerPage }}
  </div>

  <div ref="settingsEl" class="relative">
    <button class="tool-icon-btn" @click.stop="toggleSettings" title="设置" aria-label="Settings">⚙️</button>

    <div v-if="settingsOpen" class="tool-menu" @click.stop>
      <div class="tool-menu-title">设置</div>

      <label class="tool-row">
        <span class="tool-row-icon">🕒</span>
        <span class="tool-row-text">显示获得时间</span>
        <input class="tool-toggle" type="checkbox" v-model="showAcquiredDate" />
      </label>
    </div>
  </div>
</div>

        </div>
  
        <div class="book-shell relative mx-auto">
          <div class="book-cover">
            <div class="book-pages text-amber-950" :style="bookVars">
              <div class="absolute inset-0 page-texture pointer-events-none z-0"></div>
  
              <div class="absolute inset-0 grid grid-cols-2 z-10">
                <div class="p-4 md:p-6">
                  <div ref="pageMeasureEl" class="h-full w-full">
                    <StampGrid :items="underLeft" :gridStyle="leftGridStyle" :showAcquiredDate="showAcquiredDate" @select="safeOpenStamp" />
                  </div>
                </div>
                <div class="p-4 md:p-6">
                  <StampGrid :items="underRight" :gridStyle="rightGridStyle":showAcquiredDate="showAcquiredDate" @select="safeOpenStamp" />
                </div>
              </div>
  
              <div class="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0 z-30 pointer-events-none">
                <div class="absolute inset-y-0 -left-4 w-8 bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
                <div class="absolute inset-y-0 left-0 w-[1px] bg-black/10"></div>
              </div>
  
              <div v-if="!isFlipping" class="absolute inset-0 grid grid-cols-2 z-20">
                <div class="p-4 md:p-6" @click="onPageBlankClick('left', $event)">
                  <StampGrid :items="current.left" :gridStyle="leftGridStyle":showAcquiredDate="showAcquiredDate" @select="safeOpenStamp" />
                </div>
                <div class="p-4 md:p-6" @click="onPageBlankClick('right', $event)">
                  <StampGrid :items="current.right" :gridStyle="rightGridStyle":showAcquiredDate="showAcquiredDate" @select="safeOpenStamp" />
                </div>
              </div>
  
              <div v-if="isFlipping" class="absolute inset-0 z-40 pointer-events-none">
                <div class="sheet" :class="direction" @animationend="onFlipEnd">
                  <div class="face front">
                    <div class="p-4 md:p-6 h-full">
                      <StampGrid :items="sheetFront":showAcquiredDate="showAcquiredDate" :gridStyle="sheetGridStyle" />
                    </div>
                  </div>
                  <div class="face back">
                    <div class="p-4 md:p-6 h-full">
                      <StampGrid :items="sheetBack":showAcquiredDate="showAcquiredDate" :gridStyle="sheetGridStyle" />
                    </div>
                  </div>
                  <div class="shadow"></div>
                </div>
              </div>
  
              <button class="nav-arrow nav-left" :disabled="isFlipping || !hasPrev" @click.stop="flipPrev" title="向前翻一页">❮</button>
              <button class="nav-arrow nav-right" :disabled="isFlipping || !hasNext" @click.stop="flipNext" title="向后翻一页">❯</button>
  
              <div class="page-indicator">{{ pageLabel }}</div>
            </div>
          </div>
        </div>
  
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
                    <span v-if="selectedStamp.acquiredDate"> · {{ formatDateYMD(selectedStamp.acquiredDate) }}</span>
                  </p>
                  <div class="modal-desc" v-if="selectedStamp.desc" v-html="selectedStamp.desc"></div>
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
    background: transparent;
    padding: 0;
    border-radius: 22px;
    box-shadow: none;
    position: relative;
  }
  
  .book-pages{
    width: 100%;
    height: 100%;
    background: var(--paper);
    border-radius: 18px;
    overflow: hidden;
    position: relative;
    border: 8px solid var(--brown);
    box-shadow: 0 28px 90px rgba(0,0,0,0.45);
  }
  
  .page-texture{
    background-image: url("https://www.transparenttextures.com/patterns/cream-paper.png");
    opacity: 0.35;
  }
  
  /* 翻页动画（保持） */
  .sheet { position:absolute; top:0; bottom:0; width:50%; transform-style:preserve-3d; }
  .sheet.next { left:50%; transform-origin:left center; animation: flip-next 520ms ease-in-out forwards; }
  .sheet.prev { left:0%; transform-origin:right center; animation: flip-prev 520ms ease-in-out forwards; }
  
  .face { position:absolute; inset:0; backface-visibility:hidden; border-radius:18px; overflow:hidden; background: var(--paper); border:1px solid rgba(0,0,0,0.06); }
  .face::before { content:""; position:absolute; inset:0; background-image:url("https://www.transparenttextures.com/patterns/cream-paper.png"); opacity:0.35; pointer-events:none; z-index:0; }
  .face > * { position:relative; z-index:1; }
  .face.back { transform: rotateY(180deg); }
  
  .shadow { position:absolute; inset:0; border-radius:18px; background: linear-gradient(to left, rgba(0,0,0,0.18), transparent 55%); opacity:0; animation: shadow-pulse 520ms ease-in-out forwards; }
  
  @keyframes flip-next { from { transform: rotateY(0deg); } to { transform: rotateY(-180deg); } }
  @keyframes flip-prev { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
  @keyframes shadow-pulse { 0%{opacity:0.05;} 50%{opacity:0.25;} 100%{opacity:0.08;} }
  
  /* ✅ 翻页按钮：放进“书脊留白”里，避免与卡牌重合 */
  .nav-arrow {
    position: absolute;
    bottom: clamp(44px, 9vh, 84px);
    transform: translateX(-50%);
    --arrow-size: clamp(44px, 6vw, 56px);
    width: var(--arrow-size);
    height: var(--arrow-size);
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.88);
    border: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
    display: grid;
    place-items: center;
    font-size: calc(var(--arrow-size) * 0.54);
    line-height: 1;
    color: rgba(46, 49, 62, 0.95);
    z-index: 60;
    cursor: pointer;
    transition: transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
    user-select: none;
  }
  .nav-left  { left: calc(50% - (var(--inner-pad) / 2)); }
  .nav-right { left: calc(50% + (var(--inner-pad) / 2)); }
  .nav-arrow:hover:not(:disabled) { transform: translateX(-50%) translateY(-2px) scale(1.03); background: rgba(255, 255, 255, 0.95); }
  .nav-arrow:disabled { opacity: 0.35; cursor: not-allowed; }
  
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
  .tool-icon-btn{
    width: 38px;
    height: 38px;
    border-radius: 9999px;
    background: rgba(255,255,255,0.16);
    border: 1px solid rgba(255,255,255,0.22);
    display: grid;
    place-items: center;
    box-shadow: 0 10px 24px rgba(0,0,0,0.18);
    cursor: pointer;
    user-select: none;
    transition: transform 120ms ease, background 120ms ease;
  }
  .tool-icon-btn:hover{
    transform: translateY(-1px);
    background: rgba(255,255,255,0.22);
  }

  .tool-menu{
    position: absolute;
    right: 0;
    top: calc(100% + 10px);
    width: 220px;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(0,0,0,0.12);
    border-radius: 14px;
    box-shadow: 0 22px 70px rgba(0,0,0,0.22);
    color: rgba(46,49,62,0.95);
    padding: 10px;
    z-index: 120;
    backdrop-filter: blur(10px);
  }
  .tool-menu-title{
    font-size: 12px;
    font-weight: 800;
    opacity: 0.75;
    margin-bottom: 8px;
  }
  .tool-row{
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 8px;
    border-radius: 12px;
    cursor: pointer;
  }
  .tool-row:hover{
    background: rgba(0,0,0,0.04);
  }
  .tool-row-icon{
    width: 20px;
    display: grid;
    place-items: center;
  }
  .tool-row-text{
    flex: 1;
    font-size: 13px;
    font-weight: 700;
  }
  .tool-toggle{
    width: 42px;
    height: 22px;
    accent-color: #f59e0b;
  }
  
  /* 弹窗字体保持黑色（保持） */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: grid; place-items: center; z-index: 999; padding: 18px; }
  .modal-content { width: min(980px, 96vw); background: #fffaf0; border-radius: 18px; border: 1px solid rgba(0,0,0,0.10); box-shadow: 0 24px 80px rgba(0,0,0,0.35); position: relative; overflow: hidden; color: #111827; }
  .modal-close { position: absolute; right: 12px; top: 12px; width: 36px; height: 36px; border-radius: 999px; border: 1px solid rgba(0,0,0,0.10); background: rgba(255,255,255,0.9); cursor: pointer; }
  .modal-body { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 18px; }
  @media (min-width: 900px) { .modal-body { grid-template-columns: 420px 1fr; gap: 18px; padding: 22px; } }
  .modal-img-wrap { border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); background: #fff; aspect-ratio: 4 / 3; display: grid; place-items: center; }
  .modal-img { width: 100%; height: 100%; object-fit: cover; }
  .modal-missing { width: 100%; height: 100%; display: grid; place-items: center; font-size: 3rem; color: rgba(46,49,62,0.55); }
  .modal-desc { font-size: 0.95rem; line-height: 1.7; opacity: 0.9; }
  .modal-enter-active, .modal-leave-active { transition: opacity 160ms ease; }
  .modal-enter-from, .modal-leave-to { opacity: 0; }
  </style>
  