<script setup lang="ts">
import { defaultSettings, whatsappLink } from "#shared/content";
const { data } = await useContent();
const settings = computed(() => data.value?.settings || defaultSettings);
const contact = computed(() => whatsappLink(settings.value));
const menu = ref(false);
const route = useRoute();
watch(
  () => route.fullPath,
  () => (menu.value = false),
);
</script>
<template>
  <div class="public-site">
    <a class="skip-link" href="#main">Skip to content</a>
    <header class="site-header">
      <NuxtLink to="/" class="brand" aria-label="Sutoori Production home"
        ><span class="symbol-crop"
          ><img
            src="/brand/symbol.png"
            alt=""
            width="1568"
            height="1568" /></span
        ><span>SUTOORI<small>PRODUCTION</small></span></NuxtLink
      >
      <nav class="desktop-nav" aria-label="Main navigation">
        <NuxtLink to="/#work">Work</NuxtLink
        ><NuxtLink to="/#services">Services</NuxtLink
        ><NuxtLink to="/#about">About</NuxtLink>
      </nav>
      <a class="header-contact" :href="contact || '/#contact'"
        >Let's Talk <span aria-hidden="true">↗</span></a
      >
      <button
        class="menu-toggle"
        :aria-expanded="menu"
        aria-controls="mobile-nav"
        @click="menu = !menu"
      >
        {{ menu ? "Close" : "Menu" }}
        <span aria-hidden="true">{{ menu ? "−" : "+" }}</span>
      </button>
      <nav
        v-if="menu"
        id="mobile-nav"
        class="mobile-nav"
        aria-label="Mobile navigation"
        @keydown.esc="menu = false"
      >
        <NuxtLink to="/#work">Work</NuxtLink
        ><NuxtLink to="/#services">Services</NuxtLink
        ><NuxtLink to="/#about">About</NuxtLink
        ><NuxtLink to="/#contact">Contact</NuxtLink>
      </nav>
    </header>
    <slot />
    <footer id="contact" class="contact-section">
      <div class="eyebrow">
        <span class="dot" /> THE NEXT CHAPTER STARTS HERE
      </div>
      <div class="contact-heading">
        <h2>Let's create<br />your next <em>story.</em></h2>
        <a
          :href="contact || settings.instagram"
          class="contact-arrow"
          :aria-label="
            contact
              ? 'Start a conversation on WhatsApp'
              : 'Visit Sutoori on Instagram'
          "
          >↗</a
        >
      </div>
      <div class="contact-links">
        <a v-if="contact" :href="contact">Start a conversation on WhatsApp ↗</a
        ><a
          v-if="settings.contacts_verified && settings.email"
          :href="`mailto:${settings.email}`"
          >{{ settings.email }} ↗</a
        ><a :href="settings.instagram" target="_blank" rel="noopener noreferrer"
          >Instagram ↗</a
        >
      </div>
      <div class="footer-bottom">
        <span>© {{ new Date().getFullYear() }} Sutoori Production</span
        ><span>BOGOR–JABODETABEK, INDONESIA</span
        ><a href="#main">Back to top ↑</a>
      </div>
    </footer>
  </div>
</template>
