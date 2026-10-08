import {
  defaultServices,
  defaultSettings,
  portfolioMedia,
  portfolioHero,
} from "../../shared/content";
import type {
  MediaItem,
  Settings,
  Service,
  Package,
} from "../../shared/content";

export default defineEventHandler(async (event) => {
  const fallback = {
    settings: defaultSettings,
    services: defaultServices,
    packages: [] as Package[],
    media: portfolioMedia,
    featured: portfolioMedia,
    hero: portfolioHero,
    showreel: null as MediaItem | null,
    unavailable: false,
  };
  const db = createSupabasePublic(event);
  if (!db) return fallback;
  const results = await Promise.all([
    db.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("services").select("*").eq("visible", true).order("sort_order"),
    db.from("packages").select("*").eq("visible", true).order("sort_order"),
    db
      .from("media_items")
      .select("*,categories(name,slug)")
      .eq("status", "published")
      .eq("featured", true)
      .order("sort_order")
      .order("id")
      .limit(8),
  ]);
  if (results.some((r) => r.error)) {
    console.error("Public content unavailable");
    return { ...fallback, unavailable: true };
  }
  const settings = (results[0]!.data || defaultSettings) as Settings;
  const refs = [
    settings.hero_media_id,
    settings.showreel_media_id,
    ...(results[1]!.data as Service[]).map((s) => s.cover_media_id),
  ].filter(Boolean) as string[];
  const extra = refs.length
    ? await db
        .from("media_items")
        .select("*,categories(name,slug)")
        .eq("status", "published")
        .in("id", refs)
    : { data: [], error: null };
  const format = (row: any): MediaItem => ({
    ...row,
    url: row.public_path
      ? db.storage.from("portfolio").getPublicUrl(row.public_path).data
          .publicUrl
      : undefined,
    thumbnail: row.thumbnail_path
      ? db.storage.from("portfolio").getPublicUrl(row.thumbnail_path).data
          .publicUrl
      : undefined,
  });
  const featured = (results[3]!.data as unknown as MediaItem[]).map(format);
  const media = [...featured, ...(extra.data || []).map(format)];
  return {
    settings,
    services: results[1]!.data as Service[],
    packages: results[2]!.data as Package[],
    media,
    featured: featured.length ? featured : portfolioMedia,
    hero:
      media.find(
        (m) => m.id === settings.hero_media_id && m.media_type === "image",
      ) ||
      featured.find((m) => m.media_type === "image") ||
      fallback.hero,
    showreel:
      media.find(
        (m) => m.id === settings.showreel_media_id && m.media_type === "video",
      ) || null,
    unavailable: !!extra.error,
  };
});
