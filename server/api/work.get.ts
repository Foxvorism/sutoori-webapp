import { z } from "zod";
import { portfolioMedia } from "../../shared/content";
import type { GalleryResponse } from "../../shared/content";
export default defineEventHandler(async (event): Promise<GalleryResponse> => {
  const parsed = z
    .object({
      category: z.string().max(80).default("all"),
      page: z.coerce.number().int().min(1).max(10000).default(1),
    })
    .safeParse(getQuery(event));
  if (!parsed.success)
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid gallery filter.",
    });
  const { category, page } = parsed.data;
  const fallback = () => {
    const items = portfolioMedia.filter(
          (m) => category === "all" || m.categories?.slug === category,
        );
    return {
      items: page === 1 ? items : [],
      count: items.length,
      categories: portfolioMedia.map((m) => ({
            name: m.categories!.name,
            slug: m.categories!.slug,
          })),
      unavailable: false,
    };
  };
  const db = createSupabasePublic(event);
  if (!db) return fallback();
  // Inner relation returns only categories that contain published media; filtering is server-side.
  const cats = await db
    .from("categories")
    .select("id,name,slug,media_items!inner(id)")
    .eq("active", true)
    .eq("media_items.status", "published")
    .order("sort_order");
  if (cats.error) return { ...fallback(), unavailable: true };
  const categories = (cats.data || []).map(({ id, name, slug }) => ({
    id,
    name,
    slug,
  }));
  const total = await db
    .from("media_items")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (total.error) return { ...fallback(), unavailable: true };
  if (total.count === 0) return fallback();
  const selected = categories.find((c) => c.slug === category);
  if (category !== "all" && !selected)
    return { items: [], count: 0, categories, unavailable: false };
  let query = db
    .from("media_items")
    .select("*,categories(name,slug)", { count: "exact" })
    .eq("status", "published")
    .order("sort_order")
    .order("id")
    .range((page - 1) * 24, page * 24 - 1);
  if (selected) query = query.eq("category_id", selected.id);
  const { data, error, count } = await query;
  if (error)
    throw createError({
      statusCode: 503,
      statusMessage: "The gallery is temporarily unavailable. Please retry.",
    });
  return {
    items: (data || []).map((m) => ({
      ...m,
      url: db.storage.from("portfolio").getPublicUrl(m.public_path).data
        .publicUrl,
      thumbnail: db.storage.from("portfolio").getPublicUrl(m.thumbnail_path)
        .data.publicUrl,
    })) as GalleryResponse["items"],
    count: count || 0,
    categories,
    unavailable: false,
  };
});
