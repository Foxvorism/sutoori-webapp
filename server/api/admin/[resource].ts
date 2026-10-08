import { z } from "zod";
import {
  categorySchema,
  serviceSchema,
  packageSchema,
  settingsSchema,
} from "../../../shared/validation";
const schemas = {
  categories: categorySchema,
  services: serviceSchema,
  packages: packageSchema,
  settings: settingsSchema,
};
export default defineEventHandler(async (event) => {
  const { db } = await requireAdmin(event);
  const resource = getRouterParam(event, "resource") as keyof typeof schemas;
  if (!Object.hasOwn(schemas, resource)) throw createError({ statusCode: 404 });
  const table = resource === "settings" ? "site_settings" : resource;
  if (event.method === "GET") {
    const query = db.from(table).select("*");
    const result =
      resource === "settings"
        ? await query.eq("id", 1).maybeSingle()
        : await query.order("sort_order").order("id").limit(500);
    dbError(result.error);
    return result.data;
  }
  if (!["POST", "PUT", "DELETE"].includes(event.method))
    throw createError({ statusCode: 405 });
  const body = await readBody(event);
  const id = resource === "settings" ? 1 : body?.id;
  if (id && resource !== "settings" && !z.string().uuid().safeParse(id).success)
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid content ID.",
    });
  if (event.method === "DELETE") {
    if (!id || resource === "settings") throw createError({ statusCode: 400 });
    const result = await db.from(table).delete().eq("id", id);
    dbError(result.error);
    return { ok: true };
  }
  const { id: ignored, ...fields } = body || {};
  const parsed = schemas[resource].safeParse(fields);
  if (!parsed.success)
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")
        .slice(0, 500),
    });
  const value = parsed.data;
  const refs: { id: string; type: string | null }[] = [];
  if ("cover_media_id" in value && value.cover_media_id)
    refs.push({ id: value.cover_media_id, type: "image" });
  if ("hero_media_id" in value && value.hero_media_id)
    refs.push({ id: value.hero_media_id, type: "image" });
  if ("showreel_media_id" in value && value.showreel_media_id)
    refs.push({ id: value.showreel_media_id, type: "video" });
  for (const ref of refs) {
    const media = await db
      .from("media_items")
      .select("status,media_type")
      .eq("id", ref.id)
      .maybeSingle();
    dbError(media.error);
    if (
      !media.data ||
      media.data.status !== "published" ||
      media.data.media_type !== ref.type
    )
      throw createError({
        statusCode: 400,
        statusMessage: `Choose a published ${ref.type}.`,
      });
  }
  const payload: Record<string, unknown> = { ...value, ...(id ? { id } : {}) };
  const result = id
    ? await db.from(table).upsert(payload).select().single()
    : await db.from(table).insert(payload).select().single();
  dbError(result.error);
  return result.data;
});
