<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
const admin = useAdmin();
const items = ref<any[]>([]);
const count = ref(0);
const page = ref(1);
const loading = ref(true);
const error = ref("");
const busy = ref(false);
const categories = ref<any[]>([]);
const categoryName = ref("");
const categoryBusy = ref(false);
const queue = ref<
  {
    file: File;
    poster: File | null;
    progress: number;
    status: string;
    error: string;
  }[]
>([]);
async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [media, cats] = await Promise.all([
      admin.request(`media?page=${page.value}`),
      admin.request("categories"),
    ]);
    items.value = media.items;
    count.value = media.count;
    categories.value = cats;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(page, load);
function choose(e: Event) {
  queue.value = Array.from((e.target as HTMLInputElement).files || []).map(
    (file) => ({ file, poster: null, progress: 0, status: "ready", error: "" }),
  );
}
async function upload() {
  busy.value = true;
  for (const item of queue.value) {
    if (item.status === "complete") continue;
    item.error = "";
    item.status = "uploading";
    try {
      await admin.upload(item.file, item.poster, (p) => (item.progress = p));
      item.status = "complete";
    } catch (e: any) {
      item.status = "failed";
      item.error = e.message;
    }
  }
  busy.value = false;
  await load();
}
async function addCategory() {
  categoryBusy.value = true;
  error.value = "";
  try {
    const name = categoryName.value.trim();
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    await admin.request("categories", {
      method: "POST",
      body: { name, slug, sort_order: categories.value.length, active: true },
    });
    categoryName.value = "";
    await load();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    categoryBusy.value = false;
  }
}
</script>
<template>
  <div>
    <h2>Media library</h2>
    <p class="admin-lead">
      Originals and drafts stay private. Publishing creates separate public
      files.
    </p>
    <section class="admin-panel">
      <h3>Upload new work</h3>
      <label class="field"
        >Images or videos<input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          :disabled="busy"
          @change="choose"
        /><span class="form-hint"
          >JPEG, PNG, WebP up to 15 MB. MP4/WebM up to 50 MB; each video needs a
          poster. Videos are not transcoded.</span
        ></label
      >
      <div v-for="(item, i) in queue" :key="i" class="upload-row">
        <div>
          <strong>{{ item.file.name }}</strong
          ><small
            >{{ item.status }} · {{ item.progress }}%{{
              item.progress === 100 && item.status === "uploading"
                ? " · Processing…"
                : ""
            }}</small
          ><progress
            :value="item.progress"
            max="100"
            :aria-label="`Upload ${item.file.name}`"
          />
          <p v-if="item.error" class="feedback error" role="alert">
            {{ item.error }}
          </p>
        </div>
        <label v-if="item.file.type.startsWith('video/')" class="field"
          >Poster image<input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            :disabled="busy || item.status === 'complete'"
            @change="
              item.poster =
                ($event.target as HTMLInputElement).files?.[0] || null
            "
        /></label>
      </div>
      <button
        v-if="queue.length"
        class="button"
        style="margin-top: 20px"
        :disabled="busy || queue.every((q) => q.status === 'complete')"
        @click="upload"
      >
        {{ busy ? "Uploading…" : "Upload / retry incomplete files" }}
      </button>
    </section>
    <details class="admin-panel">
      <summary>Manage gallery categories</summary>
      <form
        class="category-row"
        style="margin-top: 20px"
        @submit.prevent="addCategory"
      >
        <label class="field"
          >Category name<input
            v-model="categoryName"
            required
            maxlength="160"
            placeholder="e.g. Event documentation" /></label
        ><button class="button" :disabled="categoryBusy">Add category</button>
      </form>
      <div class="category-chips">
        <span v-for="cat in categories" :key="cat.id">{{ cat.name }}</span>
      </div>
    </details>
    <p v-if="error" class="feedback error" role="alert">
      {{ error }} <button @click="load">Retry</button>
    </p>
    <div class="admin-toolbar">
      <p>{{ count }} items · Page {{ page }}</p>
      <button class="button secondary" :disabled="loading" @click="load">
        Refresh
      </button>
    </div>
    <p v-if="loading" role="status">Loading media…</p>
    <div v-else-if="items.length" class="admin-media-grid">
      <NuxtLink
        v-for="item in items"
        :key="item.id"
        :to="`/admin/media/${item.id}`"
        class="admin-media-card"
        ><img
          v-if="item.thumbnail"
          :src="item.thumbnail"
          :alt="item.alt_text || item.title"
        /><span v-else class="no-preview">{{
          item.media_sources?.ready
            ? "Preview unavailable"
            : "Incomplete upload"
        }}</span
        ><span class="admin-media-info"
          ><strong>{{ item.title || "Untitled" }}</strong
          ><span class="status-chip" :class="item.status">{{
            item.status
          }}</span
          ><small
            >{{ item.featured ? "Featured · " : "" }}Order
            {{ item.sort_order }}</small
          ></span
        ></NuxtLink
      >
    </div>
    <div v-else class="admin-panel">
      No media yet. Upload the first frame above.
    </div>
    <div class="form-actions">
      <button
        class="button secondary"
        :disabled="page === 1 || loading"
        @click="page--"
      >
        Previous</button
      ><button
        class="button secondary"
        :disabled="page * 24 >= count || loading"
        @click="page++"
      >
        Next
      </button>
    </div>
  </div>
</template>
