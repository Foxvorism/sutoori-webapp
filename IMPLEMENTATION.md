# Implementation and verification

Motion redesign checked on 8 October 2026, Windows, Node 26.4.0, npm, and Nuxt 4.5.2.

## Portfolio update — 8 October 2026

Seven supplied images replace all public stock photos: padel, family gathering, photobooth, engagement, yearbook, wedding, and graduation. The male graduation photo is the hero; the female graduation portrait is used in the portfolio and graduation service cover. Real dimensions and descriptive alt text are included; relevant service covers use the supplied photos. Demo labels and the independent-production tagline are removed. Bundled photos remain available without Supabase; database-published media takes precedence.

## Delivered

- Public homepage and `/work`: supplied brand assets, seven supplied portfolio photographs, English copy, nine services, editable process/about/contact content, conditional packages and showreel, responsive gallery and URL filters.
- GSAP pinned opening on desktop/mobile: oversized type parts, a tilted image expands to fill the scene, and a rotating statement panel covers it. Native sticky portfolio cards overlap with scroll-driven scale/rotation, a scroll ribbon moves sideways, service imagery rotates, process cards rise, and the contact headline grows into view. Reduced motion and short viewports use static layouts; route cleanup removes all pins.
- Native-dialog lightbox with Escape, arrows, explicit Tab wrapping, video pause on close, focus restoration, and scroll restoration including the pinned showcase. Full media loads only after opening.
- `/admin/login`, overview, media library/editor, services, packages, and settings screens. Batch uploads show individual progress/errors. Drafts, signed previews, focal points, ordering, publish/unpublish/delete, and session-expiry feedback are implemented against server endpoints.
- Supabase schema, seeds, admin membership, RLS, private/public buckets, trusted provisioning instructions, and live integration test script. Server-only writes enforce auth, membership, strict field validation, MIME/size checks, and actual Sharp derivatives.
- Publication failure attempts rollback and public-file cleanup. Failed cleanup preserves the manifest for an explicit retry. Database-backed leases serialize per-media changes.
- Canonical and social URLs are conditional on a configured domain. Only public routes appear in the conditional sitemap. Admin routes and pages without a configured domain are noindex.
- The local master brief, environment files, temporary credentials, and build outputs are ignored by Git. No deployment or remote Git changes were made.

