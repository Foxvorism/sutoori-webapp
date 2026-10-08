export default defineEventHandler(async (event) => {
  const { db } = await requireAdmin(event);
  const result = await db
    .from("media_items")
    .select("id,title,media_type")
    .eq("status", "published")
    .order("title")
    .limit(1000);
  dbError(result.error);
  return result.data;
});
