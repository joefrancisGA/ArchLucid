# AO-05 — Next.js nested draft editor under the architecture identity

**Do not fork CA-20 / CA-21** identity vs draft split. **Do not** unlock spawn-locked drafts (0072).

## Goal

Add `/architecture/architectures/[architectureId]/drafts/[draftId]` as the Working editor.

`architectureIdentityDraftHref` query `?draft=` may remain as a short alias that rewrites to the nested path. Spawn-locked drafts render the existing handoff **on the architecture desk** (AO-07), not a live nested editor.

Draft `ArchitectureId` must match the route param.

## Why

`architectureDraftPath` still uses `/architecture/architectures/{draftId}`. That is DraftId masquerading as the collection item — CA tried to stop the name; the URL still does it.

## Context

- `architecture-routes.ts` (`architectureDraftPath`, `architectureIdentityDraftHref`)
- `ArchitectureDraftWorkspaceBody` / handoff panel
- architectures `[architectureId]/page.tsx`

## What to build

1. Nested draft route reuses the draft workspace when unlocked.
2. Working new links use nested builder when identity exists.
3. Vitest: spawn-locked nested draft does not autosave (existing lock).
4. Do not 404 old draft bookmarks (AO-07).

## Acceptance criteria

- Unsealed undo (ADR 0071) still applies only to unlocked drafts.
- No merge of draft and review pages.

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
