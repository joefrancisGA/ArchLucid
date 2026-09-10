# LP-20 — Wave close audit — livelihood-proof is fail-closed, not labeled

Do not re-run LP-01–19. Evidence-only. Do not claim DX engines or G-REAL-06 closed.

## Goal

Write `docs/architecture/LIVELIHOOD_PROOF_ACCEPTANCE_2026-09-08.md`: evidence table for ADR 0082/0083, emission validators, dual-stream, Simulator career, promote co-commit, guard inventory, ITSM CAS leftover. Mark **shipped** only if LP-02 and LP-03 persist gates are green and LP-05 has no trace-synthesized findings.

Link from `docs/architecture/README.md` and `LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md` status line.

## Why

Without a close audit, the next `/al-ui-rate` or honesty-only PR will leave empty `EvidenceRefs` as decision-grade again.

## Context

- WS-24 acceptance file as template
- LP-01–19
- Residuals: DX density, G-REAL-06, admin eval grandfather, semantic faithfulness TB-1228

## What to build

1. Acceptance markdown + README pointer.
2. Residuals named out of wave.
3. Optional: Vitest that `.cursor/prompts/livelihood-proof-0{1-9}*.md` and `10–20` files exist (file inventory only).

## Acceptance criteria

- Audit does not claim insight density or Real-mode pilots closed.
- If decision-grade can still persist with empty per-finding refs, wave is **not** marked shipped.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067–0081 bodies except Related pointers. This wave **adds ADR 0082** and **ADR 0083**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037).
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No G-REAL-06.
- **Do not** re-run WS-01–24, SY, FC, DR, DX, PC, LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.
