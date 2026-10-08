export function usePageSeo(title: string, description: string, path: string) {
  const config = useRuntimeConfig();
  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: "website",
    twitterCard: "summary_large_image",
  });
  if (config.public.siteUrl && /^https:\/\//.test(config.public.siteUrl)) {
    const canonical = new URL(path, config.public.siteUrl).href;
    useHead({ link: [{ rel: "canonical", href: canonical }] });
    useSeoMeta({
      ogUrl: canonical,
      ogImage: new URL("/brand/lockup.png", config.public.siteUrl).href,
    });
  }
  if (!config.public.siteUrl)
    useSeoMeta({ robots: "noindex, nofollow" });
}
