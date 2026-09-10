# AO-46 — UX-audit / demo screenshots: Working Home is architectures

**Do not fork lucid-ui-audit skill** beyond route registry if Home slug changes.

## Goal

Operator (Working) UX-audit Home screenshot and demo walkthrough copy must show architecture portfolio as the first desk, not Reviews hub as Home.

Update `ux-audit-route-registry.ts` if Home assertions are review-centric. Buyer-polished captures may still show eval theater.

## Why

M-07 screenshots train sales. If they show Reviews as Home, the wave is theater.

## Context

- `archlucid-ui/e2e/ux-audit-route-registry.ts`
- DEMO_WORKSPACES / walkthroughs
- lucid-ui-audit skill

## What to build

1. Registry/home fixture notes.
2. Guard test: Working Home screenshot route is `/` or architectures, not `/architecture/reviews`.
3. Do not require regenerating all 30 PNGs in this PR unless the prompt runner already has the harness — prefer registry/tests.

## Acceptance criteria

- Quarterly full PNG recapture is not required to merge this prompt.

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
