// Live integration check. Use dedicated, provisioned test accounts on a test project.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import sharp from "sharp";
const env = process.env;
for (const key of [
  "NUXT_PUBLIC_SUPABASE_URL",
  "NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "TEST_ADMIN_EMAIL",
  "TEST_ADMIN_PASSWORD",
  "TEST_MEMBER_EMAIL",
  "TEST_MEMBER_PASSWORD",
]) {
  if (!env[key])
    throw new Error(
      `Missing ${key}. See README; this test requires a real configured backend.`,
    );
}
const origin = env.TEST_BASE_URL || "http://127.0.0.1:3017";
const client = () =>
  createClient(
    env.NUXT_PUBLIC_SUPABASE_URL,
    env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
const anon = client(),
  member = client(),
  admin = client();
const adminSession = await admin.auth.signInWithPassword({
  email: env.TEST_ADMIN_EMAIL,
  password: env.TEST_ADMIN_PASSWORD,
});
const memberSession = await member.auth.signInWithPassword({
  email: env.TEST_MEMBER_EMAIL,
  password: env.TEST_MEMBER_PASSWORD,
});
assert.ifError(adminSession.error);
assert.ifError(memberSession.error);
const token = adminSession.data.session.access_token;
const call = async (path, method = "GET", body, access = token) => {
  const response = await fetch(`${origin}/api/admin/${path}`, {
    method,
    headers: {
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });
  return { response, data: await response.json() };
};
const ok = async (...args) => {
  const result = await call(...args);
  assert.equal(result.response.ok, true, JSON.stringify(result.data));
  return result.data;
};
const startUpload = (file, poster = null) => ok("media", "POST", {
  file: { name: file.name, type: file.type, size: file.size },
  poster: poster ? { name: poster.name, type: poster.type, size: poster.size } : null,
});
const sendUpload = async (pending, file) => {
  const sent = await admin.storage.from("originals").uploadToSignedUrl(pending.upload.path, pending.upload.token, file, { contentType: file.type, cacheControl: "60" });
  assert.ifError(sent.error);
};
assert.equal(
  (await call("session", "GET", undefined, "")).response.status,
  401,
);
assert.equal(
  (
    await call(
      "session",
      "GET",
      undefined,
      memberSession.data.session.access_token,
    )
  ).response.status,
  403,
);
assert.equal(
  (await call("session", "GET", undefined, "not-a-token")).response.status,
  401,
);
let mediaId, categoryId, invalidId;
try {
  const category = await ok("categories", "POST", {
    name: "Integration check",
    slug: `integration-${Date.now()}`,
    sort_order: 100000,
    active: true,
  });
  categoryId = category.id;
  const bad = new File(['<svg onload="alert(1)"></svg>'], "fake.jpg", { type: "image/jpeg" });
  const invalid = await startUpload(bad);
  invalidId = invalid.id;
  await sendUpload(invalid, bad);
  assert.equal((await call(`media/${invalidId}/complete`, "POST")).response.status, 400);
  const failedPublish = await call(`media/${invalidId}`, "POST", { action: "publish" });
  assert.equal(failedPublish.response.status, 400);
  await ok(`media/${invalidId}`, "DELETE");
  invalidId = undefined;
  // A real image larger than Vercel's request limit must travel straight to Storage.
  const imageBytes = await sharp(randomBytes(2400 * 1600 * 3), { raw: { width: 2400, height: 1600, channels: 3 } }).png().toBuffer();
  assert.ok(imageBytes.length > 4.5 * 1024 * 1024);
  const file = new File([imageBytes], "integration.png", { type: "image/png" });
  const pending = await startUpload(file);
  mediaId = pending.id;
  assert.equal((await call(`media/${mediaId}/complete`, "POST", undefined, "")).response.status, 401);
  assert.equal((await call(`media/${mediaId}/complete`, "POST", undefined, memberSession.data.session.access_token)).response.status, 403);
  await sendUpload(pending, file);
  await ok(`media/${mediaId}/complete`, "POST");
  await ok(`media/${mediaId}/complete`, "POST");
  for (const identity of [anon, member]) {
    const draft = await identity
      .from("media_items")
      .select("*")
      .eq("id", mediaId);
    assert.ifError(draft.error);
    assert.deepEqual(draft.data, []);
    const write = await identity
      .from("media_items")
      .insert({ title: "unauthorized", media_type: "image" });
    assert.ok(write.error);
    const escalate = await identity
      .from("admin_members")
      .insert({ user_id: memberSession.data.user.id });
    assert.ok(escalate.error);
    const sources = await identity
      .from("media_sources")
      .select("*")
      .eq("media_id", mediaId);
    assert.ok(sources.error || sources.data.length === 0);
    const upload = await identity.storage
      .from("originals")
      .upload(`${mediaId}/forbidden.webp`, new Uint8Array([1]), {
        contentType: "image/webp",
      });
    assert.ok(upload.error);
    const publicUpload = await identity.storage
      .from("portfolio")
      .upload(`${mediaId}/forbidden.webp`, new Uint8Array([1]), {
        contentType: "image/webp",
      });
    assert.ok(publicUpload.error);
  }
  assert.ok(
    (
      await admin
        .from("media_items")
        .update({ status: "published" })
        .eq("id", mediaId)
    ).error,
    "Even admins must use the validated publishing endpoint",
  );
  const source = await admin
    .from("media_sources")
    .select("*")
    .eq("media_id", mediaId)
    .single();
  assert.ifError(source.error);
  for (const identity of [anon, member])
    assert.ok(
      (
        await identity.storage
          .from("originals")
          .download(source.data.original_path)
      ).error,
    );
  assert.equal(
    (await call(`media/${mediaId}`, "POST", { action: "publish" })).response
      .status,
    400,
  );
  await ok(`media/${mediaId}`, "PUT", {
    title: "Integration check",
    caption: "Temporary test media",
    alt_text: "Friends outdoors, test placeholder",
    category_id: categoryId,
    featured: false,
    sort_order: 100000,
    focal_x: 40,
    focal_y: 60,
  });
  const preview = await ok(`media/${mediaId}`);
  assert.ok(preview.url.includes("/object/sign/"));
  assert.equal((await fetch(preview.url)).ok, true);
  await ok(`media/${mediaId}`, "POST", { action: "publish" });
  const published = await anon
    .from("media_items")
    .select("*")
    .eq("id", mediaId)
    .single();
  assert.ifError(published.error);
  assert.equal(published.data.status, "published");
  assert.equal("original_path" in published.data, false);
  const fullUrl = anon.storage
    .from("portfolio")
    .getPublicUrl(published.data.public_path).data.publicUrl;
  const thumbUrl = anon.storage
    .from("portfolio")
    .getPublicUrl(published.data.thumbnail_path).data.publicUrl;
  const full = await sharp(
    Buffer.from(await (await fetch(fullUrl)).arrayBuffer()),
  ).metadata();
  const thumb = await sharp(
    Buffer.from(await (await fetch(thumbUrl)).arrayBuffer()),
  ).metadata();
  assert.ok(full.width > thumb.width);
  await ok(`media/${mediaId}`, "POST", { action: "unpublish" });
  const hidden = await anon.from("media_items").select("id").eq("id", mediaId);
  assert.deepEqual(hidden.data, []);
  console.log(
    "PASS: live auth, membership, RLS, private storage, signed upload larger than 4.5 MB, spoof rejection, idempotent completion, preview, publish, derivatives, and unpublish. CDN revocation is not asserted.",
  );
} finally {
  if (mediaId) await ok(`media/${mediaId}`, "DELETE");
  if (invalidId) await ok(`media/${invalidId}`, "DELETE");
  if (categoryId) await ok("categories", "DELETE", { id: categoryId });
  await Promise.all([admin.auth.signOut(), member.auth.signOut()]);
}
