# Sutoori Production

Nuxt 4 public portfolio and Supabase content studio: English copy, supplied logo assets, GSAP scroll storytelling, a filterable gallery, accessible lightbox, and an authenticated dashboard.

## Run locally

Use Node 22.12+ and npm. Checked on Windows with Node 26.4.0. Nuxt is pinned to the starter's **4.5.2**.

```powershell
npm ci
Copy-Item .env.example .env
npm run dev
```

Without Supabase, the public website works with seven supplied portfolio photographs and approved service copy. Login explains the missing configuration. There is no fake login or in-memory upload backend.

`SUTOORI_MASTER.md` is a local copy of the owner's brief, ignored by Git. Environment files and screenshots/logs in `.tmp/` are also ignored.

## Connect Supabase

1. Use a Supabase project you control. No paid resources or deployment are created by this repository.
2. Execute `supabase/migrations/202610070001_content.sql` once in the Supabase SQL editor, then `supabase/seed.sql`. Seed is repeatable: services and unverified draft contact defaults only, no invented packages or projects.
3. Disable public sign-ups in Supabase Auth. Create the owner's email/password account through the trusted dashboard.
4. Provision membership in the trusted SQL editor:

```sql
insert into public.admin_members (user_id)
select id from auth.users where email = 'OWNER_EMAIL_HERE'
on conflict do nothing;
```

5. Fill `.env` from that same project and restart Nuxt.
6. Visit `/admin/login`. Add categories, upload media, fill title/category/alt text, then publish. Choose featured images and a hero.
7. Verify **6281213280154** and **sutooriproduction@gmail.com** with the owner before checking the approval box in Site settings. Until approval, settings remain private and public pages use default copy and Instagram only.

