import { randomUUID } from "node:crypto";
import { uploadSchema } from "../../../../shared/validation";

export default defineEventHandler(async (event) => {
  const { db } = await requireAdmin(event);
  const parsed = uploadSchema.safeParse(await readBody(event));
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: parsed.error.issues.map(i => i.message).join("; ").slice(0, 500) });
  const { file } = parsed.data;
  const image = file.type.startsWith("image/");
  const id = randomUUID();
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" }[file.type];
  const original = `${id}/original.${extension}`;
  const inserted = await db.from("media_items").insert({
    id, title: file.name.replace(/\.[^.]+$/, "").slice(0, 160), media_type: image ? "image" : "video",
  }).select().single();
  dbError(inserted.error);
  const manifest = await db.from("media_sources").insert({
    media_id: id, original_path: original, display_path: image ? `${id}/display.webp` : original,
    thumbnail_path: `${id}/thumbnail.webp`, mime: file.type,
  });
  if (manifest.error) {
    await db.from("media_items").delete().eq("id", id);
    dbError(manifest.error);
  }
  // Tokens permit new objects only at server-generated private paths. No bucket write policy is added.
  const upload = await db.storage.from("originals").createSignedUploadUrl(original, { upsert: false });
  dbError(upload.error);
  const poster = image ? null : await db.storage.from("originals").createSignedUploadUrl(`${id}/poster`, { upsert: false });
  dbError(poster?.error || null);
  return { id, upload: upload.data, poster: poster?.data || null };
});
