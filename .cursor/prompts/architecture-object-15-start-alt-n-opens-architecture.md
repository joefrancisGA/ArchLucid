# AO-15 — `resolveWorkingStartHref` never returns a peer review URL

**Do not fork IS-03 / CA-33.** This **changes** the resolver ADR 0069 described.

## Goal

Change `resolveWorkingStartHref`:

1. If `lastOpenArchitectureId` (or in-flight’s parent architecture id) is set → `architectureIdentityPath` (optionally `?review=` / nested child — desk is the href).
2. Else → `/architecture/architectures/new`.
3. Delete reasons `in-flight-review` and `spawn-locked-review` as **href** targets. They may remain as **chip reasons** on the desk.

Pass architecture id into the resolver when only a review id is in session — look up parent (hook already has last-open; extend with in-flight’s `architectureId`).

## Why

Current code returns `reviewDetailPath(inFlightReviewId)` first. That is the load-bearing leftover of issue #1.

## Context

- `archlucid-ui/src/lib/working-start-route.ts`
- `use-working-start-href.ts`
- existing resolver tests

## What to build

1. Rewrite resolver + tests. No `reviewDetailPath` import in the production resolver.
2. Hook supplies parent architecture id for in-flight when last-open is empty.
3. Guided start path unchanged (chooser / reviews/new).

## Acceptance criteria

- Alt+N, sidebar Start, Home primary, palette New work all use the resolver.

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
