export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return;
  const admin = useAdmin();
  if (!admin.configured) return navigateTo("/admin/login");
  try {
    await admin.request("session");
  } catch {
    return navigateTo("/admin/login");
  }
});
