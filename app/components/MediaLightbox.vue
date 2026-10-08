<script setup lang="ts">
import type { MediaItem } from "../../shared/content";
const props = defineProps<{ items: MediaItem[] }>();
const dialog = ref<HTMLDialogElement>();
const position = ref(0);
const item = computed(() => props.items[position.value]);
let previous: HTMLElement | null = null;
let overflow = "";
const failed = ref(false);
const isOpen = ref(false);
async function open(index: number) {
  position.value = index;
  failed.value = false;
  previous = document.activeElement as HTMLElement;
  isOpen.value = true;
  await nextTick();
  if (!dialog.value) return;
  overflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  dialog.value?.showModal();
}
function close() {
  dialog.value?.close();
}
function restore() {
  dialog.value?.querySelector("video")?.pause();
  document.body.style.overflow = overflow;
  previous?.focus({ preventScroll: true });
  isOpen.value = false;
}
function move(delta: number) {
  position.value =
    (position.value + delta + props.items.length) % props.items.length;
  failed.value = false;
}
function keys(e: KeyboardEvent) {
  if (e.key === "Tab") {
    const controls = Array.from(
      dialog.value?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), video[controls]",
      ) || [],
    );
    const first = controls[0];
    const last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
  if (e.key === "ArrowRight") {
    e.preventDefault();
    move(1);
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    move(-1);
  }
}
onBeforeUnmount(() => {
  if (dialog.value?.open) {
    dialog.value.close();
    restore();
  }
});
defineExpose({ open });
</script>
<template>
  <dialog
    ref="dialog"
    class="lightbox"
    aria-labelledby="lightbox-title"
    @close="restore"
    @keydown="keys"
    @click="
      (e) => {
        if (e.target === dialog) close();
      }
    "
  >
    <div v-if="item && isOpen" class="lightbox-inner">
      <button class="lightbox-close" autofocus @click="close">
        Close <span aria-hidden="true">×</span>
      </button>
      <div class="lightbox-media">
        <p v-if="failed" role="status">
          This media is unavailable. Try another frame.
        </p>
        <video
          v-else-if="item.media_type === 'video'"
          :key="item.id"
          :src="item.url"
          :poster="item.thumbnail"
          controls
          playsinline
          preload="metadata"
          @error="failed = true"
        /><img
          v-else
          :key="`image-${item.id}`"
          :src="item.url"
          :alt="item.alt_text"
          @error="failed = true"
        />
      </div>
      <div class="lightbox-description">
        <div>
          <small
            >{{ item.categories?.name }}</small
          >
          <h2 id="lightbox-title">{{ item.title }}</h2>
          <p>{{ item.caption }}</p>
        </div>
        <div class="lightbox-controls">
          <button
            :disabled="items.length < 2"
            aria-label="Previous image"
            @click="move(-1)"
          >
            ←</button
          ><span aria-live="polite"
            >{{ position + 1 }} / {{ items.length }}</span
          ><button
            :disabled="items.length < 2"
            aria-label="Next image"
            @click="move(1)"
          >
            →
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>
