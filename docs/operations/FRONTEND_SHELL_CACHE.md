# Frontend shell cache propagation (TB-868)

How ArchLucid keeps the **application shell** fresh after a green CD while still serving fingerprinted static assets with long-lived cache headers.

## Problem

A deploy can succeed while browsers or an edge CDN still serve an older **HTML / RSC bootstrap** that references a previous build. Operators then see a green pipeline with stale UI behavior.

## What is cached where

| Layer | Path class | Policy | Rationale |
| --- | --- | --- | --- |
| **Next.js UI origin** | `/_next/static/*`, `/images/*` | `public, max-age=31536000, immutable` | Content-hashed filenames; safe across deploys |
| **Next.js UI origin** | All other routes (`/:path*`) | `no-cache, no-store, max-age=0, must-revalidate` | HTML shell and bootstrap must not stick across revisions |
| **Next.js UI origin** | `/api/health` | `no-store` (route handler) | Process health + `commitSha` for CD smoke |
| **Azure Front Door** (when enabled) | All paths | **Honor origin** `Cache-Control` | No blanket CDN cache; no routine purge on deploy |
| **Browser** | Hashed static assets | Long-lived per immutable header | New deploy ships new hashed URLs in fresh HTML |

Configured in `archlucid-ui/next.config.ts` (production only). Development skips custom `Cache-Control` on static paths so `next dev` can hot-reload.

## Build identity in public HTML

Every document includes a machine-readable meta tag when `NEXT_PUBLIC_BUILD_COMMIT_SHA` is set at image build time:

```html
<meta name="archlucid:build-commit" content="{full-git-sha}" />
```

Constants and parser: `archlucid-ui/src/lib/build-identity-html-meta.ts`.

## Post-deploy verification

`scripts/ci/cd_post_deploy_product_smoke.py` runs **`ui_public_shell_build_id`** when a UI base URL and `BUILD_ID` are set:

1. `GET /welcome?_shell_smoke={unix}` with cache-bypass request headers (`Cache-Control: no-cache, no-store`, `Pragma: no-cache`).
2. Parse the `archlucid:build-commit` meta tag.
3. Require equality with `BUILD_ID` (same identity as API `/version` and UI `/api/health`).

This complements existing checks; it does **not** replace `/api/health` process probes.

## Front Door / CDN purge

**Routine deploys:** purge is **not** required. Origin `no-store` on the shell prevents Front Door from retaining version-sensitive HTML. Hashed `/_next/static` assets are intentionally long-lived; a purge would not fix a stale shell and would add cost/latency.

**When to purge manually:** only if a misconfigured edge cache ignored origin headers (incident response). Purge **path patterns**, not the entire profile — e.g. `/welcome`, `/`, operator entry routes — not `/_next/static/*`.

See also [`infra/terraform-edge/README.md`](../../infra/terraform-edge/README.md) and [`DEPLOYMENT_CD_PIPELINE.md`](../library/DEPLOYMENT_CD_PIPELINE.md).

## Service worker

`archlucid-ui` ships **no** service worker. Re-verify when adding PWA offline support.

## Related backlog

- **TB-868** — eliminate stale frontend/CDN app shell after successful CD
- **TB-754–TB-759** — cold-start / smoke cluster
- [`CD_POST_DEPLOY_PRODUCT_SMOKE.md`](CD_POST_DEPLOY_PRODUCT_SMOKE.md)
