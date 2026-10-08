import { randomUUID } from "node:crypto";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  const { db } = await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!z.string().uuid().safeParse(id).success) throw createError({ statusCode: 400 });
  const operation = randomUUID();
  const lock = await db.rpc("lock_media", { item_id: id, operation });
  dbError(lock.error);
  if (!lock.data) throw createError({ statusCode: 409, statusMessage: "Another operation is in progress, or this draft no longer exists." });
  try {
    const source = await db.from("media_sources").select("*,media_items!inner(status,media_type)").eq("media_id", id!).single();
    dbError(source.error);
    const current = source.data;
    if (current.media_items.status !== "draft") throw createError({ statusCode: 409, statusMessage: "Only a draft can finish uploading." });
    if (current.ready) return { ok: true };
    const original = await db.storage.from("originals").download(current.original_path);
    dbError(original.error);
    const image = current.media_items.media_type === "image";
    if (original.data!.size > (image ? 15 : 50) * 1024 * 1024)
      throw createError({ statusCode: 413, statusMessage: "Images must be under 15 MB; videos under 50 MB." });
    const bytes = Buffer.from(await original.data!.arrayBuffer());
    const kind = await inspectUpload(bytes);
    if (kind.mime !== current.mime || kind.image !== image)
      throw createError({ statusCode: 400, statusMessage: "The file contents do not match the selected format. Delete this draft and choose a valid file." });
    let posterBytes = bytes;
    if (!image) {
      const poster = await db.storage.from("originals").download(`${id}/poster`);
      dbError(poster.error);
      if (poster.data!.size > 15 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: "Poster images must be under 15 MB." });
      posterBytes = Buffer.from(await poster.data!.arrayBuffer());
    }
    const derivatives = await imageDerivatives(posterBytes);
    const files = [{ path: current.thumbnail_path, data: derivatives.thumb }];
    if (image) files.push({ path: current.display_path, data: derivatives.full });
    for (const file of files) {
      const uploaded = await db.storage.from("originals").upload(file.path, file.data, { contentType: "image/webp", cacheControl: "60", upsert: true });
      dbError(uploaded.error);
    }
    const dimensions = await db.from("media_items").update({ width: derivatives.width, height: derivatives.height }).eq("id", id!);
    dbError(dimensions.error);
    const ready = await db.from("media_sources").update({ ready: true }).eq("media_id", id!).eq("operation_id", operation);
    dbError(ready.error);
    return { ok: true };
  } finally {
    await db.from("media_sources").update({ operation_id: null, locked_at: null }).eq("media_id", id!).eq("operation_id", operation);
  }
});
