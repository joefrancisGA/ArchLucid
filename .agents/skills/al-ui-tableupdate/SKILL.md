---
name: al-ui-tableupdate
description: >-
  Reconciles the owner UI route traffic workbook with the live ArchLucid UI
  route catalog: App Router page.tsx paths, help registry slugs/aliases, and
  URL-tab surfaces. Removes stale rows, migrates legacy redirect paths, adds
  missing routes with generated IDs and score 0. Use when the user invokes
  /al-ui-tableupdate, asks to sync or validate ui_route_traffic_estimates,
  refresh the route master table, or add tabbed hub routes to the workbook.
disable-model-invocation: false
---

# al-ui-tableupdate — reconcile UI route traffic master table

Keeps `.local/owner/ui_route_traffic_estimates.md` aligned with routable UI surfaces in `archlucid-ui`.

## When to run

- After adding/removing `page.tsx` routes, help topics, or hub `?tab=` / `?path=` / `?archTab=` deep links
- When the user asks to validate, sync, or refresh the route traffic table
- User invokes `/al-ui-tableupdate` (optional `--dry-run`)

## Workflow (strict order)

### Step 1 — Working-tree safety

```powershell
.\scripts\agent\check-working-tree-path.ps1 -Path '.local/owner/ui_route_traffic_estimates.md'
```

Exit code **2** → stop; owner file is dirty and blocked.

If the owner workbook is missing:

```powershell
python .\scripts\ci\bootstrap-ui-route-traffic-owner-workbook.py
```

### Step 2 — Preview (optional)

```powershell
$env:PYTHONIOENCODING='utf-8'
python .\scripts\ci\sync-archlucid-ui-route-traffic-workbook.py --dry-run
```

### Step 3 — Apply sync

One shell invocation from repo root:

```powershell
$env:PYTHONIOENCODING='utf-8'
python .\scripts\ci\sync-archlucid-ui-route-traffic-workbook.py
```

The script:

- Builds the catalog from `archlucid-ui/src/app/**/page.tsx`, `product-documentation-registry.ts`, and tab constants in `src/lib/*-hub-tab.ts` / `architecture-workspace-tabs.ts`
- **Migrates** legacy workbook paths (e.g. `/alerts` → `/governance/alerts`) and merges Hit% / scores on collision
- **Removes** rows whose paths are not in the catalog
- **Adds** missing catalog paths with a new 3-letter **ID**, **Hit% 0.02%**, **score 0**, **Notes None**
- Refreshes **Section** from catalog; re-sorts by **Deficit** (score 0 rows first); recomputes **Weight**, **Deficit**, and **OVERALL WEIGHT SCORE**
- Updates the source line `page.tsx` count in the doc header

Re-run is **idempotent** when the catalog is unchanged.

### Step 4 — Report

Summarize for the user:

| Metric | Meaning |
|--------|---------|
| retained | Rows kept (path still valid) |
| migrated | Legacy path rewritten to canonical |
| removed | Stale paths dropped |
| added | New catalog paths (score 0) |

List migrated, removed, and added paths when non-empty.

## Catalog policy

| Source | Included |
|--------|----------|
| App Router `page.tsx` | Physical URL paths (route groups omitted from URL) |
| Help registry | `/help`, `/help/{slug}`, slash cloud canonicals from `cloud-connections-help-routes.ts` |
| URL tabs | `?tab=` hubs (advisory, digests, alert-rules, alerts inbox, settings/users), `?path=` on `/reviews/new`, `?archTab=` on `/reviews/[runId]` |
| Next.js redirects only | **Excluded** — workbook uses canonical destination after migration |

**Not included:** client-only tabs without query deep links (e.g. policy-packs My packs/Catalog, graph trace/graph presentation).

## Legacy path migrations

Defined in `scripts/ci/archlucid_ui_route_catalog.py` (`WORKBOOK_PATH_MIGRATIONS`):

- `/alerts` → `/governance/alerts`
- `/audit` → `/governance/audit`
- `/settings/cloud-connections` → `/integrations/cloud-connections`
- `/settings/roles` → `/settings/users?tab=roles`
- `/settings/roles/invite-reviewer` → `/settings/users/invite-reviewer`
- `/admin/users` → `/settings/users`
- `/admin/support` → `/settings/support`
- `/workspace/security-trust` → `/settings/security-trust`
- `/governance-resolution` → `/governance/resolution`
- `/advisory` → `/governance/advisory-scans`
- `/advisory?tab=scans` → `/governance/advisory-scans?tab=scans`
- `/advisory?tab=schedules` → `/governance/advisory-scans?tab=schedules`
- `/advisory-scheduling` → `/governance/advisory-scans?tab=schedules`

Physical pages that also redirect (e.g. `/alert-routing`, `/integrations/itsm`) stay as separate rows. Legacy `/advisory` and `/advisory-scheduling` are **next.config-only** redirects (no App Router stubs).

## Guardrails

- **Do not** commit `.local/owner/ui_route_traffic_estimates.md` unless the user explicitly asks
- **Do not** change existing Hit% or scores on retained rows (only migrations merge traffic)
- **Do not** rescale Hit% totals after adds — owner may rebalance manually
- **Do not** re-track `docs/architecture/ui_route_traffic_estimates.md`

## Canonical files

- `.local/owner/ui_route_traffic_estimates.md` — live workbook (gitignored)
- `scripts/ci/sync-archlucid-ui-route-traffic-workbook.py` — reconcile entrypoint
- `scripts/ci/archlucid_ui_route_catalog.py` — route discovery + ID suggestion
- `scripts/ci/archlucid_ui_route_traffic_table.py` — parse/render/sort helpers
- `scripts/ci/tests/test_archlucid_ui_route_catalog.py` — catalog unit tests
- `docs/architecture/UI_ROUTE_TRAFFIC_ESTIMATES_OWNER.md` — owner workbook location

## Related commands

- `/al-ui-score` — set Evidence score by ID
- `/al-ui-note` — add or replace Notes by ID
