# SY-02 — ADR 0079 — the architecture desk is the work surface, not a launch pad

Do not rewrite 0077. 0079 supersedes AO-30–32 “bind peer /insights routes with query params” as the Working **product** shape.

## Goal

Write **ADR 0079**: on Working, Ask / Compare / Graph / Search / Findings are **verbs on the open architecture** with nested URLs under `/architecture/architectures/{architectureId}/…`. Binding a peer Insights app (`/insights/ask-review-questions?architectureId=`) is **not** sufficient. `/architecture/reviews` remains a cross-architecture **inbox**, never Monday morning, and **must not** own Alt+R.

Falsifiable:

1. Working canonical work surface is the architecture desk (0077 locator + this ADR’s nested tools).
2. Peer `/insights/*` and `/architecture/reviews/{id}` are Guided/legacy aliases; Working redirects when `ArchitectureId` is known (SY-37/39/41).
3. Reject “keep Insights as peer products forever.” Reject merging kernels. Reject collapsing review-detail tabs.
4. Guided / demo / trial may keep peer Insights and peer review URLs.

## Why

AO nested the **review job** and rebound tools with query params. The paying desk still **leaves** the system to Ask/Compare/Graph. That is why Monday morning still feels like a pipeline: the object you own is a summary card; the work lives in other products.

## Context

- `docs/architecture/adrs/template.md`
- `docs/architecture/adrs/0077-working-architecture-is-the-locator.md`
- `archlucid-ui/src/lib/resolve-working-insights-nav-href.ts`
- `archlucid-ui/src/lib/shortcut-registry.ts` (`alt+c` / `alt+a` / `alt+y` / `alt+r`)

## What to build

1. `docs/architecture/adrs/0079-working-desk-is-the-work-surface.md` with Trade-offs, Constraints, Expected impact (include security: nested routes 404 on architecture/run mismatch).
2. Row in `docs/architecture/adrs/README.md` (0079 is next after 0078).
3. Explicit supersede: AO-30–32 Working *product* shape (bind-by-query). Keep their honesty empty-states; change the URL taxonomy.
4. Do **not** implement routes in this PR unless bundled with SY-03 types only.

## Acceptance criteria

- A reviewer can quote 0079 to refuse a new Working Insights peer page as the daily tool.
- 0077 file body stays locator-only.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). Nested review chrome keeps the full strip. A desk **command bar** or nested tool route is not a More menu for those tabs.
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0068, 0069, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0079** (desk is the work surface) and **Accepts ADR 0077** when the locator already shipped.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run AO-01–50, CA-01–50, DA-01–12, PC-01–13, DR-01–16, FC-01–80, or LK except as a named leftover. Implement only *What to build*.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact**. SQL stays in the single DDL file per database plus a numbered migration if schema changes (this wave should not need new tables).

