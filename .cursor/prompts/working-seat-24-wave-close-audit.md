# WS-24 — Wave close audit — Working is not a walkthrough

Do not re-run WS-01–23. Evidence-only + ADR statuses. Do not claim insight density closed.

## Goal

Write `docs/architecture/WORKING_SEAT_ACCEPTANCE_2026-09-07.md`: evidence table for 0080, eval resolver, al-ui-rate brief, BuyerChrome gate, low-confidence default, degraded-coverage finalize block, Guided split. Mark shipped only if WS-05 and WS-08 are green without skipping architecture grandfather shrink.

## Why

Without a close audit, dual skin returns the next time someone runs `/al-ui-rate` on a Working screenshot.

## Context

- WS-08 guard
- ADR 0080 / 0078 / 0079
- `docs/architecture/README.md` orientation bullet

## What to build

1. Acceptance markdown + README link.
2. Residuals: admin grandfather, DX density, G-REAL-06 — named out of wave.
3. Optional: add eval-guard tests to an existing Vitest CI path (do not invent a workflow).

## Acceptance criteria

- Audit does not claim DX/FC engines closed.
- If Working still mounts BuyerChrome on architectures hub, wave is **not** marked shipped.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0080** and **Accepts 0078 / 0079**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run SY-01–100, AO-01–50, CA-01–50, FC-01–80, PC-01–13, DR-01–16, DX, or PT overlay waves except as a named leftover. Implement only *What to build*.
- **Do not** ship `/al-ui-rate` buyer-walkthrough remediations onto Working production modules (WS-07). Guided / demo / trial remain eval seats.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

