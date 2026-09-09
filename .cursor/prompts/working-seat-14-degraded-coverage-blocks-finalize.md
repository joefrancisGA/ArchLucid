# WS-14 — Degraded finding coverage blocks Working finalize

Do not unseal. Do not fail-open when enginesSucceeded is null (DR-01). Do not add engines.

## Goal

On Working, `degradedFindingCoverage === true` **blocks** finalize / career export the same way skipped MUST does. Banner is not enough. Guided/demo may keep advisory-only with loud label.

## Why

`DegradedFindingCoverageBanner` is advisory. Finalize is permanent. Time pressure stamps an incomplete package.

## Context

- `RunDetailFindingCoverageDispositionPanel.tsx`
- Pre-finalize gates / `AuthorityCommitSkippedMustGate` pattern
- ADR 0078 / 0073

## What to build

1. Wire degraded coverage into the Working pre-finalize scorecard as a **block**, with the failed engine labels.
2. Server must agree (do not UI-only). Reuse existing coverage flags on the run detail model.
3. Vitest + one C# test: Working career path cannot commit while coverage degraded.
4. Record correction remains the path after a mistaken historical seal — do not unseal.

## Acceptance criteria

- Working finalize CTA disabled with named engines when degraded.
- API rejects the same commit.

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

