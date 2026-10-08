<script setup lang="ts">
import { defaultSettings } from "#shared/content";
definePageMeta({ layout: "admin", middleware: "admin" });
const admin = useAdmin();
const form = ref({
  ...structuredClone(defaultSettings),
  whatsapp: "6281213280154",
  email: "sutooriproduction@gmail.com",
});
const media = ref<any[]>([]);
const loading = ref(true);
const busy = ref(false);
const error = ref("");
const message = ref("");
onMounted(async () => {
  try {
    const [settings, options] = await Promise.all([
      admin.request("settings"),
      admin.request("media-options"),
    ]);
    if (settings) form.value = settings;
    media.value = options;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
async function save() {
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    await admin.request("settings", { method: "PUT", body: form.value });
    message.value =
      "Site settings saved. Public pages read the latest approved content on their next visit.";
    clearNuxtData("site-content");
  } catch (e: any) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div>
    <h2>Site settings</h2>
    <p class="admin-lead">
      Controlled content fields for the public website. Contact defaults come
      from the supplied pitch and need owner verification.
    </p>
    <p v-if="error" role="alert" class="feedback error">{{ error }}</p>
    <p v-if="message" role="status" class="feedback">{{ message }}</p>
    <p v-if="loading" role="status">Loading settings…</p>
    <form v-else class="admin-form" @submit.prevent="save">
      <fieldset
        :disabled="busy"
        style="display: contents; border: 0; padding: 0"
      >
        <section class="admin-panel admin-form">
          <h3>The first impression</h3>
          <label
            >Hero headline<input
              v-model="form.headline"
              required
              maxlength="140" /></label
          ><label
            >Supporting copy<textarea
              v-model="form.supporting_copy"
              required
              maxlength="500"
            /></label
          ><label
            >Hero photo<select v-model="form.hero_media_id">
              <option :value="null">
                First featured image / brand fallback
              </option>
              <option
                v-for="item in media.filter((m) => m.media_type === 'image')"
                :key="item.id"
                :value="item.id"
              >
                {{ item.title }}
              </option>
            </select></label
          ><label
            >Optional showreel<select v-model="form.showreel_media_id">
              <option :value="null">No showreel</option>
              <option
                v-for="item in media.filter((m) => m.media_type === 'video')"
                :key="item.id"
                :value="item.id"
              >
                {{ item.title }}
              </option></select
            ><span class="form-hint"
              >Publish a video with a poster in Media first. Playback is
              visitor-controlled.</span
            ></label
          >
        </section>
        <section class="admin-panel admin-form">
          <h3>About & process</h3>
          <label
            >About Sutoori<textarea
              v-model="form.about"
              required
              maxlength="3000"
              rows="5"
            />
          </label>
          <div v-for="(step, i) in form.process" :key="i" class="admin-form">
            <label
              >Step {{ i + 1 }} title<input
                v-model="step.title"
                required
                maxlength="160" /></label
            ><label
              >Description<textarea
                v-model="step.description"
                required
                maxlength="500"
              />
            </label>
          </div>
        </section>
        <section class="admin-panel admin-form">
          <h3>Contact & conversation</h3>
          <label
            >WhatsApp number<input
              v-model="form.whatsapp"
              inputmode="tel"
              pattern="[1-9][0-9]{7,14}"
              placeholder="6281213280154"
            /><span class="form-hint"
              >Country code and digits only, without + or spaces.</span
            ></label
          ><label
            >WhatsApp message<textarea
              v-model="form.message_template"
              required
              maxlength="500"
            /><span class="form-hint"
              >Service and package names are added automatically. Links never
              send messages automatically.</span
            ></label
          ><label
            >Email<input
              v-model="form.email"
              type="email"
              maxlength="254" /></label
          ><label
            >Instagram URL<input
              v-model="form.instagram"
              type="url"
              required /></label
          ><label class="check"
            ><input v-model="form.contacts_verified" type="checkbox" />The owner
            has verified these contact details and approves publishing this site
            content.</label
          >
          <p class="form-hint">
            Until verified, settings remain an admin-only draft; the public site
            uses approved default copy and its Instagram link.
          </p>
        </section>
        <button class="button" :disabled="busy">
          {{ busy ? "Saving…" : "Save site settings" }}
        </button>
      </fieldset>
    </form>
  </div>
</template>
