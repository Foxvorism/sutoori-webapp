import { randomUUID } from "node:crypto";
import { z } from "zod";
import { mediaSchema, canPublish } from "../../../../shared/validation";
export default defineEventHandler(async (event) => {
  const { db } = await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!z.string().uuid().safeParse(id).success)
    throw createError({ statusCode: 400 });
  const item = await db
    .from("media_items")
    .select("*")
    .eq("id", id!)
    .maybeSingle();
  dbError(item.error);
  const source = await db
    .from("media_sources")
    .select("*")
    .eq("media_id", id!)
    .maybeSingle();
  dbError(source.error);
  if (!item.data) throw createError({ statusCode: 404 });
  if (event.method === "GET") {
    const preview = source.data?.ready
      ? await db.storage
          .from("originals")
          .createSignedUrl(source.data.display_path, 600)
      : null;
    const thumb = source.data?.ready
      ? await db.storage
          .from("originals")
          .createSignedUrl(source.data.thumbnail_path, 600)
      : null;
    return {
      ...item.data,
      ready: !!source.data?.ready,
      url: preview?.data?.signedUrl || "",
      thumbnail: thumb?.data?.signedUrl || "",
    };
  }
  if (!["PUT", "POST", "DELETE"].includes(event.method))
    throw createError({ statusCode: 405 });
  // A failed manifest insertion leaves no objects and can be safely retried as a delete.
  if (!source.data) {
    if (event.method === "DELETE") {
      const removed = await db.from("media_items").delete().eq("id", id!);
      dbError(removed.error);
      return { ok: true };
    }
    throw createError({
      statusCode: 409,
      statusMessage:
        "Incomplete upload. Delete this draft and upload it again.",
    });
  }
  const operation = randomUUID();
  const locked = await db.rpc("lock_media", { item_id: id, operation });
  dbError(locked.error);
  if (!locked.data)
    throw createError({
      statusCode: 409,
      statusMessage: "Another operation is in progress. Retry shortly.",
    });
  try {
    // Re-read after acquiring the lease to avoid acting on stale status.
    const latest = await db
      .from("media_items")
      .select("*")
      .eq("id", id!)
      .single();
    dbError(latest.error);
    const current = latest.data;
    if (event.method === "PUT") {
      const parsed = mediaSchema.safeParse(await readBody(event));
      if (!parsed.success)
        throw createError({
          statusCode: 400,
          statusMessage: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; ")
            .slice(0, 500),
        });
      if (current.status === "deleting")
        throw createError({
          statusCode: 409,
          statusMessage: "Finish deleting this item first.",
        });
      if (
        current.status === "published" &&
        !canPublish({ ...current, ...parsed.data }, source.data.ready)
      )
        throw createError({
          statusCode: 400,
          statusMessage:
            "Published images require a title, category, and alt text.",
        });
      const result = await db
        .from("media_items")
        .update(parsed.data)
        .eq("id", id!);
      dbError(result.error);
      return { ok: true };
    }
    const action =
      event.method === "DELETE" ? "delete" : (await readBody(event))?.action;
    if (!["publish", "unpublish", "delete"].includes(action))
      throw createError({ statusCode: 400 });
    const publicDisplay = `${id}/${current.media_type === "image" ? "display.webp" : `video.${source.data.mime === "video/mp4" ? "mp4" : "webm"}`}`;
    const publicThumb = `${id}/thumbnail.webp`;
    if (action === "publish") {
      if (current.status === "deleting")
        throw createError({
          statusCode: 409,
          statusMessage: "Finish deleting this item first.",
        });
      if (!canPublish(current, source.data.ready))
        throw createError({
          statusCode: 400,
          statusMessage:
            "Save a title, category, and image alt text before publishing. The upload must be complete.",
        });
      const category = await db
        .from("categories")
        .select("active")
        .eq("id", current.category_id)
        .maybeSingle();
      dbError(category.error);
      if (!category.data?.active)
        throw createError({
          statusCode: 400,
          statusMessage: "Choose an active category before publishing.",
        });
      if (current.status === "published") return { ok: true };
      // Record public paths before copying: a partial failure can be cleaned by unpublish/delete.
      const manifest = await db
        .from("media_items")
        .update({ public_path: publicDisplay, thumbnail_path: publicThumb })
        .eq("id", id!);
      dbError(manifest.error);
      try {
        for (const [from, to, type] of [
          [
            source.data.display_path,
            publicDisplay,
            current.media_type === "image" ? "image/webp" : source.data.mime,
          ],
          [source.data.thumbnail_path, publicThumb, "image/webp"],
        ]) {
          const downloaded = await db.storage.from("originals").download(from!);
          dbError(downloaded.error);
          const uploaded = await db.storage
            .from("portfolio")
            .upload(to!, downloaded.data!, {
              contentType: type,
              cacheControl: "60",
              upsert: true,
            });
          dbError(uploaded.error);
        }
        const published = await db
          .from("media_items")
          .update({ status: "published" })
          .eq("id", id!);
        dbError(published.error);
      } catch {
        try {
          const rollback = await db
            .from("media_items")
            .update({ status: "draft" })
            .eq("id", id!);
          dbError(rollback.error);
          await removeObjects(db, "portfolio", [publicDisplay, publicThumb]);
          const cleared = await db
            .from("media_items")
            .update({ public_path: null, thumbnail_path: null })
            .eq("id", id!);
          dbError(cleared.error);
        } catch {
          throw createError({
            statusCode: 503,
            statusMessage:
              "Publication failed and cleanup is pending. Reload this item, then use Unpublish / clean public files.",
          });
        }
        throw createError({
          statusCode: 503,
          statusMessage:
            "Publication failed. Public copies were removed; the draft is safe to retry.",
        });
      }
      return { ok: true };
    }
    // Hide content first. Keep the manifest until all storage removals succeed; retry is safe.
    const hidden = await db
      .from("media_items")
      .update({ status: action === "delete" ? "deleting" : "draft" })
      .eq("id", id!);
    dbError(hidden.error);
    await removeObjects(db, "portfolio", [publicDisplay, publicThumb]);
    if (action === "delete") {
      await removeObjects(db, "originals", [
        source.data.original_path,
        source.data.display_path,
        source.data.thumbnail_path,
        `${id}/poster`,
      ]);
      const removed = await db.from("media_items").delete().eq("id", id!);
      dbError(removed.error);
    } else {
      const cleared = await db
        .from("media_items")
        .update({ public_path: null, thumbnail_path: null })
        .eq("id", id!);
      dbError(cleared.error);
    }
    return { ok: true };
  } finally {
    await db
      .from("media_sources")
      .update({ operation_id: null, locked_at: null })
      .eq("media_id", id!)
      .eq("operation_id", operation);
  }
});
