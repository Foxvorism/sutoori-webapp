import sharp from "sharp";
import { createError } from "h3";
import { fileTypeFromBuffer } from "file-type";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function inspectUpload(data: Buffer) {
  const kind = await fileTypeFromBuffer(data).catch(() => undefined);
  const image =
    kind && ["image/jpeg", "image/png", "image/webp"].includes(kind.mime);
  const video = kind && ["video/mp4", "video/webm"].includes(kind.mime);
  if (!kind || (!image && !video))
    throw createError({
      statusCode: 400,
      statusMessage: "Upload a JPEG, PNG, WebP, MP4, or WebM file.",
    });
  if (data.length > (image ? 15 : 50) * 1024 * 1024)
    throw createError({
      statusCode: 413,
      statusMessage: image
        ? "Images must be under 15 MB."
        : "Videos must be under 50 MB.",
    });
  return { ...kind, image: !!image };
}
export async function imageDerivatives(data: Buffer) {
  const kind = await inspectUpload(data);
  if (!kind.image)
    throw createError({
      statusCode: 400,
      statusMessage: "The video poster must be an image.",
    });
  try {
    // Decode and re-encode; strip EXIF and limit decompression before storing public images.
    const image = sharp(data, {
      limitInputPixels: 40000000,
      failOn: "warning",
    }).rotate();
    const full = await image
      .clone()
      .resize({
        width: 1920,
        height: 1920,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 84 })
      .toBuffer({ resolveWithObject: true });
    const thumb = await image
      .clone()
      .resize({
        width: Math.min(1024, full.info.width),
        withoutEnlargement: true,
      })
      .webp({ quality: 78 })
      .toBuffer();
    return {
      full: full.data,
      thumb,
      width: full.info.width,
      height: full.info.height,
    };
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage:
        "This image is damaged or too large to decode. Choose another image.",
    });
  }
}
export async function removeObjects(
  db: SupabaseClient,
  bucket: string,
  paths: string[],
) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return;
  const { error } = await db.storage.from(bucket).remove(unique);
  if (error)
    throw createError({
      statusCode: 503,
      statusMessage:
        "Storage cleanup is pending. Retry unpublish or delete to finish. Cached public files may remain briefly available.",
    });
}
