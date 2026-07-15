---
description: Reconcile the owner UI route traffic master table with the live App Router, help, and tab route catalog
---

# Sync UI route traffic table (`/al-ui-tableupdate`)

Reconcile `.local/owner/ui_route_traffic_estimates.md` with the live route catalog:

- **Remove** rows for paths that no longer exist
- **Migrate** legacy redirect paths to canonical URLs (preserve Hit% and scores)
- **Add** missing routes with generated IDs, **Hit% 0.02%**, **score 0**
- Include **URL-tab surfaces** (`?tab=`, `?path=`, `?archTab=`)

## Arguments (optional)

```text
/al-ui-tableupdate
/al-ui-tableupdate --dry-run
```

- **`--dry-run`** — print retained/migrated/removed/added paths without writing the workbook

## Workflow (strict order)

### Step 1 — Working-tree safety

```powershell
.\scripts\agent\check-working-tree-path.ps1 -Path '.local/owner/ui_route_traffic_estimates.md'
```

Exit code **2** → stop.

Bootstrap when missing:

```powershell
python .\scripts\ci\bootstrap-ui-route-traffic-owner-workbook.py
```

### Step 2 — Run sync

From repo root, **one** shell invocation:

```powershell
$env:PYTHONIOENCODING='utf-8'
python .\scripts\ci\sync-archlucid-ui-route-traffic-workbook.py
```

Add `--dry-run` when the user asked for preview only.

### Step 3 — Report

Print counts: **retained**, **migrated**, **removed**, **added**. List path changes when non-empty.

Note: new rows start at score **0**; existing scores on retained/migrated rows are unchanged. Hit% is not rebalanced across the table.

## Guardrails

- **Do not** commit or push unless the user names a branch and asks
- **Do not** edit Hit% or scores on existing rows unless the user explicitly asks
- **Do not** track the owner workbook in git

## Canonical files

- `scripts/ci/sync-archlucid-ui-route-traffic-workbook.py`
- `scripts/ci/archlucid_ui_route_catalog.py`
- `scripts/ci/archlucid_ui_route_traffic_table.py`
- `scripts/ci/tests/test_archlucid_ui_route_catalog.py`
- `.cursor/skills/al-ui-tableupdate/SKILL.md`

## Related commands

- `/al-ui-score` — set Evidence score by ID
- `/al-ui-note` — add or replace Notes by ID
