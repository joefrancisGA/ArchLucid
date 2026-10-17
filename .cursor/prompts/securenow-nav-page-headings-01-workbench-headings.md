# SN-NPH-01 — Workbench page titles use `resolveSecureNowPageHeading`

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement **SN-NPH-02** in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_NAV_PAGE_HEADINGS_LUNA_PROMPTS.md`

## Goal

Every governance **infrastructure** and **security** workbench that already has a SecureNow-specific page title uses `resolveSecureNowPageHeading`. Architecture titles stay on the existing `GOVERNANCE_*` / `OPERATOR_NAV_LINK_LABELS` constants.

## Why

`resolveSecureNowPageHeading` exists on trunk and is wired on Diagrams, Terraform, diagram reconcile, declared connections, policy packs header, remediation factory, and standards. Other workbenches still duplicate:

```ts
productLine === "security"
  ? SECURENOW_NAV_LABELS["/infrastructure/resources"] ?? GOVERNANCE_...
  : GOVERNANCE_...
```

That pattern will drift when `SECURENOW_NAV_LABELS` changes. One helper keeps the H1 aligned with the sidebar.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-page-heading.ts`
- `archlucid-ui/src/lib/product-line/securenow-nav-labels.ts`
- `archlucid-ui/src/lib/governance/governance-infrastructure-route-paths.ts` (canonical `SECURENOW_*_PATH` hrefs)
- Adopters: `DiagramsWorkbenchClient.tsx`, `TerraformWorkbenchClient.tsx`, `PolicyPacksPageHeader.tsx`
- Still inline (replace in this session):
  - `ResourcesExplorerClient.tsx`
  - `InfrastructureAskClient.tsx`
  - `RemediationWorkbenchClient.tsx`
  - `DriftWorkbenchClient.tsx` (use `SECURENOW_INFRASTRUCTURE_DRIFT_PATH` + `GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE`; drop direct `SECURENOW_INFRASTRUCTURE_DRIFT_LABEL` for the H1 only)

## What to build

1. Add `archlucid-ui/src/lib/product-line/securenow-page-heading.test.ts`:
   - Security + known `SECURENOW_INFRASTRUCTURE_RESOURCES_PATH` → `SECURENOW_NAV_LABELS` value for `/infrastructure/resources`.
   - Security + unknown nav href → `secureNowTitleCase(architectureHeading)` fallback.
   - Architecture product line → passes through `architectureHeading` unchanged.
2. Replace inline SecureNow title ternaries listed above with:

   ```ts
   resolveSecureNowPageHeading(productLine, GOVERNANCE_…_PAGE_TITLE, SECURENOW_…_PATH)
   ```

   Use the same `SECURENOW_*_PATH` constant the sidebar uses for that route (not `/governance/...` unless that is what `SECURENOW_NAV_LABELS` keys on).
3. Update or add SecureNow Vitest on each touched client only when an existing `*.securenow.test.tsx` or `working-mode.test.tsx` already asserts the page title. Do not add new test files solely for title strings unless a test already broke.
4. Do **not** change `getRouteTitle`, `route-static-titles.ts`, or `page.tsx` `metadata.title` in this session (**SN-NPH-02** covers remaining page titles; no breadcrumbs).

## Tests

From `archlucid-ui`:

```bash
npx vitest run src/lib/product-line/securenow-page-heading.test.ts
npx vitest run src/app/(operator)/governance/infrastructure/resources/ResourcesExplorerClient.working-mode.test.tsx
npx vitest run src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.securenow.test.tsx
npx tsc --noEmit -p tsconfig.json
```

Run only the client tests that exist and that you changed.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new routes, no API, no copy changes to `SECURENOW_NAV_LABELS` unless fixing a proven typo against the sidebar.
- Sentence case in UI copy; do not re-case with CSS.
- Do not commit unless the user names the branch in that request.
- Do not hide desktop review workspace tabs behind **More**.

## Done when

Listed workbenches use `resolveSecureNowPageHeading` for the visible H1, helper tests pass, and Architecture behavior is unchanged.
