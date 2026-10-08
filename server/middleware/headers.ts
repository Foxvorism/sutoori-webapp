export default defineEventHandler((event) => {
  if (event.path.startsWith("/api/") || event.path.startsWith("/admin")) {
    setHeader(event, "Cache-Control", "no-store");
  }
  if (event.path.startsWith("/admin")) {
    setHeader(event, "X-Robots-Tag", "noindex, nofollow");
  }
  setHeader(event, "X-Content-Type-Options", "nosniff");
});
