<script setup lang="ts">
import type { MediaItem } from "../../shared/content";
defineProps<{ item: MediaItem; index?: number; eager?: boolean }>();
defineEmits<{ open: [] }>();
const failed = ref(false);
</script>
<template>
  <button
    class="media-card"
    @click="$emit('open')"
  >
    <span class="media-frame">
      <img
        v-if="!failed"
        :src="item.thumbnail || item.url"
        :srcset="
          item.media_type === 'image' && item.url
            ? `${item.thumbnail} ${Math.min(1024,item.width)}w, ${item.url} ${item.width}w`
            : undefined
        "
        sizes="(max-width: 700px) 94vw, 60vw"
        :alt="item.alt_text"
        :width="item.width"
        :height="item.height"
        :loading="eager ? 'eager' : 'lazy'"
        :style="{ objectPosition: `${item.focal_x}% ${item.focal_y}%` }"
        @error="failed = true"
      />
      <span v-else class="media-unavailable">Image unavailable</span>
      <span class="media-open" aria-hidden="true">{{
        item.media_type === "video" ? "▶" : "↗"
      }}</span
      >
    </span>
    <span class="media-caption"
      ><span
        ><small>{{ item.categories?.name || "Selected work" }}</small
        ><strong>{{ item.title }}</strong></span
      ><span class="media-number">{{
        String((index || 0) + 1).padStart(2, "0")
      }}</span></span
    >
  </button>
</template>
