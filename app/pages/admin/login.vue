<script setup lang="ts">
definePageMeta({ layout: false });
useSeoMeta({ title: "Studio sign in — Sutoori", robots: "noindex, nofollow" });
const admin = useAdmin();
const email = ref("");
const password = ref("");
const busy = ref(false);
const error = ref("");
async function login() {
  busy.value = true;
  error.value = "";
  try {
    const result = await admin
      .auth()
      .auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
    if (result.error) throw result.error;
    await admin.request("session");
    password.value = "";
    await navigateTo("/admin");
  } catch (e: any) {
    error.value = e.message || "Sign in failed. Please retry.";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <main class="login-page">
    <div class="login-panel">
      <span class="eyebrow">SUTOORI / THE STUDIO</span>
      <h1>Welcome back.</h1>
      <p>Sign in to manage your stories, services, and site.</p>
      <div v-if="!admin.configured" class="notice" role="status">
        The studio is not connected yet. Add the Supabase environment variables
        and run the migration in the setup guide.
      </div>
      <form class="admin-form" @submit.prevent="login">
        <label
          >Email<input
            v-model="email"
            type="email"
            autocomplete="username"
            required
            :disabled="busy || !admin.configured" /></label
        ><label
          >Password<input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            :disabled="busy || !admin.configured"
        /></label>
        <p v-if="error" role="alert" class="feedback error">{{ error }}</p>
        <button class="button" :disabled="busy || !admin.configured">
          {{ busy ? "Signing in…" : "Sign in →" }}
        </button>
        <p class="form-hint">
          Access is by invitation. Contact the site owner if you need an account
          or password reset.
        </p>
      </form>
      <NuxtLink to="/">← Back to the website</NuxtLink>
    </div>
  </main>
</template>
