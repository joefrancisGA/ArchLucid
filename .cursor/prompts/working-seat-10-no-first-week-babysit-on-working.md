# WS-10 — No first-week babysit copy on Working

Do not delete Guided first-week guidance. Do not collapse review tabs.

## Goal

Working must not render “Stay on this page until you finalize”, “Recommended first session path”, or Operate-sidebar lock notes. FD-12 started this; buyer variant `BUYER_REVIEW_DETAIL_IN_PROGRESS_GUIDANCE` still leaks if eval chrome is true.

## Why

`archlucid-ui/src/lib/first-week-route-guidance.ts` still has babysit copy for buyer in-progress reviews. Working mounts must use `useProductionEvalChrome` not the env flag.

## Context

- `first-week-route-guidance.ts`
- `RunDetailFirstWeekRouteGuidanceMount`
- FD-12 wait copy

## What to build

1. Working review-detail / home / reviews-list: no first-week babysit strip.
2. In-flight wait is the desk chip / queue (WS-17), not “stay here”.
3. Vitest: Working config is not the buyer stay-on-page sentence.

## Acceptance criteria

- Grep Working review-detail render path: no stay-on-this-page string.
- Guided still has first-session guidance.

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

