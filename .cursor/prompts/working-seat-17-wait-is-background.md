# WS-17 — Wait is background; the desk stays usable

Do not delete in-flight tracking. Do not invent GET `/v1/runs/{id}/progress` if the contract forbids it (TB-2072).

## Goal

Working in-flight reviews show on the architecture desk and Home queue. The review-detail page does not require the user to stay focused until finalize. Soft-nav timeouts must not look like success.

## Why

Create → execute → wait is still the emotional spine even after nested URLs. Soft navigation 20s / creation 45s can stall without hard navigate.

## Context

- `ArchitectureIdentityDeskInFlightSection.tsx`
- `use-soft-navigation-loading.ts`
- `LONG_RUNNING_OPERATIONS_CONTRACT.md`
- FD-12 Working wait copy

## What to build

1. Desk in-flight strip is the canonical wait UX (continue other work).
2. Review-detail in-progress: continue architecture / back to desk, not stay-here.
3. Timeout copy tells them the job continues in background when that is true.

## Acceptance criteria

- Working in-progress review has a path back to the desk without losing the job.
- No stay-on-this-page primary.

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

