---
description: Add or replace Notes for an ArchLucid UI route by table ID
---

# Set UI route note (`/al-ui-note`)

Update the **Notes** cell for one row in `.local/owner/ui_route_traffic_estimates.md`
by **ID** shorthand. Does not change scores or re-sort the table.

## Arguments (required)

```text
/al-ui-note <ID> <note text>
```

Examples:

```text
/al-ui-note ASK Needs citation drill-down in sponsor demo
/al-ui-note GFN Replace placeholder policy copy before pilot
/al-ui-note GRS --replace Effective policy stack read-only
/al-ui-note HOM --clear
```

- **ID** — table shorthand in the first column (case-insensitive; e.g. `ASK`, `GDX`).
- **note text** — free text for the Notes column (quote if it contains spaces).

Flags:

- **`--replace`** — overwrite existing Notes
- **`--clear`** — reset Notes to `None`

Default behavior: append with `; ` when Notes already has content; set directly when `None`.

## Workflow (strict order)

### Step 1 — Validate inputs

1. Parse **ID** and note text from the user message (after `/al-ui-note`).
2. Normalize ID to uppercase for lookup.
3. If note text is missing and `--clear` was not requested, stop and ask for note text.

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

### Step 3 — Apply update

From repo root, run **one** shell invocation:

```powershell
python .\scripts\ci\set-archlucid-ui-route-note.py <ID> "<note text>"
```

Use `--replace` or `--clear` when the user requests them.

### Step 4 — Report

```markdown
## UI route note updated

| Field | Value |
|-------|-------|
| ID | `<ID>` |
| Path | `<path>` |
| Previous note | `<old>` |
| New note | `<new>` |
| Rank | `<rank>` / `<total>` |
```

## Guardrails

- **Do not** change Hit%, Scores, Weight, Section, or ID codes unless the user explicitly asks.
- **Do not** commit or push unless the user names a branch and asks to commit.
- **Do not** re-sort the table for note-only updates.
- **Do not** edit `docs/architecture/ui_route_traffic_estimates.md` — that legacy path is gitignored and must not be re-tracked.

## Canonical file

- `docs/architecture/UI_ROUTE_TRAFFIC_ESTIMATES_OWNER.md` — owner workbook location + guards
- `.local/owner/ui_route_traffic_estimates.md` — live master table (gitignored)
- `scripts/ci/set-archlucid-ui-route-note.py` — note update helper
- `scripts/ci/archlucid_ui_route_traffic_table.py` — shared table parse/render

## Related commands

- `/al-ui-score` — set Evidence score by ID
