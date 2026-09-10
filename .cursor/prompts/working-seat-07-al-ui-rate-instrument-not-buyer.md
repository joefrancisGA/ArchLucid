# WS-07 — `/al-ui-rate` rates Working as an instrument, not a buyer demo

Do not delete `/al-ui-rate`. Do not require Opus. Guided/demo screens may still use the buyer-confidence brief.

## Goal

Amend `.cursor/commands/al-ui-rate.md` (and lowest variant if it duplicates the brief): when the screen is a **Working** architect workspace, critique as an all-day professional instrument (resume, density, honesty, keyboard). **Forbid** remediations whose only goal is first-run buyer confidence, sample CTAs, wizard collapse, or hiding shortcut chips. Default Working unless the user said Guided/demo/trial.

## Why

The command brief currently says: critique as Azure Portal design lead focused on **buyer confidence**, then ship every P0–P2 to master. That is how polish returned after PC-04.

## Context

- `.cursor/commands/al-ui-rate.md`
- `.cursor/commands/al-ui-rate-lowest.md`
- ADR 0080 (WS-01)

## What to build

1. Split the critique brief: Working vs Guided/demo.
2. Phase 2 must refuse backlog items tagged buyer-walkthrough when mode is Working.
3. One sentence in `docs/library/OPERATOR_UI_EXPERIENCE_MODES.md`: Working is not an `/al-ui-rate` buyer target.
4. Vitest not required unless you add a small markdown/guard test that the Working brief string exists in the command file.

## Acceptance criteria

- Command file no longer applies the buyer-confidence brief to Working by default.
- Guided path unchanged.

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

