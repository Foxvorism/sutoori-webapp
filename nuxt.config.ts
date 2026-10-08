// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  nitro: {
    compressPublicAssets: true,
    vercel: { functions: { maxDuration: 60 } },
  },

  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    supabaseUrl: "",
    supabaseSecretKey: "",
    public: {
      supabaseUrl: "",
      supabasePublishableKey: "",
      siteUrl: "",
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: "en" },
      title: "Sutoori Production — Creating Stories",
      meta: [{ name: "theme-color", content: "#093282" }],
      link: [{ rel: "icon", type: "image/png", href: "/brand/symbol.png" }],
    },
  },
});
