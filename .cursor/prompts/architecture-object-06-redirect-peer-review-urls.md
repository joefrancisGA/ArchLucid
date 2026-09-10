# AO-06 — Working redirects `/architecture/reviews/{id}` to the nested job

**Do not fork AO-04.** Implement after nested page exists. **Do not** break Guided bookmarks.

## Goal

On Working, a request to `/architecture/reviews/{reviewId}` (and print/findings/provenance children) **redirects** to the nested path when `ArchitectureId` is known.

Unlinked legacy reviews (CA-19): stay on the peer URL **with honesty** that the job has no parent — do not invent an identity. Guided: no redirect (or redirect only when a Working flag says so — default off).

## Why

Without redirects, Slack/email/CI links keep opening the peer product. Nested routes become a second website.

## Context

- `reviewDetailPath`
- middleware or page-level `redirect()` in the legacy review layout
- run summary DTO `architectureId`
- CA-19 unlinked honesty

## What to build

1. Working + known ArchitectureId → 308/Next redirect to nested path, preserve query (`reviewTab`, pin, presenter leftovers).
2. Working + null ArchitectureId → render legacy + honesty banner; CTA cannot fake a parent.
3. Guided: no redirect.
4. Vitest on a small redirect helper (pure function) plus one page test.

## Acceptance criteria

- Query string preserved (`reviewTab`, `pinRunId` from DR-11).
- Tenant isolation: redirect target still scoped; no cross-tenant id in the path from a guessed parent.

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
