# WS-04 — Inventory remaining Working eval / buyer-polish leaks

Do not fix every leak in this session. Inventory only, plus a typed list WS-05+ can shrink.

## Goal

Produce a shrink-only inventory of Working production modules that still mount buyer-polish / sample / first-week / BuyerChrome. Reuse `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS` — do not grow it.

## Why

PC-04’s grandfather list still includes architecture review-detail, finding inspect, sponsor ROI, and architectures/new. Without an inventory, later prompts guess.

## Context

- `archlucid-ui/src/lib/production-desk-chrome-eval-inventory.ts`
- `archlucid-ui/src/lib/production-desk-chrome-eval-guard.ts`
- Grep `isBuyerPolishedOperatorShellEnv`, `BuyerChrome`, `useProductionEvalChrome`, `sample workspace`, `Stay on this page`

## What to build

1. Write `docs/architecture/WORKING_SEAT_EVAL_LEAK_INVENTORY.md` (internal): path, leak class (chrome / sample / first-week / fixture), owner prompt (WS-06/09/10/22).
2. Architecture / review / desk / findings paths are **priority**. Admin settings may remain grandfathered with one-line rationale.
3. Vitest: inventory file is referenced from a guard comment or test so it cannot rot silently — or extend the existing eval-guard discoverer to print architecture-priority leaks.

## Acceptance criteria

- Inventory exists and does not add grandfather rows.
- Priority paths are architecture/review/desk, not every admin page.

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

