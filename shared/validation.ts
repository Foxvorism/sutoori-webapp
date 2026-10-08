import { z } from "zod";
const text = (max: number) => z.string().trim().max(max);
const name = text(160).min(1);
const uuid = z.string().uuid();
const order = z.number().int().min(-100000).max(100000);
const uploadFileSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]),
  size: z.number().int().positive(),
}).strict().refine(v => v.size <= (v.type.startsWith("image/") ? 15 : 50) * 1024 * 1024, "Images must be under 15 MB; videos under 50 MB.");
export const uploadSchema = z.object({
  file: uploadFileSchema,
  poster: uploadFileSchema.nullable(),
}).strict().refine(v => !v.poster || v.poster.type.startsWith("image/"), "The poster must be an image.")
  .refine(v => v.file.type.startsWith("image/") || !!v.poster, "Add a poster image for this video.");
export const mediaSchema = z
  .object({
    title: name,
    caption: text(2000),
    alt_text: text(500),
    category_id: uuid.nullable(),
    featured: z.boolean(),
    sort_order: order,
    focal_x: z.number().min(0).max(100),
    focal_y: z.number().min(0).max(100),
  })
  .strict();
export const categorySchema = z
  .object({
    name,
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(80),
    sort_order: order,
    active: z.boolean(),
  })
  .strict();
export const serviceSchema = z
  .object({
    name,
    slug: categorySchema.shape.slug,
    description: text(2000).min(1),
    cover_media_id: uuid.nullable(),
    sort_order: order,
    visible: z.boolean(),
  })
  .strict();
export const packageSchema = z
  .object({
    title: name,
    service_id: uuid.nullable(),
    inclusions: z.array(name).min(1).max(30),
    amount: z.number().finite().min(0).max(1e12).nullable(),
    currency: z.enum(["IDR", "USD"]),
    price_qualifier: text(80),
    sort_order: order,
    visible: z.boolean(),
  })
  .strict();
export const settingsSchema = z
  .object({
    headline: text(140).min(1),
    supporting_copy: text(500).min(1),
    about: text(3000).min(1),
    process: z
      .array(z.object({ title: name, description: text(500).min(1) }).strict())
      .min(1)
      .max(6),
    whatsapp: z.union([z.literal(""), z.string().regex(/^[1-9]\d{7,14}$/)]),
    message_template: text(500).min(1),
    email: z.union([z.literal(""), z.string().email().max(254)]),
    instagram: z
      .string()
      .url()
      .refine((v) => {
        const u = new URL(v);
        return (
          u.protocol === "https:" &&
          u.hostname === "www.instagram.com" &&
          !u.username &&
          !u.password
        );
      }, "Use an https://www.instagram.com/ URL"),
    contacts_verified: z.boolean(),
    hero_media_id: uuid.nullable(),
    showreel_media_id: uuid.nullable(),
  })
  .strict()
  .refine(
    (v) => !v.contacts_verified || (!!v.whatsapp && !!v.email),
    "Fill and verify WhatsApp and email before enabling contacts",
  );
export function canPublish(
  item: {
    title: string;
    alt_text: string;
    media_type: string;
    category_id: string | null;
  },
  ready: boolean,
) {
  return (
    ready &&
    !!item.title.trim() &&
    !!item.category_id &&
    (item.media_type !== "image" || !!item.alt_text.trim())
  );
}
