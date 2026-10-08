<script setup lang="ts">
const admin = useAdmin();
const signingOut = ref(false);
const logoutError = ref("");
useSeoMeta({ robots: "noindex, nofollow" });
async function logout() {
  signingOut.value = true;
  try {
    const result = await admin.auth().auth.signOut({ scope: "local" });
    if (result.error) throw result.error;
    await navigateTo("/admin/login");
  } catch {
    logoutError.value = "Could not sign out. Please retry.";
  } finally {
    signingOut.value = false;
  }
}
</script>
<template>
  <div class="admin-shell">
    <header class="admin-header">
      <NuxtLink to="/admin"><h1>Sutoori / Studio dashboard</h1></NuxtLink>
      <div class="form-actions">
        <NuxtLink to="/" target="_blank">View website <ArrowIcon /></NuxtLink
        ><button :disabled="signingOut" @click="logout">
          {{ signingOut ? "Signing out…" : "Sign out" }}
        </button>
      </div>
    </header>
    <nav class="admin-nav" aria-label="Dashboard navigation">
      <NuxtLink to="/admin">Overview</NuxtLink
      ><NuxtLink to="/admin/media">Media</NuxtLink
      ><NuxtLink to="/admin/services">Services</NuxtLink
      ><NuxtLink to="/admin/packages">Packages</NuxtLink
      ><NuxtLink to="/admin/settings">Site settings</NuxtLink>
    </nav>
    <main class="admin-content">
      <p v-if="logoutError" role="alert" class="feedback error">
        {{ logoutError }}
      </p>
      <ClientOnly
        ><slot /><template #fallback
          ><p>Loading your workspace…</p></template
        ></ClientOnly
      >
    </main>
  </div>
</template>
