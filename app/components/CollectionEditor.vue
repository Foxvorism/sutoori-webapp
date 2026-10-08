<script setup lang="ts">
const props = defineProps<{ kind: "services" | "packages" }>();
const admin = useAdmin();
const records = ref<any[]>([]);
const media = ref<any[]>([]);
const services = ref<any[]>([]);
const editing = ref(false);
const busy = ref(false);
const loading = ref(true);
const error = ref("");
const message = ref("");
const inclusions = ref("");
const form = ref<any>({});
async function load() {
  loading.value = true;
  try {
    records.value = await admin.request(props.kind);
    if (props.kind === "services") {
      const result = await admin.request("media-options");
      media.value = result;
    } else services.value = await admin.request("services");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
function edit(row?: any) {
  form.value = row
    ? structuredClone(toRaw(row))
    : props.kind === "services"
      ? {
          name: "",
          slug: "",
          description: "",
          cover_media_id: null,
          sort_order: records.value.length,
          visible: false,
        }
      : {
          title: "",
          service_id: null,
          inclusions: [],
          amount: null,
          currency: "IDR",
          price_qualifier: "",
          sort_order: records.value.length,
          visible: false,
        };
  inclusions.value = (form.value.inclusions || []).join("\n");
  editing.value = true;
  message.value = "";
  error.value = "";
}
async function save() {
  busy.value = true;
  error.value = "";
  try {
    const body = { ...form.value };
    if (props.kind === "packages") {
      body.inclusions = inclusions.value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      if (body.amount === "") body.amount = null;
    }
    await admin.request(props.kind, { method: body.id ? "PUT" : "POST", body });
    editing.value = false;
    message.value = "Changes saved.";
    await load();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
async function remove() {
  if (
    !confirm(
      `Delete this ${props.kind === "services" ? "service" : "package"}? This cannot be undone.`,
    )
  )
    return;
  busy.value = true;
  try {
    await admin.request(props.kind, {
      method: "DELETE",
      body: { id: form.value.id },
    });
    editing.value = false;
    message.value = "Deleted.";
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
    <div class="admin-toolbar">
      <div>
        <h2>{{ kind === "services" ? "Services" : "Packages" }}</h2>
        <p>
          {{
            kind === "services"
              ? "What your team brings to a project."
              : "Publish only confirmed offers. Leave the amount empty for Request a Quote."
          }}
        </p>
      </div>
      <button v-if="!editing" class="button" @click="edit()">
        Add {{ kind === "services" ? "service" : "package" }} +
      </button>
    </div>
    <p v-if="error" class="feedback error" role="alert">{{ error }}</p>
    <p v-if="message" class="feedback" role="status">{{ message }}</p>
    <form v-if="editing" class="admin-form admin-panel" @submit.prevent="save">
      <fieldset
        :disabled="busy"
        style="border: 0; padding: 0; display: contents"
      >
        <template v-if="kind === 'services'"
          ><label
            >Name<input v-model="form.name" required maxlength="160" /></label
          ><label
            >Slug<input
              v-model="form.slug"
              required
              maxlength="80"
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="event-documentation"
            /><span class="form-hint"
              >Lowercase letters, numbers, and hyphens.</span
            ></label
          ><label
            >Description<textarea
              v-model="form.description"
              required
              maxlength="2000"
            /></label
          ><label
            >Cover image<select v-model="form.cover_media_id">
              <option :value="null">No cover image</option>
              <option
                v-for="item in media.filter((m) => m.media_type === 'image')"
                :key="item.id"
                :value="item.id"
              >
                {{ item.title }}
              </option>
            </select></label
          ></template
        ><template v-else
          ><label
            >Package title<input
              v-model="form.title"
              required
              maxlength="160" /></label
          ><label
            >Associated service<select v-model="form.service_id">
              <option :value="null">No association</option>
              <option
                v-for="service in services"
                :key="service.id"
                :value="service.id"
              >
                {{ service.name }}
              </option>
            </select></label
          ><label
            >Inclusions (one per line)<textarea
              v-model="inclusions"
              required
              rows="6"
            />
          </label>
          <div class="form-row">
            <label
              >Amount (optional)<input
                v-model.number="form.amount"
                type="number"
                min="0"
                max="1000000000000"
                step="0.01"
                placeholder="Request a Quote" /></label
            ><label
              >Currency<select v-model="form.currency">
                <option>IDR</option>
                <option>USD</option>
              </select></label
            >
          </div>
          <label
            >Price qualifier<input
              v-model="form.price_qualifier"
              maxlength="80"
              placeholder="e.g. starting from / per event" /></label></template
        ><label
          >Display order<input
            v-model.number="form.sort_order"
            type="number"
            min="-100000"
            max="100000"
            required /></label
        ><label class="check"
          ><input v-model="form.visible" type="checkbox" />Visible on the public
          website</label
        >
        <div class="form-actions">
          <button class="button" :disabled="busy">
            {{ busy ? "Saving…" : "Save" }}</button
          ><button
            class="button secondary"
            type="button"
            :disabled="busy"
            @click="editing = false"
          >
            Cancel</button
          ><button
            v-if="form.id"
            class="button danger"
            type="button"
            :disabled="busy"
            @click="remove"
          >
            Delete
          </button>
        </div>
      </fieldset>
    </form>
    <p v-else-if="loading" role="status">Loading content…</p>
    <div v-else-if="records.length" class="admin-list">
      <button
        v-for="row in records"
        :key="row.id"
        class="admin-list-row"
        @click="edit(row)"
      >
        <span
          ><strong>{{ row.name || row.title }}</strong
          ><small
            >{{ row.visible ? "Published" : "Hidden" }} · Order
            {{ row.sort_order }}</small
          ></span
        ><span>Edit <ArrowIcon /></span>
      </button>
    </div>
    <div v-else class="admin-panel">
      No {{ kind }} yet. Add your first one above.
    </div>
  </div>
</template>
