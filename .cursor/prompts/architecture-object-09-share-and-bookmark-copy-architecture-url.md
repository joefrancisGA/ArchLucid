# AO-09 — Copy link / share on Working copies the architecture locator (job as query or nested path)

**Do not fork** export verify (DR-10). This is clipboard / share sheet only.

## Goal

Working “Copy link” on review-detail, findings, and desk copies a URL whose **path** starts with `/architecture/architectures/{architectureId}`. Nested job path is allowed. Peer `/architecture/reviews/{id}` is not the clipboard default on Working.

If the job has no parent, copy the peer URL and the toast must say the job is unlinked.

## Why

People paste links into tickets. If the paste is a run id, the org’s muscle memory stays pipeline.

## Context

- Copy-link controls on review workspace / desk
- `reviewDetailPath` vs nested builders

## What to build

1. Shared helper `workingShareHref({ architectureId, reviewId, search })`.
2. Working copy uses it. Guided may copy peer review URL.
3. Vitest for helper + one control test.

## Acceptance criteria

- Do not put Bearer or scope in the URL.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, or 0074 bodies — Related pointers only. This wave **supersedes** 0072’s Working locator and 0069’s in-flight-review-first Start clause via **ADR 0077**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run CA-01–50, DA-01–12, PC-01–13, DR-01–16, or LK except as a named leftover.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).
