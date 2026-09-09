# SY-03 — Falsifiable Monday-morning contract (stronger than AO-50)

Do not fork AO-50. This is the SY done-test module; SY-80 mounts the guard.

## Goal

Publish one typed contract `WorkingMondayObjectContract` (TS) that fails if any of these are true on Working:

1. Start / Alt+N / last-open href is `/architecture/reviews` or `/architecture/reviews/{id}`.
2. Global `SHORTCUTS` `alt+r` route is `REVIEWS_LIST_PATH`.
3. Global `alt+c` / `alt+a` / `alt+y` routes are bare `/insights/*` with no architecture nest helper.
4. Working Home primary CTA imports `reviewDetailPath` or `startReviewFromArchitectureHref` (peer start).
5. Nested tool builders (`architectureNestedAskPath`, etc.) are missing after SY-36+.

Ship the **types and comments** now; SY-80 wires Vitest. Guided is out of the contract.

## Why

AO-50 only proved Start does not land on a run URL. Muscle memory (Alt+R = packages inbox) and peer Insights still teach the job as the product. Without a stronger contract, overlays will keep winning.

## Context

- `archlucid-ui/src/lib/architecture-object-acceptance-guard.test.ts`
- `archlucid-ui/src/lib/shortcut-registry.ts`
- `archlucid-ui/src/lib/architecture/architecture-routes.ts`

## What to build

1. Add `archlucid-ui/src/lib/architecture/working-monday-object-contract.ts` with the five predicates documented as comments + exported path helper names (may be stubs that throw `not implemented` until SY-36 — prefer optional helpers that return null until nested routes exist).
2. Vitest that the contract **module exists** and names ADR 0079.
3. Do not fail CI on missing nested Ask yet — SY-80 tightens after 36–43.

## Acceptance criteria

- File exists and lists the five Monday-morning failures in comments a reviewer can quote.

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

