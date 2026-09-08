# AO-07 — Spawn lock hands off to the architecture desk, not exile to a review URL

**Do not fork LK-04 / SD-10 / ADR 0072 handoff panel.** Change **where** Working sends you. Do not unlock the draft.

## Goal

After `linkedReviewId` / spawn lock:

- Working primary locator stays `architectureIdentityPath`.
- Draft editor is read-only handoff **embedded or linked as a child**, CTA **Resume review** opens the **nested** review job (AO-04), not `reviewDetailPath`.
- Bookmark of `/architecture/architectures/{draftId}` on Working redirects to the identity desk (CA-21 leftover) when the draft has `ArchitectureId`.

Do not `router.replace` to `/architecture/reviews/{id}` as the success path of Start review.

## Why

0072 correctly forbade a second live editor. It incorrectly made the review the only remaining instrument. That is how Monday morning became a run.

## Context

- `ArchitectureDraftHandoffPanel`
- spawn lock / `architecture-draft-handoff-gate.ts`
- Start review success navigation
- `resolveWorkingStartHref` spawn-locked branch

## What to build

1. Start review success → nested review **under** architecture, or stay on desk with in-flight chip (AO-21) — pick one and test; do **not** go to peer review URL.
2. Handoff panel primary CTA uses nested path.
3. Vitest: spawn-locked Working fixture never asserts `reviewDetailPath` as canonical.
4. Guided may still jump to peer review URL.

## Acceptance criteria

- Draft remains locked. Clone-from-snapshot (WA-10 / AO-36) stays the legal new version.

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
