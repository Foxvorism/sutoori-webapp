<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" });
useSeoMeta({ title: "Studio dashboard — Sutoori" });
</script>
<template>
  <div>
    <h2>Your next story starts here.</h2>
    <p class="admin-lead">
      Upload privately, add the details, then publish when you're ready.
    </p>
    <div class="admin-stats">
      <NuxtLink to="/admin/media"
        ><strong>Media library ↗</strong
        ><span
          >Upload, preview, organize, and publish your work.</span
        ></NuxtLink
      ><NuxtLink to="/admin/services"
        ><strong>Services ↗</strong
        ><span>Keep your creative offering up to date.</span></NuxtLink
      ><NuxtLink to="/admin/settings"
        ><strong>Site settings ↗</strong
        ><span>Set the hero, contact details, and your story.</span></NuxtLink
      >
    </div>
    <div class="admin-panel" style="margin-top: 24px">
      <h3>Before going live</h3>
      <p>
        Verify the draft WhatsApp number and email in Site settings. Publish
        your selected images and choose a hero. Unpublished files may remain
        in a visitor's cache for a short time.
      </p>
    </div>
  </div>
</template>
