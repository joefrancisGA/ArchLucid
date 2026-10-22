---
description: Set an ArchLucid UI route Evidence score by table ID and re-sort the traffic estimates table
---

# Set UI route score (`/al-ui-score`)

Update one row in the owner workbook at `.local/owner/ui_route_traffic_estimates.md`
by **ID** shorthand, then **re-sort** the master table:
- **Score 0** — rows with no Evidence score appear **first**; within that group, **Deficit descending** (equivalent to Hit% descending)
- **Scored** — **Deficit descending** (`Hit% × (100 − score)`); ties **A→Z** by path

Also recomputes **OVERALL WEIGHT SCORE** (actual Weight sum as a % of max possible: Hit% × 100 per row) at the top of the report.

## Arguments (required)

The user invokes this command as:

```text
/al-ui-score <ID> <score>
```

Examples:

```text
/al-ui-score ASK 78
/al-ui-score GFN 72
/al-ui-score GRS 48
```

- **ID** — table shorthand in the first column (case-insensitive; e.g. `ASK`, `GFN`).
- **score** — integer **0–100** (Evidence score, position 1 in the Scores series).

If either argument is missing, **stop** and ask for both.

## Workflow (strict order)

### Step 1 — Validate inputs

1. Parse **ID** and **score** from the user message (after `/al-ui-score`).
2. Reject non-integer scores and values outside **0–100**.
3. Normalize ID to uppercase for lookup.

### Step 2 — Working-tree safety

Before editing `.local/owner/ui_route_traffic_estimates.md`, run:

```powershell
.\scripts\agent\check-working-tree-path.ps1 -Path '.local/owner/ui_route_traffic_estimates.md'
```

If exit code **2**, stop and tell the user the path is blocked (commit/stash or explicit override).

If the owner file is missing, bootstrap it first:

```powershell
python .\scripts\ci\bootstrap-ui-route-traffic-owner-workbook.py
```

### Step 3 — Apply update (preferred)

From repo root, run **one** shell invocation:

```powershell
python .\scripts\ci\set-archlucid-ui-route-score.py <ID> <score>
```

Example:

```powershell
python .\scripts\ci\set-archlucid-ui-route-score.py ASK 78
```

The script:

- Ensures the owner workbook exists (bootstrap from template when missing)
- Updates the **Scores** cell and recomputed **Weight** (Hit% × Scores) and **Deficit** (Hit% × (100 − score)) for the matching **ID**
- Leaves **Notes** unchanged (still `None` unless the owner edited them)
- Re-sorts the master table: score **0** rows **first**, then by **Deficit descending** within each group; ties A→Z by path
- Recomputes **OVERALL WEIGHT SCORE** near the top of the doc
- Preserves the **ID** column and all other rows

If the script fails (unknown ID), report the error and **do not** hand-edit unless fixing a script bug.

### Step 4 — Report

Print a short confirmation:

```markdown
## UI route score updated

| Field | Value |
|-------|-------|
| ID | `<ID>` |
| Path | `<path>` |
| Previous score | `<old>` |
| New score | `<score>` |
| Weight (Hit% × score) | `<weight>` |
| Deficit (Hit% × (100 − score)) | `<deficit>` |
| Rank | `<rank>` / `<total>` |
```

Use stdout from the script when available.

## Guardrails

- **Do not** change Hit%, Section, Notes, or ID codes unless the user explicitly asks.
- **Do not** commit or push unless the user names a branch and asks to commit.
- **Do not** invent scores for other rows.
- **Do not** re-sort scored rows by Weight descending; they use **Deficit descending**.
- **Do not** edit `docs/architecture/ui_route_traffic_estimates.md` — that legacy path is gitignored and must not be re-tracked.

## Canonical file

- `docs/architecture/UI_ROUTE_TRAFFIC_ESTIMATES_OWNER.md` — owner workbook location + guards
- `.local/owner/ui_route_traffic_estimates.md` — live master table (gitignored)
- `scripts/ci/set-archlucid-ui-route-score.py` — update + resort helper
- `scripts/ci/archlucid_ui_route_traffic_table.py` — shared table parse/render
- `scripts/ci/resort-archlucid-ui-route-traffic-table.py` — resort-only helper (no score change)
- `scripts/ci/tests/test_archlucid_ui_route_traffic_table.py` — unit tests for the shared helpers

## Related commands

- `/al-ui-note` — add or replace Notes by ID
- `/al-ui-tableupdate` — reconcile master table with live route catalog
- Route catalog (paths, demo tiers): `docs/architecture/ui_routes.md`
