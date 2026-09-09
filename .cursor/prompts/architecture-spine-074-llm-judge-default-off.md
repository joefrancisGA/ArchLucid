# AS-074 — LLM semantic judge stays default off for the band

**Wave:** architecture-spine (**AS**). **Cluster:** semantic-hold. **Depends on:** AS-058.

Do not implement from the wave index. Implement only *What to build*.

## Goal

If a premium LLM judge is wired later, default off (same posture as EnableProseAssumptionExtraction). Heuristic is the default scorer. Document in ADR 0085 Related.

## Why

Cost + non-reproducible seal-adjacent scoring.

## Context

- InsightDensityGateOptions EnableProseAssumptionExtraction default false
- DX-02 judge — do not re-run

## What to build

1. Options default + test.
2. No new judge implementation required if none exists.

## Acceptance criteria

- Default path has zero LLM for support band.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** re-run ESI, IE-01–IE-22, LP, FP, WS, SY, AO, DX-01–DX-68 bodies except as a named leftover. Implement only *What to build*. Consume IE types; do not fork a second Azure collector.
- **Do not** add a 40th coverage engine or a “node type missing from diagram” engine. **Do not** invent live presence avatars or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06. Career vs Rehearsal is product chrome (AS-076+), not a host-config flip.
- **Do not** make vision/OCR extract default-on. Working opt-in only (AS-040).
- Architecture-scoped sharing (AS-086+) is **inside** the tenant. **Do not** replace ADR 0037 catalog isolation. **Do not** add SQL RLS.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).

