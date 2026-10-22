# AO-01 — ADR 0077: Architecture is the Working locator; review is a nested job

**Do not rewrite** ADR 0068, 0069, 0072, or 0074 bodies. **Do not merge tables.** Confirm next ADR number (**0077** if 0076 is the last numbered file).

## Goal

Write **ADR 0077**: on the Working seat, the **canonical locator for the working day** is the named architecture identity (`dbo.Architectures` / `architectureIdentityPath`). A review is a **nested governed job** of that architecture, not a peer product whose URL becomes Home after spawn.

Falsifiable decisions:

1. Working canonical URL is `/architecture/architectures/{architectureId}` whenever an identity exists — including while a review is in flight, spawn-locked, or sealed.
2. Review job URL nests: `/architecture/architectures/{architectureId}/reviews/{reviewId}` (AO-04). Draft editor nests: `/architecture/architectures/{architectureId}/drafts/{draftId}` (AO-05).
3. `resolveWorkingStartHref` must **not** return `reviewDetailPath` as the primary Working locator (supersedes ADR 0069 in-flight-review-first and ADR 0072 review-as-canonical-after-spawn **for Working only**).
4. Spawn-locked drafts remain **not** a second live editor (0072 handoff intent kept) — the architect stays on the architecture desk with a job chip, not an exile to `/architecture/reviews/{id}`.
5. `/architecture/reviews` on Working is a **cross-architecture inbox**, not Monday morning.
6. Guided / demo / trial may keep peer review URLs (ADR 0067).
7. Reject Option L (merge tables). Reject per-architecture ACL. Reject collapsing review workspace tabs.

Status **Proposed** is enough if AO-04 lands Accepted in the same PR.

## Why

CA-01–50 productized a named parent. ADR 0072 still makes the **review URL** canonical after spawn. ADR 0069 Start still prefers **in-flight review**. The paying desk therefore lives in a pipeline execution. Livelihoods attach to the **system they own** across days, not to the last run id in the address bar.

## Context

- `docs/architecture/adrs/template.md`
- `docs/architecture/adrs/README.md` (next is **0077**)
- `docs/architecture/adrs/0069-working-desk-one-work-object.md` (Start routing clause)
- `docs/architecture/adrs/0072-working-canonical-work-identity.md`
- `docs/architecture/adrs/0074-customer-visible-architecture-identity.md`
- `archlucid-ui/src/lib/working-start-route.ts`
- `archlucid-ui/src/lib/architecture/architecture-routes.ts`
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R13

## What to build

1. `docs/architecture/adrs/0077-working-architecture-is-the-locator.md` with required sections.
2. Row in `docs/architecture/adrs/README.md`.
3. Explicit supersede note: 0072 Working “canonical URL after spawn” and 0069 Working “in-flight review first” — Guided unchanged.
4. Do **not** implement routes in this PR unless bundled with AO-02 taxonomy types only.

## Acceptance criteria

- A reviewer can quote 0077 to refuse `reviewDetailPath` as Working Start / Alt+N / last-open.
- A reviewer can quote 0077 to require nested review URLs on Working.
- 0068 / 0069 / 0072 / 0074 file bodies are byte-stable except Related pointers if you must add a link (prefer 0077 Related only).

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
