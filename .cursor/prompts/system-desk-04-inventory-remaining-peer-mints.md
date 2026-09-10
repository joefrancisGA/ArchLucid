# SY-04 — Inventory remaining Working peer-review and peer-Insights mints

Do not fix call sites here. Do not fork AO-08 / AO-39.

## Goal

Produce `docs/architecture/SYSTEM_DESK_PEER_MINT_INVENTORY.md` (engineering-only) listing current Working (or shared) call sites that still mint:

- `reviewDetailPath(`
- `startReviewFromArchitectureHref(`
- `REVIEWS_LIST_PATH` as a **parent** or **primary CTA**
- bare `ASK_REVIEW_QUESTIONS_PATH` / `COMPARE_TWO_REVIEWS_PATH` / `EVIDENCE_GRAPH_PATH` as keyboard or Home targets

Each row: path, Working vs Guided vs shared, SY owner prompt number (from this index). No product code changes.

## Why

AO-08 converted many sites; leftovers remain (first-review guide, buyer nav, room, pin, invite, dual-pane fallback). Without an inventory, later SY prompts will collide or miss.

## Context

- Grep `reviewDetailPath` under `archlucid-ui/src`
- `archlucid-ui/src/lib/first-review-guide-status.ts`
- `archlucid-ui/src/lib/buyer/buyer-safe-review-navigation.ts`
- `archlucid-ui/src/lib/reviews/review-room-elicitation-url.ts`
- `archlucid-ui/src/lib/reviews/review-pin-run-url.ts`

## What to build

1. Markdown inventory with SY-18–SY-35 / SY-81–SY-89 owners filled in.
2. Vitest optional: inventory file contains `reviewDetailPath` as a documented leftover heading — do **not** parse production TS.

## Acceptance criteria

- Every grep hit in `archlucid-ui/src` (excluding tests that assert Guided) appears as a row or an explicit Guided exemption.

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

