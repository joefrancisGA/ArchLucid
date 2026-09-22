# LW-059 — 401 resume kind: policy_pack_save

**Wave:** lost-write (**LW**). **Cluster:** 401-resume. **Depends on:** LW-053.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Policy pack authoring save/PATCH uses the wrapper. Publish remains permanent and should use the same idempotency story or an explicit “already published” 409 — do not auto-replay publish without reading current version.

## Why

Pack text is a livelihood document. Publish is a stamp.

## Context

- `PolicyPacksPageClient.tsx`
- livelihood-document-guard policy-pack-authoring

## What to build

1. Save/PATCH: resume. Publish: inventory whether resume is safe; if not, persist the payload and require a confirm after sign-in instead of auto-POST.

## Acceptance criteria

- Save resumes. Publish does not double-publish.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** re-run AS / FP / LP / WS / LK / V12-01 bodies except as a named leftover. Implement only *What to build*.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).

