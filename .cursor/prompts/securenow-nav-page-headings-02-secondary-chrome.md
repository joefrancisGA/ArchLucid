# SN-NPH-02 — Secondary page chrome titles match the sidebar (no breadcrumbs)

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not re-open **SN-NPH-01** workbench refactors except to fix a regression.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_NAV_PAGE_HEADINGS_LUNA_PROMPTS.md`

**Depends on:** **SN-NPH-01** on the same branch (helper + workbench H1s).

## Goal

Remaining SecureNow **page titles** (visible `OperatorPageHeader` / `title=` props and document metadata where listed below) use `resolveSecureNowPageHeading` with the same nav href as the sidebar. Architecture titles stay on existing constants.

**Out of scope:** breadcrumb trails, breadcrumb components, and new wayfinding chrome. Do not add, extend, or “fix” breadcrumbs in this session.

## Why

`governance-findings-queue-presentation.ts`, `RemediationPatternsClient`, and `CollectionAgentPageClient` still inline `SECURENOW_NAV_LABELS[...]` behind `productLine === "security"`. That duplicates **SN-NPH-01** and drifts when labels change.

Product direction: navigation is the sidebar (and `getRouteTitle` for announcements). Breadcrumb UI is not part of the SecureNow shell.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-page-heading.ts`
- `archlucid-ui/src/app/(operator)/governance/findings/governance-findings-queue-presentation.ts` (assigned-to-me queue **page title** only)
- `archlucid-ui/src/app/(operator)/governance/remediation-patterns/RemediationPatternsClient.tsx` (`OperatorPageHeader` `title`)
- `archlucid-ui/src/app/(operator)/infrastructure/collection-agent/CollectionAgentPageClient.tsx`
- `archlucid-ui/src/app/(operator)/infrastructure/collection-agent/page.tsx` (`metadata.title`)

**Do not read or edit** `InfrastructureAskBreadcrumb.tsx`, `ResourcesExplorerBreadcrumb.tsx`, `RemediationBreadcrumb.tsx`, or other `*Breadcrumb*` components for this prompt.

## What to build

1. **Findings queue.** Assigned-to-me presentation **page title** (not wayfinding chrome) uses `resolveSecureNowPageHeading` with the canonical href for `/security/assigned-to-me` (use `SECURENOW_NAV_LABELS` key / path constant already used elsewhere for “My findings”).
2. **Remediation patterns.** `OperatorPageHeader` `title` uses the helper + the nav href constant for fix playbooks (`SECURENOW_REMEDIATION_PATTERNS_PATH` or equivalent).
3. **Collection agent.** Client H1 and `page.tsx` `metadata.title` use the helper (collection agent is SecureNow-only — `productLine` `"security"` or pass `"security"` explicitly only if the page is gated to SecureNow; do not invent a second title string).
4. Optional: export `resolveSecureNowNavLabel(navHref: string): string` as a thin `SECURENOW_NAV_LABELS[navHref]` wrapper **only** if it deduplicates metadata that cannot call `useProductLine`, without growing scope.

Do not change Home directory outcome rows (`securenow-*-home-copy.ts`) unless a row label disagrees with the sidebar for the same href.

Do **not** remove existing breadcrumb components from the repo in this session unless the user directs a separate removal wave. **SN-NPH-02** only avoids touching them.

## Tests

From `archlucid-ui`:

```bash
npx vitest run src/lib/product-line/securenow-page-heading.test.ts
npx vitest run src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.securenow.test.tsx
npx vitest run src/app/(operator)/governance/remediation-patterns/RemediationPatternsClient.test.tsx
npx tsc --noEmit -p tsconfig.json
```

Skip files that do not exist; run any SecureNow test that asserts visible titles on paths you touched.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- **No breadcrumbs:** no new breadcrumb UI, no edits to `*Breadcrumb*` files, no “Home › Ask” trails.
- No href changes. No `SECURENOW_NAV_LABELS` copy edits unless fixing a proven sidebar mismatch.
- Do not re-run **SN-HOME-01–06** or **SN-MENU-01–04** as greenfield.
- Do not commit unless the user names the branch in that request.

## Done when

Assigned-to-me queue title, remediation patterns header, and collection agent titles match `SECURENOW_NAV_LABELS` on the security shell via `resolveSecureNowPageHeading`, with Architecture behavior unchanged and **no breadcrumb work** in the diff.
