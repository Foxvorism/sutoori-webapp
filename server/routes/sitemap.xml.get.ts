export default defineEventHandler((event) => {
  const origin = useRuntimeConfig(event).public.siteUrl;
  if (!origin || !/^https:\/\/[a-z0-9.-]+(?::\d+)?\/?$/i.test(origin))
    throw createError({ statusCode: 404 });
  setHeader(event, "Content-Type", "application/xml");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${["/", "/work"].map((path) => `<url><loc>${new URL(path, origin).href}</loc></url>`).join("")}</urlset>`;
});
