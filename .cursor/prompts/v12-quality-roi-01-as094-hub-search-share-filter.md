# V12-01 — AS-094 hub + global search honor RestrictToShares

**Wave:** v12 quality-ROI (**V12-01**). **Cluster:** share-ui leak. **Depends on:** AS-089–AS-095 API (shipped).

Do not implement from the index. Implement only *What to build*.

## Goal

Architectures hub list, hub filter counts, and global search architecture results must omit restricted packages the signed-in actor cannot View — same semantics as `GET /v1/architectures` with `actorOid`.

## Why

A hub card or search hit that shows a restricted package title is an in-tenant IDOR-style leak. API list/get already return 404 or omit rows; the hub still uses `listDraftRequests({ mine: true })` without share filtering.

## Context

- `archlucid-ui/src/hooks/use-architecture-draft-list-query.ts` — draft list, not share-filtered architecture list
- `archlucid-ui/src/components/architecture/use-architecture-draft-list.ts` — hub filters/counts
- `ArchLucid.Api/Controllers/Architecture/ArchitecturesController.cs` — `ListArchitectures` passes `actorOid` (correct reference behavior)
- `ArchitectureShareAccessEvaluator` + `FilterByShareVisibilityAsync` on identity repos
- AS-094 spec: `.cursor/prompts/architecture-spine-094-hub-list-honors-restrict.md`
- HCP parity: home/hub counts must match filtered list (do not fork HCP counting rules)

## What to build

1. **Hub inventory source:** Switch hub card data to a share-filtered architecture identity list (prefer `GET /v1/architectures` or a thin client wrapper) OR filter draft/registry entries against a parallel share-filtered architecture id set. Do **not** re-implement share SQL in the browser.

2. **Filter counts:** `countArchitecturesHubFilterMatches` and tab badges must use the same filtered set as visible cards.

3. **Global search:** Architecture/package hits in global search (and working search when scoped to workspace) must exclude restricted architectures the actor cannot View.

4. **Tests:**
   - Vitest: actor without View share does not see restricted title in hub list, filter count, or search mock results.
   - C# or API test if you add a list endpoint variant — prefer extending existing controller tests over new surface area.
   - Count parity test: filtered total === visible card count for a fixture with one restricted package.

5. **Do not** regenerate OpenAPI unless you add a new DTO field (not expected).

## Acceptance criteria

- Hub and search cannot leak titles of restricted packages to actors without View share.
- Workspace-visible (RestrictToShares=false) behavior unchanged.
- Grandfather open default unchanged.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More**.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** re-run AS-089–AS-099 API bodies — wire UI/query only.
- **Do not** add SQL RLS. Share ACL stays app-layer (ADR 0087).
- **Do not** flip `AgentExecution:Mode` host default. No G-REAL-06.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` + scoped C# tests. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -Ui` when UI changes.
