export default defineEventHandler(async (event) => {
  const { db } = await requireAdmin(event);
  const page = Math.max(1, Math.min(10000, Number(getQuery(event).page) || 1));
  const result = await db
    .from("media_items")
    .select("*,categories(name,slug),media_sources(ready)", { count: "exact" })
    .order("sort_order")
    .order("created_at", { ascending: false })
    .range((page - 1) * 24, page * 24 - 1);
  dbError(result.error);
  const items = await Promise.all(
    (result.data || []).map(async (item) => {
      const source = await db
        .from("media_sources")
        .select("thumbnail_path")
        .eq("media_id", item.id)
        .maybeSingle();
      const preview = source.data
        ? await db.storage
            .from("originals")
            .createSignedUrl(source.data.thumbnail_path, 600)
        : null;
      return { ...item, thumbnail: preview?.data?.signedUrl || null };
    }),
  );
  return { items, count: result.count || 0 };
});
