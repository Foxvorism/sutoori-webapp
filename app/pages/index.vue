<script setup lang="ts">
import { defaultSettings, whatsappLink } from "#shared/content";
const { data } = await useContent();
const settings = computed(() => data.value?.settings || defaultSettings);
const contact = computed(() => whatsappLink(settings.value));
const featured = computed(() => data.value?.featured || []);
const headlineLines = computed(() => settings.value.headline.split(/(?<=\.)\s+/));
const root = ref<HTMLElement>();
const lightbox = ref<{ open: (index: number) => void }>();
const video = ref<HTMLVideoElement>();
useStoryMotion(root);
usePageSeo(
  "Sutoori Production — Creating Stories. Timeless Moments.",
  "Photography, film, design, and creative production in Bogor–Jabodetabek. One team, from concept to final frame.",
  "/",
);
const heroFailed = ref(false);
const playing = ref(false);
function playReel() {
  if (video.value) {
    video.value
      .play()
      .then(() => (playing.value = true))
      .catch(() => (playing.value = false));
  }
}
</script>
<template>
  <main id="main" ref="root" class="story-page">
    <div class="opening-scene">
    <section class="hero">
      <div class="hero-topline"><span class="hero-location"
          >BOGOR, INDONESIA <span aria-hidden="true">↗</span></span
        >
      </div>
      <h1 class="hero-title"><span v-for="line in headlineLines" :key="line" class="hero-line">{{ line }}</span></h1>
      <div class="hero-bottomline">
        <p>{{ settings.supporting_copy }}</p>
        <a href="#work" class="text-link"
          >Explore Our Work <span aria-hidden="true">↓</span></a
        >
      </div>
      <div class="hero-sticker" aria-hidden="true">MAKE<br /><em>it matter.</em><span>↗</span></div>
      <div class="hero-visual">
        <img
          v-if="data?.hero && !heroFailed"
          class="hero-image"
          :src="data.hero.url"
          :srcset="`${data.hero.thumbnail} ${Math.min(1024,data.hero.width)}w, ${data.hero.url} ${data.hero.width}w`"
          sizes="100vw"
          :alt="data.hero.alt_text"
          :width="data.hero.width"
          :height="data.hero.height"
          fetchpriority="high"
          :style="{
            objectPosition: `${data.hero.focal_x}% ${data.hero.focal_y}%`,
          }"
          @error="heroFailed = true"
        />
        <div v-else class="hero-brand">
          <img
            src="/brand/lockup.png"
            alt="Sutoori — Creating Stories, Timeless Moments"
            width="1568"
            height="1568"
          />
        </div>
        <div class="hero-overlay">
          <span>EVERY MOMENT.<br />A STORY WORTH TELLING.</span
          ><a
            :href="contact || '#contact'"
            class="round-link"
            aria-label="Start a conversation"
            >↗</a
          >
        </div>
        <span class="frame-marker">S / 01</span>
      </div>
      <div class="image-footnote">
        <span>FROM THE FIRST IDEA TO THE FINAL FRAME.</span
        ><span>SCROLL TO DISCOVER ↓</span>
      </div>
    </section>
    <section class="statement section-pad">
      <span class="eyebrow">01 / THE WAY WE SEE IT</span>
      <h2>
        <span class="statement-word">Feel it.</span><br />
        <span class="statement-word">Frame it.</span><br />
        <span class="statement-word"><em>Keep it.</em></span>
      </h2>
      <div class="statement-bottom">
        <span class="statement-symbol symbol-crop" aria-hidden="true"
          ><img src="/brand/symbol.png" alt="" width="1568" height="1568"
        /></span>
        <p>
          We bring photography, video, design, and production together in one
          creative workflow. Built for schools, communities, brands, and the
          moments that matter.
        </p>
      </div>
    </section>
    </div>
    <div class="story-ribbon" aria-hidden="true"><span>REAL PEOPLE. REAL FEELING. ↗ STORIES THAT STAY. ↗ REAL PEOPLE. REAL FEELING. ↗ STORIES THAT STAY. ↗</span></div>
    <section id="work" class="selected-work section-pad">
      <div class="section-heading">
        <div>
          <span class="eyebrow">02 / THROUGH OUR LENS</span>
          <h2 data-reveal>Good moments.<br /><em>Great stories.</em></h2>
        </div>
        <NuxtLink to="/work" class="text-link">View All Work ↗</NuxtLink>
      </div>
      <p v-if="data?.unavailable" class="notice" role="status">
        Some work is temporarily unavailable. Please check back shortly.
      </p>
      <div v-if="featured.length" class="work-viewport">
        <div class="work-track">
          <div
            v-for="(item, i) in featured"
            :key="item.id"
            class="work-stack-card"
          >
          <MediaCard
            :item="item"
            :index="i"
            @open="lightbox?.open(i)"
          />
          </div>
        </div>
      </div>
      <div v-else class="empty-work">
        <p>New stories are on their way.</p>
        <NuxtLink to="/work">Explore the gallery ↗</NuxtLink>
      </div>
    </section>
    <section id="services" class="services-section section-pad">
      <div class="services-intro">
        <span class="eyebrow">03 / WHAT WE BRING</span>
        <h2 data-reveal>Big ideas.<br />All the<br /><em>right hands.</em></h2>
        <p>
          From capturing a single moment to bringing an entire creative vision
          to life. We connect the dots.
        </p>
        <div class="service-image" v-if="data?.hero">
          <img
            :src="data.hero.thumbnail"
            :alt="data.hero.alt_text"
            loading="lazy"
            width="640"
            height="427"
          />
        </div>
      </div>
      <div class="services-list">
        <details
          v-for="(service, i) in data?.services"
          :key="service.id"
          :open="i === 0"
          data-reveal
        >
          <summary>
            <span class="service-index">{{
              String(i + 1).padStart(2, "0")
            }}</span>
            <h3>{{ service.name }}</h3>
            <span class="service-plus" aria-hidden="true">+</span>
          </summary>
          <div class="service-details">
            <img
              v-if="
                service.cover_media_id &&
                data?.media.find((m) => m.id === service.cover_media_id)
              "
              :src="
                data.media.find((m) => m.id === service.cover_media_id)
                  ?.thumbnail
              "
              alt=""
              loading="lazy"
              width="640"
              height="427"
            />
            <p>{{ service.description }}</p>
            <a :href="whatsappLink(settings, service.name) || '#contact'"
              >Request a Quote ↗</a
            >
          </div>
        </details>
      </div>
    </section>
    <section class="process-section section-pad">
      <div class="section-heading">
        <div>
          <span class="eyebrow">04 / THE MAKING OF A STORY</span>
          <h2 data-reveal>A good story<br />starts <em>together.</em></h2>
        </div>
        <p>A shared vision.<br />A considered process.</p>
      </div>
      <div class="process-grid">
        <article v-for="(step, i) in settings.process" :key="i" data-reveal>
          <span>0{{ i + 1 }} <span aria-hidden="true">↗</span></span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </article>
      </div>
    </section>
    <section v-if="data?.packages.length" class="packages-section section-pad">
      <span class="eyebrow">MADE FOR YOUR STORY</span>
      <h2>Find your <em>starting point.</em></h2>
      <div class="package-grid">
        <article v-for="pkg in data.packages" :key="pkg.id">
          <h3>{{ pkg.title }}</h3>
          <p class="package-price">
            {{
              pkg.amount === null
                ? "Request a Quote"
                : new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: pkg.currency,
                    maximumFractionDigits: 0,
                  }).format(pkg.amount)
            }}
            <small>{{ pkg.price_qualifier }}</small>
          </p>
          <ul>
            <li v-for="line in pkg.inclusions" :key="line">{{ line }}</li>
          </ul>
          <a :href="whatsappLink(settings, pkg.title) || '#contact'"
            >Let's talk about this ↗</a
          >
        </article>
      </div>
    </section>
    <section id="about" class="about-section section-pad">
      <span class="eyebrow">05 / MEET SUTOORI</span>
      <div class="about-grid">
        <h2 data-reveal>
          Fresh eyes.<br />Shared passion.<br /><em>Lasting stories.</em>
        </h2>
        <div>
          <p>{{ settings.about }}</p>
          <a
            :href="settings.instagram"
            target="_blank"
            rel="noopener noreferrer"
            class="text-link"
            >Behind the scenes ↗</a
          ><span class="about-tag">#CreateYourStoryWithSutoori</span>
        </div>
      </div>
    </section>
    <section v-if="data?.showreel" class="showreel-section section-pad">
      <h2>See the story <em>move.</em></h2>
      <video
        ref="video"
        :src="data.showreel.url"
        :poster="data.showreel.thumbnail"
        controls
        playsinline
        preload="none"
        @pause="playing = false"
        @play="playing = true"
      /><button v-if="!playing" class="button" @click="playReel">
        Play showreel ▶
      </button>
    </section>
    <MediaLightbox ref="lightbox" :items="featured" />
  </main>
</template>
<style src="~/assets/css/story.css"></style>
