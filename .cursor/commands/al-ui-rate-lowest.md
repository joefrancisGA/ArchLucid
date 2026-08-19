---
description: Rate and ship the full fix backlog for the lowest UX-scored buyer-facing routes (no screenshot attachment required)
---

# Rate lowest UX routes (`/al-ui-rate-lowest`)

Combines **`/al-ui-lowest`** (workbook ranking) with **`/al-ui-rate`** (Opus critique + Composer remediation). For each selected route, runs the full **four-phase** `/al-ui-rate` pipeline and ships **every** item in the fix backlog (P0, P1, P2) — not P0-only.

**No screenshot attachment required.** Screenshots are resolved per route (ux-audit PNG when available, otherwise browser capture).

**Default git target:** **`master`** (override only when the user names another branch in the same message).

---

## Arguments

```text
/al-ui-rate-lowest
/al-ui-rate-lowest 3
/al-ui-rate-lowest 1 --rate-only
/al-ui-rate-lowest --rate-only 5
```

- **`N`** (optional) — how many lowest-UX buyer-facing routes to process, in workbook order. Default **1**. Must be a positive integer.
- **`--rate-only`** (optional) — critique + workbook score write only; no code changes, no commit. Stops after Phase 1 for each route (no Phase 2–3).

If extra tokens are present, treat the first numeric token as **N**; honor `--rate-only` anywhere in the message.

---

## Guardrails

- Follow **all** guardrails in `.cursor/commands/al-ui-rate.md` (product language, Carbon/Fluent, working-tree safety, no TB rows unless asked).
- **Ship the full fix backlog** for each route — same as `/al-ui-rate` (P0, P1, P2). Do not downgrade to P0-only implementation.
- Process routes **sequentially** (one full pipeline per route). Do not parallelize commits across routes in one invocation unless the user explicitly asks.
- **Do not** hand-build the lowest-UX table — always run `list-archlucid-ui-route-lowest-ux.py`.
- After each route that ships code, run the **CI gate** before starting the next route (or batch one commit per route — prefer **one commit per route** for traceability).

---

## Workflow (strict order)

### Step 1 — Bootstrap workbook when missing

If `.local/owner/ui_route_traffic_estimates.md` is absent:

```powershell
python .\scripts\ci\bootstrap-ui-route-traffic-owner-workbook.py
```

### Step 2 — List lowest UX buyer-facing routes

```powershell
python .\scripts\ci\list-archlucid-ui-route-lowest-ux.py --limit <N>
```

Parse the markdown table for **ID**, **Path**, and **UX** score. These are the routes to process (top **N** rows).

Print the table in chat before starting remediation.

### Step 3 — Process each route (repeat for N rows)

For each row in order (lowest UX first):

#### 3a — Resolve screenshot

Try in order:

1. **ux-audit buyer PNG** — `archlucid-ui/public/screenshots/ux-audit/buyer/*.png` or `marketing/*.png` whose slug maps to the workbook path (match `href` in `archlucid-ui/e2e/ux-audit-route-registry.ts` to workbook Path).
2. **Browser capture** — `cursor-ide-browser`: navigate to the route on local dev or staging (use owner context if provided), `browser_take_screenshot`, save path for Phase 1 `file_attachments`.
3. **Blocked** — if capture fails, report the route as **skipped (no screenshot)** and continue to the next route unless the user supplied a env base URL in context.

#### 3b — Run `/al-ui-rate` phases for this route

Use the route **ID** from the workbook table. Delegate Phase 1 to **Opus High** with the screenshot path(s) and the **verbatim critique brief** from `al-ui-rate.md`.

| Phase | Action |
|-------|--------|
| 1 — Rate | Opus High subagent — full fix backlog + `RATING` block (`fix_count`, `p0_count`, projected scores) |
| 2 — Implement | Composer 2.5 — **entire** fix backlog (unless `--rate-only`) |
| 3 — Ship | Parent — commit + push to **`master`**, `/fix-ci` until green (unless `--rate-only`) |
| 4 — Score | Parent — workbook UX + Evidence + Note for this **ID** |

**Stop early for this route** when `--rate-only`, when `fix_count = 0`, or when quality gate cannot go green (leave changes uncommitted; report blocker; do not process further routes unless user asks to continue).

#### 3c — Report per-route summary

Before moving to the next route, print a short block: ID, path, fix backlog disposition, commit SHA (if any), scores written.

### Step 4 — Final summary

Aggregate table:

| # | ID | Path | UX before → written | Fixes shipped | Commit |
|---|-----|------|---------------------|---------------|--------|
| 1 | … | … | … | n/total | sha / skipped |

---

## Failure handling

| Situation | Action |
|-----------|--------|
| Workbook missing and bootstrap fails | Stop with error |
| No buyer-facing rows | Report empty queue |
| Screenshot unavailable for a route | Skip that route; continue unless user says stop |
| Opus / Composer unavailable | Same as `al-ui-rate.md` failure table |
| CI red after a route ships | `/fix-ci` before next route; if still red, stop the batch and report |

---

## Canonical files

Same as `/al-ui-rate`, plus:

- `scripts/ci/list-archlucid-ui-route-lowest-ux.py` — lowest UX list (this command)
- `archlucid-ui/e2e/ux-audit-route-registry.ts` — path ↔ ux-audit slug mapping
- `archlucid-ui/public/screenshots/ux-audit/` — pre-captured buyer/marketing PNGs

## Related commands

- `/al-ui-rate` — single screenshot critique + full backlog remediation
- `/al-ui-lowest` — list lowest UX scores only (no remediation)
- `/lucid-ui-audit` — refresh ux-audit PNG corpus (`npm run ux-audit`)
