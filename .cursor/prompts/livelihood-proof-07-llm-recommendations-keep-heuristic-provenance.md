# LP-07 — LLM recommendations keep heuristic provenance

Do not disable `LlmBackedArchitectureRecommendationEngine`. Do not invent finding-comment chat.

## Goal

When `LlmBackedArchitectureRecommendationEngine` returns a non-empty LLM list, it must **not** drop heuristic `ClaimOrigin` / provenance fields the `ArchitectureRecommendationEngine` would have attached. Merge: LLM prose may overlay title/body; `ClaimOrigin.SystemProposed` vs model-proposed must stay labeled; empty citations follow LP-03 hold rules if the rec is shown as decision-grade.

If LLM returns empty, keep today’s heuristic fallback.

## Why

Wholesale LLM return is a provenance bypass. Recommendations sit next to findings on the desk and in exports. An uncited “do X” reads like a ruled finding.

## Context

- `ArchLucid.Application/ArchitectureIntelligence/LlmBackedArchitectureRecommendationEngine.cs`
- `ArchitectureRecommendationEngine.cs`, `ClaimOrigin`
- Specialist review provisional gating — do not fork

## What to build

1. Merge function: heuristic row identity + LLM text; never strip origin.
2. C# tests: LLM non-empty still has ClaimOrigin; missing citations cannot present as evidence-backed.
3. UI trust chip on recommendation cards if they currently lack origin.
4. Do not persist LLM recs onto the sealed findings snapshot.

## Acceptance criteria

- Non-empty LLM recs are labeled system-proposed or model-proposed with origin intact.
- Sealed `FindingsSnapshot` is unchanged as product of record.

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
