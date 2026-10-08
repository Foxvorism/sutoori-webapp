import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { defaultSettings, whatsappLink } from "../shared/content";
import {
  canPublish,
  mediaSchema,
  packageSchema,
  settingsSchema,
  uploadSchema,
} from "../shared/validation";
import { inspectUpload, imageDerivatives } from "../server/utils/media";

test("contact links require approval and encode contextual messages", () => {
  assert.equal(whatsappLink(defaultSettings), null);
  const settings = {
    ...defaultSettings,
    contacts_verified: true,
    whatsapp: "6281213280154",
  };
  const url = new URL(whatsappLink(settings, "Photo & film / wedding")!);
  assert.equal(url.hostname, "wa.me");
  assert.equal(url.pathname, "/6281213280154");
  assert.equal(
    url.searchParams.get("text"),
    "Hi Sutoori! I'd like to discuss a project. I'm interested in Photo & film / wedding.",
  );
  assert.equal(whatsappLink({ ...settings, whatsapp: "62?text=evil" }), null);
});
test("publish requires completed files, category, title, and meaningful image alt text", () => {
  const valid = {
    title: "Graduation",
    alt_text: "Students celebrating outdoors",
    media_type: "image",
    category_id: "category",
  };
  assert.equal(canPublish(valid, true), true);
  for (const item of [
    { ...valid, title: " " },
    { ...valid, alt_text: " " },
    { ...valid, category_id: null },
  ])
    assert.equal(canPublish(item, true), false);
  assert.equal(canPublish(valid, false), false);
  assert.equal(
    mediaSchema.safeParse({ ...valid, status: "published" }).success,
    false,
  );
});
test("settings and money reject unsafe or invalid input", () => {
  const { id, ...settings } = defaultSettings;
  assert.equal(settingsSchema.safeParse(settings).success, true);
  assert.equal(
    settingsSchema.safeParse({ ...settings, instagram: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(
    settingsSchema.safeParse({ ...settings, contacts_verified: true }).success,
    false,
  );
  assert.equal(
    settingsSchema.safeParse({ ...settings, html: "<script>1</script>" })
      .success,
    false,
  );
  const pkg = {
    title: "Confirmed package",
    service_id: null,
    inclusions: ["Photos"],
    amount: null,
    currency: "IDR",
    price_qualifier: "",
    sort_order: 0,
    visible: false,
  };
  assert.equal(packageSchema.safeParse(pkg).success, true);
  assert.equal(packageSchema.safeParse({ ...pkg, amount: -1 }).success, false);
});
test("uploads validate bytes and produce real smaller derivatives", async () => {
  const file = { name: "photo.jpg", type: "image/jpeg", size: 8 * 1024 * 1024 };
  assert.equal(uploadSchema.safeParse({ file, poster: null }).success, true);
  assert.equal(uploadSchema.safeParse({ file: { ...file, size: 16 * 1024 * 1024 }, poster: null }).success, false);
  assert.equal(uploadSchema.safeParse({ file: { ...file, type: "image/svg+xml" }, poster: null }).success, false);
  const video = { name: "film.mp4", type: "video/mp4", size: 50 * 1024 * 1024 };
  assert.equal(uploadSchema.safeParse({ file: video, poster: null }).success, false);
  assert.equal(uploadSchema.safeParse({ file: video, poster: file }).success, true);
  assert.equal(uploadSchema.safeParse({ file: video, poster: { ...file, size: 16 * 1024 * 1024 } }).success, false);
  assert.equal(uploadSchema.safeParse({ file, poster: null, path: "somebody-elses-file" }).success, false);
  await assert.rejects(() =>
    inspectUpload(Buffer.from('<svg onload="alert(1)"></svg>')),
  );
  await assert.rejects(() =>
    inspectUpload(Buffer.from("<html>not a JPEG</html>")),
  );
  const image = await sharp({
    create: { width: 2400, height: 1600, channels: 3, background: "#093282" },
  })
    .png()
    .toBuffer();
  assert.equal((await inspectUpload(image)).mime, "image/png");
  const result = await imageDerivatives(image);
  const full = await sharp(result.full).metadata();
  const thumb = await sharp(result.thumb).metadata();
  assert.equal(full.width, 1920);
  assert.equal(thumb.width, 1024);
  assert.equal(full.format, "webp");
  assert.equal(full.exif, undefined);
  const oversized = Buffer.alloc(16 * 1024 * 1024);
  image.copy(oversized);
  await assert.rejects(() => inspectUpload(oversized), /15 MB/);
});
