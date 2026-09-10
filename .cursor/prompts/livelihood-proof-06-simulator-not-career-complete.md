# LP-06 — Simulator rehearsal cannot be career-complete without waiver

Do **not** flip `AgentExecution:Mode` default from Simulator to Real. Do not fork ADR 0078 validators — call them.

## Goal

Working career artifacts (finalize stamp, sponsor PDF, print, decision receipt, ADR export) treat **Simulator** as **not career-complete** unless explicit demo/sample/rehearsal waiver copy is on the artifact (ADR 0078 §5 leftover on finding lists and stamp, not only the top-bar chip).

Finding lists, quick-decision, and inspect must show rehearsal language when the run is Simulator — not only `SimulatorModeAiOperationNotice` on some AI surfaces.

## Why

Default host Mode is Simulator (`ArchLucid.Api/appsettings.json`). An architect who works all day in rehearsal can still screenshot a stamp that reads like Real. That is the livelihood miss.

## Context

- ADR 0078, `evaluateCareerArtifactHonesty()`, `CareerArtifactCompletenessValidator`
- `simulator-mode-chrome-copy.ts`, `FindingTrustChip` `simulator-derived`
- `proof-confidence-taxonomy.ts`

## What to build

1. Extend honesty evaluator: Simulator + Working career export → block unless waiver/rehearsal banner fields are present.
2. Findings desk: persistent rehearsal caption on Simulator runs (not dismissible forever).
3. Vitest + C# parity: Simulator package cannot pass career-complete without the waiver flag.
4. Guided/demo may keep teaching seals labeled sample.

## Acceptance criteria

- Working Simulator finalize/export cannot omit rehearsal labeling.
- Default Mode remains Simulator.

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
