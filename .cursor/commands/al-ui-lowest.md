---
description: List the lowest UX-scored buyer-facing UI routes from the owner traffic workbook
---

# Lowest UX scores (`/al-ui-lowest`)

Report the **lowest UX quality** routes in `.local/owner/ui_route_traffic_estimates.md`
(Scores **position 2**), excluding ArchLucid-internal operator tooling.

Use this to find the buyer-facing polish queue without wading through `/internal/*`
diagnostics (which are intentionally low and carry rounding-error traffic).

## Arguments (optional)

```text
/al-ui-lowest
/al-ui-lowest 10
```

- **`N`** (optional) — how many rows to return. Default **20**. Must be a positive integer.

If extra tokens are present, treat the first numeric token as **N**; ignore the rest unless
the user clearly meant something else.

## Workflow (strict order)

### Step 1 — Bootstrap workbook when missing

If `.local/owner/ui_route_traffic_estimates.md` is absent:

```powershell
python .\scripts\ci\bootstrap-ui-route-traffic-owner-workbook.py
```

This command is **read-only** on the workbook — no working-tree safety check required.

### Step 2 — Run the list script

From repo root, **one** shell invocation:

```powershell
python .\scripts\ci\list-archlucid-ui-route-lowest-ux.py
```

With a custom limit:

```powershell
python .\scripts\ci\list-archlucid-ui-route-lowest-ux.py --limit 10
```

The script:

- Reads the owner workbook master table
- Keeps rows where the path is **not** under `/internal` and the section is **not** `Internal`
- Drops **internal-runbook help** paths in `INTERNAL_UX_RANKING_HELP_PATHS` (e.g. CON)
- Drops rows with **UX score 0** (unscored — not the same as a bad score)
- Sorts **UX ascending**, then **path A→Z** on ties
- Prints a markdown table to stdout

### Step 3 — Report

Paste the script output into the reply under:

```markdown
## Lowest UX scores (buyer-facing)

<markdown table from script>

**Floor:** UX **&lt;lowest&gt;** on **&lt;count at floor&gt;** row(s).
**Highest-traffic row in this slice:** **&lt;ID&gt;** (`&lt;path&gt;`, **&lt;Hit%&gt;**).
```

Add one sentence of interpretation when useful (e.g. many ties at 72 from shared tab
shells, or a single high-traffic outlier like SCX).

## Selection rules

| Included | Excluded |
|----------|----------|
| Any route not under `/internal` | `/internal` and `/internal/*` |
| UX score **1–100** in Scores position 2 | UX **0** (unscored) |
| Tab surfaces (`?tab=`, `?archTab=`) on buyer routes | Section **Internal** |
| — | Internal-runbook help paths (e.g. `/help/configuration-reference`) |

**Evidence** (Scores position 1) is shown only indirectly via row notes if the user asks;
this command ranks on **UX only**.

## Guardrails

- **Do not** edit scores, notes, or Hit% unless the user also invokes `/al-ui-ux` or
  `/al-ui-score`.
- **Do not** commit or push unless the user names a branch and asks to commit.
- **Do not** hand-build the table — always run the script so internal-path rules stay
  aligned with `archlucid_ui_route_traffic_table.py`.

## Canonical files

- `.local/owner/ui_route_traffic_estimates.md` — live master table (gitignored)
- `scripts/ci/list-archlucid-ui-route-lowest-ux.py` — list helper (this command)
- `scripts/ci/archlucid_ui_route_traffic_table.py` — `lowest_ux_buyer_rows()`, `is_buyer_facing_ux_row()`
- `scripts/ci/archlucid_ui_route_catalog.py` — `INTERNAL_UX_RANKING_HELP_PATHS`
- `docs/library/UI_UX_SCORING_RUBRIC.md` — UX dimension rubric
- `docs/architecture/UI_ROUTE_TRAFFIC_ESTIMATES_OWNER.md` — workbook location + guards

## Related commands

- `/al-ui-rate-lowest` — rate + ship **full** fix backlog for the lowest UX routes (no screenshot required)
- `/al-ui-ux` — set UX score (position 2) by ID
- `/al-ui-score` — set Evidence score (position 1) by ID
- `/al-ui-note` — add or replace Notes by ID
- `/al-ui-tableupdate` — reconcile master table with live route catalog
