<script setup lang="ts">
import type { MediaItem, GalleryResponse } from "#shared/content";
const route = useRoute();
const category = computed(() =>
  typeof route.query.category === "string" ? route.query.category : "all",
);
const page = ref(1);
const { data, pending, error, refresh } = await useAsyncData<GalleryResponse>(
  "gallery",
  () => $fetch<GalleryResponse>("/api/work", {
    query: { category: category.value, page: 1 },
  }),
  { watch: [category] },
);
const extra = ref<MediaItem[]>([]);
const moreBusy = ref(false);
const moreError = ref("");
watch(category, () => {
  page.value = 1;
  extra.value = [];
  moreError.value = "";
});
const items = computed(() => [...(data.value?.items || []), ...extra.value]);
const lightbox = ref<{ open: (index: number) => void }>();
async function loadMore() {
  moreBusy.value = true;
  moreError.value = "";
  const active = category.value;
  try {
    const next = await $fetch<GalleryResponse>("/api/work", {
      query: { category: active, page: page.value + 1 },
    });
    if (active === category.value) {
      extra.value.push(...next.items);
      page.value++;
    }
  } catch {
    moreError.value = "Could not load more work. Please retry.";
  } finally {
    moreBusy.value = false;
  }
}
usePageSeo(
  "Selected Work — Sutoori Production",
  "Explore photography, film, and creative production from Sutoori. Moments made into lasting stories.",
  "/work",
);
</script>
<template>
  <main id="main" class="gallery-page section-pad">
    <div class="eyebrow">THE SUTOORI GALLERY</div>
    <div class="section-heading">
      <h1>Every frame.<br /><em>A different story.</em></h1>
      <p>Photography. Film. Creative production.<br />Take a closer look.</p>
    </div>
    <nav class="gallery-filters" aria-label="Filter work">
      <NuxtLink :to="{ path: '/work' }" :aria-current="category === 'all' ? 'page' : undefined">All Work</NuxtLink>
      <NuxtLink v-for="cat in data?.categories" :key="cat.slug"
        :to="{ path: '/work', query: { category: cat.slug } }"
        :aria-current="category === cat.slug ? 'page' : undefined">{{ cat.name }}</NuxtLink>
    </nav>
    <p v-if="pending" role="status">Loading stories…</p>
    <div v-if="error || data?.unavailable" class="notice" role="alert">
      The gallery is temporarily unavailable.
      <button @click="refresh()">Try again</button>
    </div>
    <div v-if="items.length" class="gallery-grid" :aria-busy="pending">
      <MediaCard v-for="(item, i) in items" :key="item.id" :item="item" :index="i"
        :eager="i < 2" @open="lightbox?.open(i)" />
    </div>
    <div v-else-if="!pending && !error" class="empty-work">
      <h2>{{ category === "all" ? "New stories are on their way." : "No stories in this selection yet." }}</h2>
      <NuxtLink v-if="category !== 'all'" to="/work">See all work ↗</NuxtLink>
    </div>
    <div class="load-more">
      <p role="status">{{ items.length }} of {{ data?.count || 0 }} frames</p>
      <p v-if="moreError" role="alert">{{ moreError }}</p>
      <button v-if="items.length < (data?.count || 0)" class="button" :disabled="moreBusy" @click="loadMore">
        {{ moreBusy ? "Loading…" : "Load more work ↓" }}
      </button>
    </div>
    <MediaLightbox ref="lightbox" :items="items" />
  </main>
</template>
