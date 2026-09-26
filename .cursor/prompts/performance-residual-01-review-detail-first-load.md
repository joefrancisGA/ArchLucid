# PP-01 — Review detail First Load JS

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement PP-02 or PP-03 in this session. Do not use a fast-tier model slug.

**Repo:** `c:\ArchLucid`

**Wave:** Performance residual (**PP**). **Depends on:** current `master`. Deferred-chunk loading already exists. This prompt does not add a second loader.

## Goal

Cut the initial JavaScript for `/architecture/reviews/[reviewId]` by at least **400 kB** versus the number you measure at the start of this session.

## Why

`archlucid-ui/performance/first-load-js-baseline.v1.json` records **4588.8 kB** for that route (`updatedUtc` 2026-08-22). The note says the baseline was **raised** after merge-driven growth. `RUN_DETAIL_CHUNK_MANIFEST` already defers many panels, and the route is still the heaviest row in the file. Home is **1439.3 kB**, so most of the gap is route-local.

## Read first

- `archlucid-ui/performance/first-load-js-baseline.v1.json`
- `archlucid-ui/scripts/first-load-js-baseline.mjs`
- `archlucid-ui/src/lib/operator/run-detail-chunk-manifest.ts` and the sibling `run-detail-chunk-manifest-*.ts` files
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-deferred-chunk-loading.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-bundle-deferred-imports.test.ts`
- `docs/runbooks/FIELD_WEB_VITALS_TRIAGE.md` (lab / First Load JS only unless a field p75 is already in that doc)

## What to build

1. Branch `pp/01-review-detail-first-load` from current `master`.
2. Build `archlucid-ui` and read `.next/diagnostics/route-bundle-stats.json` for `/architecture/reviews/[reviewId]`. Record the measured `firstLoadJsKb` before you edit. If the file is missing, follow the header comment in `scripts/first-load-js-baseline.mjs`.
3. List the largest modules that are still in the **initial** route chunk and are not required for the default overview. Prefer modules the manifest already names but that a static import still pulls in. Next, defer a below-fold panel that is still static: evidence graph (`reactflow`), Mermaid diagram, holistic critic, or AI refine.
4. Defer with the existing `DeferredChunkLoading` helper and add the module to the matching `RUN_DETAIL_CHUNK_MANIFEST_*` file. Keep the default overview interactive without waiting on that chunk.
5. Add or extend the existing Vitest import guard so the chosen module is not a static import from `RunDetailPageView` or `run-detail-page-presentation`.
6. Rebuild. Write the baseline **only** for `/architecture/reviews/[reviewId]`, and only if the new number is at least **400 kB** below the number from step 2. Leave `regressionToleranceKb` at **25**. Do not change other route keys.

## Acceptance criteria

- Measured First Load JS for `/architecture/reviews/[reviewId]` is ≤ (step-2 number − 400 kB).
- `npm run check:first-load-js` passes.
- The default review overview still renders its primary heading and primary action without the deferred chunk.
- No new `GET /v1/operator/bootstrap`. No new run-progress URL. Review workspace tabs stay in the default strip.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- If the largest remaining bytes are the shared operator shell (also on `/`), **stop**. Report the module list. Do not strip the shell in this session.
- If you cannot find 400 kB of route-local initial JS, **stop** and report the top modules. Do not raise the baseline to absorb the miss. Do not delete features.
- Do not collapse tabs, hide destinations behind More, or change copy.
- Working-tree safety. Stage only this prompt’s paths. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npm run build
npm run check:first-load-js
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-bundle-deferred-imports.test.ts" "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageView.fljs.test.ts"
```

Heartbeat every 8s during `npm run build`. One build, plus one retry if it exits 1.

## Done when

The check passes and the baseline row for this route is lower by at least 400 kB, or you stopped with the module list because the cut is not route-local. Tell the owner the before and after kilobytes. Wait for that look before any commit.