| Variable | Purpose |
| --- | --- |
| `NUXT_SUPABASE_URL` | Server project URL. |
| `NUXT_PUBLIC_SUPABASE_URL` | Same project URL for browser auth and anonymous public queries. |
| `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable/legacy anon key. |
| `NUXT_SUPABASE_SECRET_KEY` | Server-only secret/legacy service-role key. Never prefix with PUBLIC. |
| `NUXT_PUBLIC_SITE_URL` | Final HTTPS origin; enables canonical URLs, social-image URLs, and sitemap. |

Use the Supabase dashboard's trusted invite/password-reset workflow for account recovery.

## Workflow

- **Media:** batch uploads with per-file progress/errors, persistent drafts, private preview, captions, required image alt text, category, featured state, order, focal point, publish/unpublish/delete. Lower order numbers come first.
- **Services/packages:** add, edit, order, hide, and delete. Covers require published images. Empty amounts display “Request a Quote”; inclusions are one per line.
- **Site settings:** headline, supporting copy, about, process, approved contacts, WhatsApp message, hero photo, and an uploaded showreel. Showreels have posters and visitor-controlled playback.
- **Gallery:** URL-based filters query the whole dataset, 24 items per request, load more, keyboard lightbox, focus/scroll restoration. Filters only show categories containing published work.
- **Motion:** client-only GSAP; desktop work pins only with overflow. Mobile flows vertically. Reduced motion skips pin/scrub/reveals. Cleanup runs on route departure and refreshes after media/fonts/resize.
- Public API responses use no-store. A new page visit reads current publication state.

## Storage and authorization

Every admin endpoint validates its bearer token with Supabase getUser and checks admin_members. Route middleware only improves navigation. Anonymous and ordinary authenticated users cannot mutate content, grant membership, or access private drafts. Even admins write through validated server endpoints; there are no direct browser database/storage write policies.

Private originals and manifests live in the originals bucket and media_sources table. Public media rows contain only derivative paths. Published derivatives live in the separate portfolio bucket. Do not add permissive storage policies.

JPEG/PNG/WebP: up to 15 MB; byte-level format detection, full image decode, 40-megapixel ceiling, EXIF removal, actual WebP derivatives via Sharp. Display images fit within 1920×1920; thumbnails are at most 1024 pixels wide so high-density mobile displays can use them instead of full-size files. No paid resize service is required.

MP4/WebM: up to 50 MB, with a separately validated poster image. Container MIME is detected from bytes. There is **no video transcoding, full codec validation, or malware scanning**. Use browser-compatible exports. Larger externally hosted showreels require a separately approved hosting integration.

Uploads go directly from the browser to the private originals bucket using server-issued, non-overwriting signed upload URLs. The app API receives only metadata and a completion request, so file bytes do not pass through Vercel's 4.5 MB request limit. Only verified admins can request tokens or complete an upload. Completion downloads the private object, checks its actual size and detected format, decodes images/posters, generates derivatives, and marks the manifest ready. A claimed MIME type or file size never replaces byte validation. Failed uploads remain private incomplete drafts; delete them before retrying. Video posters stay private and are removed with the draft. No general client storage write policy is needed.

Processing buffers bounded objects: use a Node runtime with Sharp binaries and enough memory for image decoding. Static-only hosting cannot run the dashboard.

## Deploy to Vercel

Commit and push the repository, then import it in Vercel using the Nuxt framework preset, Node 22.x, and `npm run build`. Vercel builds on Linux and installs the matching Sharp binary; do not deploy a Windows-generated prebuilt function. The local Vercel preset build is a packaging check only.

Add the five `NUXT_*` variables above to the intended Vercel environments. Use the final HTTPS domain for `NUXT_PUBLIC_SITE_URL`. The secret key is server-only. `DATABASE_URL` and admin login passwords are not deployment variables; the app uses Supabase's API. The existing schema, buckets, and admin account remain in the configured Supabase project. A new project needs the migration and seed first. Set the production site URL in Supabase Auth for future recovery links.

Photo uploads up to 15 MB and video uploads up to 50 MB use the private direct-upload flow on Vercel. Function timeouts or storage errors retain incomplete drafts for cleanup. Verify a real upload and publication on the deployed URL before relying on production operation.

## Recovery and caching

Upload manifests are saved before storage writes. Failed uploads stay as private incomplete drafts; delete and re-upload. A database-backed ten-minute lease prevents overlapping operations on one item. After a killed process, retry once the lease expires. A queue/resumable pipeline is deferred until real upload volume requires it.

Publishing copies derivatives and then updates database visibility. Paths are persisted first and failures attempt rollback and cleanup. If cleanup also fails, use **Unpublish / clean public files** or **Delete** to retry. A known partial public URL can remain readable until cleanup succeeds. Originals remain private.

Unpublish hides the database row first, then removes public objects. Delete retains a deleting row until cleanup succeeds. Failures return errors and keep the manifest: retry the same action. There is no automatic cleanup worker.

Public files have a 60-second cache directive, but already downloaded/CDN copies cannot be instantly revoked. Signed admin previews expire after ten minutes.

## Verification

```powershell
npm run typecheck
npm test
npm run build
npm run test:browser
```

The browser suite uses installed Chrome and a production server on 127.0.0.1:3017. It covers 390/768/1440px layouts, filtering/reload, keyboard lightbox/focus, reduced motion, mobile navigation, route cleanup, and anonymous endpoint rejection. Artifacts are in .tmp/. Adjust Playwright's channel if Chrome is unavailable.

For **real backend tests**, provision dedicated admin and non-admin test accounts in a test project and add to local .env:

```dotenv
TEST_BASE_URL=http://127.0.0.1:3017
TEST_ADMIN_EMAIL=
TEST_ADMIN_PASSWORD=
TEST_MEMBER_EMAIL=
TEST_MEMBER_PASSWORD=
```

Start the configured app and run `npm run test:security`. It performs temporary real writes: creates a category, uploads a generated PNG larger than 4.5 MB directly to private Storage, checks completion authorization and RLS/private storage, rejects spoofed images, previews, publishes, verifies actual derivative sizes, unpublishes, and cleans up in finally. Missing credentials fail explicitly. Do not call mock validation a live integration pass.

See IMPLEMENTATION.md for recorded results. The starter had no lint script; typecheck and focused checks are provided. Recheck advisories before deployment. Do not use npm audit fix --force: its current recommendation changes Nuxt major.

## Assets and references

Original Suutori-32.png and Suutori-34.png are in public/brand. The symbol is framed in CSS, not redrawn. Seven portfolio photographs plus a separate male graduation hero in public/images/portfolio have full-size WebP and thumbnail versions. The gallery uses the female graduation portrait. Shared content defines their categories, dimensions, and alt text. Published database content takes precedence; these bundled photos are not database records. Legacy stock assets remain only as test fixtures. System Arial/Helvetica and Georgia require no font download.

- [Nuxt](https://nuxt.com/docs)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Supabase Storage policies](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser)
- [Sharp output](https://sharp.pixelplumbing.com/api-output/)

Before production: verified contacts, configured Supabase/domain, live security tests completed, and dependency advisories reviewed. Deployment requires explicit authorization.
