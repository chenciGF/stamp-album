<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
});
const emit = defineEmits(["select"]);
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
    <div
      v-for="stamp in props.items"
      :key="stamp.id"
      class="stamp-card group"
      @click="emit('select', stamp)"
    >
      <div class="stamp-inner">
        <img
          v-if="stamp.imageUrl"
          :src="stamp.imageUrl"
          class="stamp-img"
          :class="{ 'grayscale opacity-60': !stamp.isCollected }"
        />
        <div v-else class="missing-placeholder">
          <span>?</span>
        </div>
      </div>
      <p class="stamp-title">{{ stamp.title }}</p>
    </div>
  </div>
</template>
