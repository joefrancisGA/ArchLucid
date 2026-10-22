> **Scope:** Contributor-reference — copy-paste Composer prompts for the `/security/remediation-factory` dev log. **Prompts only** — do not implement from this file.
> **Paste files:** [`.cursor/prompts/remediation-factory-dev-error-00-index.md`](../../.cursor/prompts/remediation-factory-dev-error-00-index.md).

# RF-ERR-01–RF-ERR-03 — Remediation factory dev log

**Observed:** Next dev log while opening

`/security/remediation-factory?fromSnapshot=9c8565fa-4c59-4189-8608-d669cca9d4b1&toSnapshot=10ceda3f-8147-467e-9978-e49ee5ce6656&remediationFactorySnapshotIdentityOpen=1`

The HTML route returns **200**. The client module does not compile.

## What is broken

| Log line | Class | Prompt |
|----------|-------|--------|
| `REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID` is not exported from `./remediation-factory-page-copy` | Compile break on `RemediationFactoryClient.tsx` | **RF-ERR-01** |
| `GET /api/proxy/v1/integrations/azure-boards/settings` **403** — title `Product line cannot use this route`, detail `The active product line cannot access this API route.` | Security shell calls an Architecture-only API | **RF-ERR-02** |
| Fast Refresh full reload; `Router action dispatched before initialization`; `ChunkLoadError: Loading chunk app/global-error` (timeout on `global-error.js`, port 3002 in the log) | Cascade of the failed module graph | **RF-ERR-03** |
| Reclassify Azure Boards as `both`, or silence the proxy 403 logger | Wrong fix | **RF-ERR-HOLD** |

## What is healthy in the same log

Leave these alone. They are not defects:

- `GET /api/proxy/v1/integrations/itsm/health` **200**
- `GET /api/proxy/v1/user/preferences` **200**
- `PUT /api/proxy/v1/user/preferences/working-workspace-continuity` **204**
- `GET /api/proxy/v1/learning/plans?maxPlans=8` **200**
- `GET /api/proxy/health/ready` **200**
- `GET /api/proxy/api/auth/me` **200**
- `GET /api/proxy/v1/operator/shell-status` **200**

`remediationFactorySnapshotIdentityOpen=1` is an existing disclosure flag in `remediation-factory-snapshot-identity-disclosure-url.ts`. It is not the missing export.

## Cause — missing panel id

The running client imports `REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID` from `remediation-factory-page-copy.ts`. That module exports only:

- `REMEDIATION_FACTORY_PRIMARY_CONTENT_ID` (`remediation-factory-primary-content`)
- `REMEDIATION_FACTORY_SKIP_LINK_LABEL`
- `REMEDIATION_FACTORY_OPEN_WAVES_LABEL`

`SecurityEvidencePathInspectPanel` renders a `<section>` with `aria-label` and `data-testid="security-evidence-path-inspect-panel"` and no `id`. The same panel is also mounted from the findings queue and finding inspect. A factory-only id must be an optional prop, not a hardcoded id on every caller.

A trunk checkout may not yet contain the import. The running dev server does. **RF-ERR-01** makes the export, the import, and the `id` prop agree.

## Cause — Azure Boards 403

`AzureBoardsIntegrationsController` is `productLine: "architecture"` in `docs/architecture/data/product-capability-map.json`. `ProductLineRouteGateMiddleware` returns that 403 when the effective line is Security. The 403 is the correct gate.

The caller is the operator shell, not the remediation factory page. `OperatorLayoutClient` mounts `ItsmNativeCreateReadinessProvider` around every operator route. `loadItsmNativeCreateReadiness` always `Promise.allSettled`s `fetchAzureBoardsSettings()` with `fetchItsmIntegrationHealth()`. ITSM health is `productLine: "both"` and returns 200. Azure Boards is rejected. `allSettled` swallows the rejection, so the page still paints, and the proxy still logs `upstream_non_success`.

`ItsmNativeCreateReadinessProvider` sits **outside** `ProductLineProvider` (`ProductLineProvider` is inside `AppShellClient` → `OperatorShellProviders`). Do not call `useProductLine()` from that provider. Read `resolveProductLineId()` / `isSecureNowProductLine` instead.

## Cause — router and chunk errors

A missing export makes the client module invalid. Next cannot fast-refresh it, so it full-reloads. During that reload the app router can dispatch before initialization, and `app/global-error.js` can time out. Those lines are not a separate product defect until **RF-ERR-01** compiles cleanly and they still appear.

## Sequencing

| Prompt | Parallel? | Depends on |
|--------|-----------|------------|
| **RF-ERR-01** Export the panel id and set it on the factory panel | **First** | — |
| **RF-ERR-02** Skip Azure Boards settings on Security | Parallel with 01 | — |
| **RF-ERR-03** Confirm the reload cascade is gone | After 01 | Clean compile of the factory client |
| **RF-ERR-HOLD** | Not implementation | — |

**Run one prompt per chat.** Feature branch per prompt (`cursor/rf-err-<short-name>`). Name the branch in any commit or push request.

## Design notes for the prompts

- **Security:** The 403 stays the server rule. The client stops requesting a route the active line cannot use. Azure Boards settings stay Architecture-only.
- **Scalability:** One fewer forbidden call on every Security shell load. The existing readiness cache stays.
- **Reliability:** A missing export takes down the client bundle. Exporting the id restores the module. Skipping the forbidden call removes a guaranteed 403 from the shell.
- **Cost:** No new service. The avoided call is a small proxy round trip that always fails on Security.

## Shared constraints (every prompt)

- Security shell only for the Azure Boards skip (`isSecureNowProductLine`). Architecture still loads Azure Boards settings.
- Do not change `productLine` for `AzureBoardsIntegrationsController`.
- Do not hide desktop review workspace tabs behind **More**.
- Working-tree: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'`. Exit 2 → skip and report.
- Sentence case. **TB-645**. Visible-boundary buttons. No ghost or link button variants.
- Stage only this prompt’s paths. **No `git add -A`.**
- Focused Vitest from `archlucid-ui/`. No full-solution build. No dev server unless the prompt says so.
