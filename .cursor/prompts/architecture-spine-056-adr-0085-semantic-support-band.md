# AS-056 — ADR 0085: semantic support is a Working career band, not a sync commit gate

**Wave:** architecture-spine (**AS**). **Cluster:** semantic-adr. **Depends on:** AS-001 (can parallel after 0084 exists).

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author ADR 0085. Decision: TB-1228 three lanes stay. Working career surfaces show a per-finding **support band** (Supported / Unchecked / Unsupported / NotScored). Structural provenance (ADR 0082) remains the persist gate. Semantic band is not fused into insight-density. Default finalize is **warn** on Unchecked, not block.

## Why

Livelihood risk is defending a cited finding that does not follow from the evidence. Structural refs do not prove that. A sync LLM judge on commit is the false-reject TB-1228 rejected.

## Context

- FAITHFULNESS_SUPPORT_RATIO_SCORING_LANE_POSITIONING_CONTRACT.md
- TB-1228 / TB-1229
- ADR 0082 — do not rewrite
- Next number **0085**

## What to build

1. ADR + README row.
2. Guard: ADR does not claim semantic = legal truth; does not make RAG support-ratio the commit gate.
3. No scorer in this prompt.

## Acceptance criteria

- Quoteable contract for “may we block seal on LLM faithfulness?” → No, unless PilotStrict opt-in later (AS-065).

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

