# PP-02 — Alerts inbox First Load JS

**Model:** Composer 2.5. Paste this file as the whole task. Do not implement PP-03 in this session. Do not use a fast-tier model slug.

**Repo:** `c:\ArchLucid`

**Wave:** Performance residual (**PP**). **Depends on:** **PP-01** merged, or a clean `master` if PP-01 has not touched `first-load-js-baseline.v1.json`. Do not edit the `/architecture/reviews/[reviewId]` key.

## Goal

Cut the initial JavaScript for `/governance/alerts` by at least **200 kB** versus the number you measure at the start of this session.

## Why

`archlucid-ui/performance/first-load-js-baseline.v1.json` records **2149.9 kB** for `/governance/alerts`. `ALERTS_INBOX_CHUNK_MANIFEST` defers only `AlertsGovernanceContextPanel` and `AlertsInboxDialogs`. The inbox is the second-heaviest row in the baseline.

## Read first

- `archlucid-ui/performance/first-load-js-baseline.v1.json`
- `archlucid-ui/src/lib/operator/alerts-inbox-chunk-manifest.ts`
- `archlucid-ui/src/components/ui/deferred-chunk-loading.tsx`
- The alerts inbox page and its client under `archlucid-ui/src/app/(operator)/governance/alerts/`
- `docs/runbooks/FIELD_WEB_VITALS_TRIAGE.md`

## What to build

1. Branch `pp/02-alerts-inbox-first-load` from current `master` (including PP-01 if it has merged).
2. Build `archlucid-ui` and read `.next/diagnostics/route-bundle-stats.json` for `/governance/alerts`. Record `firstLoadJsKb` before you edit.
3. Defer one below-fold or dialog-only module that is still a static import on the inbox route. Use `DeferredChunkLoading` and add a row to `ALERTS_INBOX_CHUNK_MANIFEST`. The inbox list and its empty state must render without that chunk.
4. Add a Vitest source guard that the chosen module is not statically imported by the inbox page or its top-level client.
5. Rebuild. Update **only** the `/governance/alerts` key, and only if the new number is at least **200 kB** below step 2. Leave `regressionToleranceKb` at **25**.

## Acceptance criteria

- Measured First Load JS for `/governance/alerts` is ≤ (step-2 number − 200 kB).
- `npm run check:first-load-js` passes.
- Other route keys in the baseline are unchanged by this session.
- The alerts list (or its empty state) is visible without opening a dialog.

## Constraints

- Before editing any tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. If it exits 2, stop and report the blocked path.
- If the largest bytes are the shared operator shell, **stop** and report the module list.
- If you cannot find 200 kB of inbox-local initial JS, **stop**. Do not raise the baseline. Do not restyle the inbox.
- Do not collapse governance tabs.
- Working-tree safety. Stage only this prompt’s paths. **No `git add -A`.**
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npm run build
npm run check:first-load-js
npx vitest run src/lib/deferred-chunk-loading-contract.test.ts
```

Heartbeat every 8s during `npm run build`. One build, plus one retry if it exits 1. Add the new inbox guard file to the vitest command.

## Done when

The check passes and the alerts row is lower by at least 200 kB, or you stopped with the module list. Tell the owner the before and after kilobytes. Wait for that look before any commit.
