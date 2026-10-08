<script setup lang="ts">
import { mediaSchema } from "#shared/validation";
definePageMeta({ layout: "admin", middleware: "admin" });
const admin = useAdmin();
const route = useRoute();
const item = ref<any>(null);
const categories = ref<any[]>([]);
const busy = ref(false);
const message = ref("");
const error = ref("");
const preview = ref<{ open: (index: number) => void }>();
const form = reactive({
  title: "",
  caption: "",
  alt_text: "",
  category_id: null as string | null,
  featured: false,
  sort_order: 0,
  focal_x: 50,
  focal_y: 50,
});
async function load() {
  try {
    const [media, cats] = await Promise.all([
      admin.request(`media/${route.params.id}`),
      admin.request("categories"),
    ]);
    item.value = media;
    categories.value = cats;
    for (const key of Object.keys(form) as (keyof typeof form)[])
      (form as any)[key] = media[key];
  } catch (e: any) {
    error.value = e.message;
  }
}
onMounted(load);
async function action(kind: string) {
  if (
    kind === "delete" &&
    !confirm("Delete this media and its stored files? This cannot be undone.")
  )
    return;
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    if (kind === "save" || kind === "publish") {
      const parsed = mediaSchema.safeParse(form);
      if (!parsed.success)
        throw new Error(
          parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        );
      await admin.request(`media/${route.params.id}`, {
        method: "PUT",
        body: parsed.data,
      });
    }
    if (kind !== "save")
      await admin.request(`media/${route.params.id}`, {
        method: kind === "delete" ? "DELETE" : "POST",
        body: kind === "delete" ? undefined : { action: kind },
      });
    if (kind === "delete") {
      await navigateTo("/admin/media");
      return;
    }
    message.value =
      kind === "save"
        ? "Changes saved."
        : kind === "publish"
          ? "Published. This work is now visible in the public gallery."
          : "Unpublished. Cached public copies may remain briefly available.";
    await load();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div>
    <NuxtLink to="/admin/media" class="text-link">← Media library</NuxtLink>
    <h2 style="margin-top: 24px">Edit your frame</h2>
    <p v-if="error" class="feedback error" role="alert">{{ error }}</p>
    <p v-if="message" class="feedback" role="status">{{ message }}</p>
    <div v-if="item" class="admin-editor">
      <aside class="admin-preview">
        <img
          v-if="item.thumbnail"
          :src="item.thumbnail"
          :alt="form.alt_text || form.title"
          :style="{ objectPosition: `${form.focal_x}% ${form.focal_y}%` }"
        />
        <div v-else class="no-preview">
          Upload incomplete or preview unavailable
        </div>
        <div class="form-actions">
          <span class="status-chip" :class="item.status">{{ item.status }}</span
          ><button
            v-if="item.url"
            class="button secondary"
            @click="preview?.open(0)"
          >
            Preview {{ item.media_type }}
          </button>
        </div>
        <p class="form-hint">
          Preview links expire after 10 minutes. Reload this screen to renew
          them. Focal points control the crop in gallery cards.
        </p>
        <p v-if="!item.ready" class="feedback error">
          The upload did not complete. Delete this draft and upload the file
          again.
        </p>
      </aside>
      <form class="admin-form admin-panel" @submit.prevent="action('save')">
        <fieldset
          :disabled="busy"
          style="border: 0; padding: 0; display: contents"
        >
          <label
            >Title<input v-model="form.title" required maxlength="160" /></label
          ><label
            >Category<select v-model="form.category_id">
              <option :value="null">Choose a category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select></label
          ><label
            >Alt text
            {{ item.media_type === "image" ? "(required to publish)" : ""
            }}<textarea
              v-model="form.alt_text"
              maxlength="500"
              placeholder="Describe what is visible in the image."
            /></label
          ><label
            >Caption<textarea v-model="form.caption" maxlength="2000" />
          </label>
          <div class="form-row">
            <label
              >Horizontal focal point: {{ form.focal_x }}%<input
                v-model.number="form.focal_x"
                type="range"
                min="0"
                max="100" /></label
            ><label
              >Vertical focal point: {{ form.focal_y }}%<input
                v-model.number="form.focal_y"
                type="range"
                min="0"
                max="100"
            /></label>
          </div>
          <label
            >Display order<input
              v-model.number="form.sort_order"
              type="number"
              min="-100000"
              max="100000"
              required
            /><span class="form-hint">Lower numbers appear first.</span></label
          ><label class="check"
            ><input v-model="form.featured" type="checkbox" />Featured on the
            homepage</label
          >
          <div class="form-actions">
            <button
              class="button"
              :disabled="busy || item.status === 'deleting'"
            >
              {{ busy ? "Working…" : "Save changes" }}</button
            ><button
              v-if="item.status !== 'published' && item.status !== 'deleting'"
              class="button secondary"
              type="button"
              :disabled="busy || !item.ready"
              @click="action('publish')"
            >
              Save & publish</button
            ><button
              v-if="item.status === 'published' || item.public_path"
              class="button secondary"
              type="button"
              :disabled="busy"
              @click="action('unpublish')"
            >
              Unpublish / clean public files</button
            ><button
              class="button danger"
              type="button"
              :disabled="busy"
              @click="action('delete')"
            >
              {{ item.status === "deleting" ? "Retry delete" : "Delete" }}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
    <p v-else-if="!error">Loading media…</p>
    <MediaLightbox v-if="item" ref="preview" :items="[{ ...item, ...form }]" />
  </div>
</template>