## Completed local checks

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm test` | 4 tests passed: contextual/validated WhatsApp links, publish requirements, constrained settings/money, actual file detection and derivative dimensions |
| `npm run build` | Pass, Node server output |
| `npm run test:browser` | 7 tests passed against the production build |
| Responsive checks | 390, 768, 1440 pixels; no unintended document overflow |
| Gallery/lightbox | Filters survive reload; arrows, Escape, Tab wrapping, and focus restoration pass |
| Motion | Forward/reverse progression, pin cleanup across repeated route navigation, and pinned-lightbox scroll restoration pass |
| Fallbacks | Reduced motion, JavaScript disabled, unknown gallery category, missing backend, and anonymous admin API requests checked |
| Anonymous API writes/reads | Admin routes return 401 before backend access; this does not prove live Supabase RLS |
| `git diff --check` | Pass |

Screenshots and raw reports are in ignored `.tmp/`. The browser suite checks uncaught page errors. Screenshots were inspected for mobile/desktop layout and service typography. Browserless build success is not the only verification performed.

### Historical Lighthouse results (before the 8 October motion redesign)

| Page | Performance | Accessibility | FCP | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 87 | 100 | 1.7 s | 4.0 s | 0 | 0 ms |
| `/work` | 88 | 100 | 1.7 s | 3.8 s | 0 | 0 ms |

Measured with Lighthouse mobile simulation on local Chrome. These are individual local runs, not field measurements or final-media guarantees. These scores do not describe the redesigned homepage. The owner removed Lighthouse scoring from this revision; it was not rerun. Lighthouse wrote complete JSON reports, then its Windows temporary-profile cleanup returned EPERM. The audit reports themselves contain completed scores, not a runtime audit failure.

The initial homepage run was 66/96. Removing unused Nuxt UI/Tailwind imports/module and dependencies reduced application CSS from about 214 KB to 21 KB. Precompressed public assets and correctly sized thumbnails reduced transfer cost; closed lightboxes no longer load full media. Native CSS/controls retain the intended public and admin layouts.

## Supabase and Vercel compatibility — 8 October 2026

Applied migration and seed transactionally to the owner's empty database through the session pooler with verified TLS. Provisioned the requested owner account and admin membership. Credentials remain in ignored local files. Auth API and browser login to the dashboard/services passed. All seven application tables have RLS; originals is private and portfolio is public.

The upload flow now reserves a private manifest and returns signed, non-overwriting upload URLs. Browser file transfers go directly to Supabase. Authenticated completion checks actual bytes, MIME, image decoding and dimensions before generating derivatives and marking the draft ready. Publication still requires complete files and valid metadata. Incomplete drafts, including video poster objects, are cleaned by the existing delete operation. No new table or permissive storage policy was needed.

Passed real integration checks against Supabase: owner login, non-admin/anonymous API denial, blocked direct writes and privilege escalation, hidden drafts/private sources/originals, signed upload of an approximately 11 MB generated PNG, spoof rejection, repeated completion, signed preview, publish, derivative sizes, unpublish, and delete. The temporary non-admin account and test content were removed. A separate Chrome UI check uploaded 11,542,076 bytes while the largest application API body was 87 bytes; its draft was also removed. Typecheck, four unit tests, all seven browser tests, Node production build, and the local Vercel preset build passed. Browser login assertions now cover both configured and unconfigured Supabase.

A real WebM generated with Chrome MediaRecorder and its PNG poster also passed the browser direct-upload flow, completion, private preview, and thumbnail checks; both objects and the draft were deleted. The Vercel function output specifies Node 22 and a 60-second maximum duration. A secret scan of 316 Git-eligible/public-output files found no server secret, database connection string, or admin password.

Still unverified: deployed Vercel/Linux behavior, representative uploaded video playback, forced storage-failure recovery, preview expiry, token revocation, and actual CDN invalidation/TTL. The Windows Vercel output is a packaging check and must not be deployed prebuilt; Vercel must rebuild from Git with Linux Sharp binaries.

`npm run test:security` covers the principal real auth/RLS/storage/publishing checks once the configured app and dedicated test accounts are available. It uses real temporary records and does not mock Supabase.

The media pipeline buffers one bounded request and serializes one item's mutations with a ten-minute lease. It does not provide video transcoding, resumable uploads, an automatic cleanup worker, or instant revocation of downloaded public files. Recovery steps and deployment requirements are in README.

## Dependency audit

Pinned the transitive `simple-git` override to 4.0.2, which installs `@simple-git/argv-parser` 2.0.1. The online full-project audit now reports **11 high, 0 critical**, versus the previous 8 high / 6 critical. Remaining advisory chains originate from `braces` 3.0.3 and `node-forge` 1.4.0; neither has a published patched release at this check. See [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) and [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv). Do not silence these with unsafe replacement packages or a forced framework downgrade.

Separately generated an audit lockfile for the actual Node server output under ignored `.output/server`: **0 vulnerabilities** across its dependency tree. The remaining flagged packages are absent from the built runtime dependency manifest. This does not remove the tooling advisories or prove future deployments immune to new advisories. Nuxt devtools stay disabled and the local preview binds to 127.0.0.1.

## Owner inputs before production

Verify inquiry contacts; manage additional images/videos and select featured work/hero; supply real packages if desired; choose the canonical domain; configure Vercel environment variables and test the deployed upload flow; monitor upstream tooling patches. Deployment still requires a separate explicit request.
