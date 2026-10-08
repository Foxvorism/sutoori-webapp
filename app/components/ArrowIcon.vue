<script setup lang="ts">
const { direction = "up-right" } = defineProps<{
  direction?: "up-right" | "right" | "down" | "left" | "up";
}>();
const rotations = { "up-right": -45, right: 0, down: 90, left: 180, up: -90 };
</script>
<template>
  <svg class="arrow-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M4 12h16m-7-7 7 7-7 7" :transform="`rotate(${rotations[direction]} 12 12)`" />
  </svg>
</template>
<style scoped>
.arrow-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  vertical-align: -0.125em;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
