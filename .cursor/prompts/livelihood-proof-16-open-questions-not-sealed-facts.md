# LP-16 — Open questions are not sealed facts (WS-19 leftover honesty)

Do not rebuild `ArchitectureIdentityDeskOpenQuestions`. Do not add finding-comment chat.

## Goal

WS-19 shipped draft `openQuestions` + desk preview. Career artifacts and transparency trail must **not** treat that field as asserted intake unless the user maps it through the trail with confirm (ADR 0073 / 0078).

Exports: omit, or include under a named “working document — not sealed” bucket. Finalize must not copy open questions into `asserted` silently.

## Why

Judgment that was supposed to stay on the desk can leak into a sponsor PDF as if the requester asserted it.

## Context

- `architecture-open-questions-copy.ts`, `ArchitectureDraftFormFields.tsx`
- `evaluateCareerArtifactHonesty()`
- Intake transparency trail sections — `open-questions` key in structured content

## What to build

1. Honesty: career export/stamp/PDF skip or label open questions.
2. Vitest + C#: finalize does not promote open-questions text into asserted arrays without confirm.
3. Desk copy already says unsealed — keep it; add export test.

## Acceptance criteria

- Sponsor PDF cannot present open questions as sealed asserted requirements.
- Draft field behavior unchanged.

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
