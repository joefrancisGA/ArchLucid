# AO-13 — Working Home is the architecture portfolio, not a reviews theater

**Do not fork PC-05 / CA-25 / IS-02 Home.** Leftover: Home still resumes a review or shows review heroes.

## Goal

Working Home primary list/resume is **architectures** (named identities). In-flight reviews appear as **status on a row**, not as the Home object.

Remove Working Home primary CTA that opens `reviewDetailPath`. Secondary “inbox” link to `/architecture/reviews` is OK.

## Why

PC-05 named the portfolio. Start still prefers in-flight review (working-start-route). Home and Start must agree with ADR 0077.

## Context

- Operator Home page / stickiness / unfinished-work stack
- `resolveWorkingStartHref`
- CA-25 identities hub
- PC-05

## What to build

1. Working Home resume → `architectureIdentityPath`.
2. In-flight shown as chip/status on that architecture row (AO-21 can finish the chip).
3. Vitest: Working Home fixture has no primary href to `/architecture/reviews/{id}`.
4. Guided Home may keep first-review theater.

## Acceptance criteria

- Do not remount first-review progress strip on Working (AD intentional).

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
