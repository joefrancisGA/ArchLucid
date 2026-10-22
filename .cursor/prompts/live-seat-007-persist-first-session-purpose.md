# LS-007 — Persist first-session purpose; returning users skip

**Wave:** live-seat (**LS**). **Cluster:** contract. **Depends on:** LS-006.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Store first-session purpose on the user (`live` | `training`) so the chooser is **once per user**. Returning logins skip the chooser and restore dedicated live scope unless purpose is `training` and they have not exited.

## Why

Asking every login is noise. localStorage-only will re-prompt on a new browser and still dump another device into demo. Server preference matches Working door persist (CG-011).

## Context

- `GET /v1/user/preferences` / `UserPreferencesController`
- Pattern: `workingCareerRehearsalDoor` + `IsExplicit` (do **not** reuse those fields)
- `UserSettings` key/value — add a new key, do not overload `WorkspaceMode`
- Assumed: once per user (index question 3)

## What to build

1. Additive preference: `firstSessionPurpose` (`live` | `training`) and `firstSessionPurposeIsExplicit`. Unset GET → chooser. Implicit default is **not** training.
2. `PUT /v1/user/preferences/first-session-purpose` (or equivalent nested patch). OpenAPI snapshot + generated TS types.
3. Chooser PUT then navigates. Returning GET explicit `live` → skip chooser, bootstrap dedicated scope.
4. Do not PUT from implicit GET. Do not write demo scope when purpose is `live`.
5. C# + Vitest: unset shows chooser; explicit live skips; explicit training does not skip until exit (LS-014) or they still skip chooser and land in training surfaces.

## Acceptance criteria

Second login as the same user never shows the chooser. Wire field names are new; Record/Practice tokens unchanged.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records (ADR 0039).
- **Do not** change `DeterministicInsightDensityGate` `typed-engine-protected`. **Do not** add a 40th coverage engine.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** flip `AgentExecution:Mode` host default from Simulator to Real. No G-REAL-06.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- TB-645 vocabulary. Sentence case. **TB-2005** form validation. Visible-boundary `Button` (no ghost/link).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) plus a numbered migration if schema changes.
- OpenAPI snapshot + generated TS types when wire contracts change (`docs/library/API_CONTRACTS.md`).
- **Do not** rename stored tokens `"career"` / `"rehearsal"`. **Do not** use **Working**, **Production**, **Real**, **Live**, **Standard**, or **Normal** as a Record/Practice door label. **Live tenant workspace** is scope language, not a review-type chip.
- **Do not** merge Training with Practice. **Do not** delete Guided. **Do not** hide **NOT LIVE DATA** honesty on a sample/demo workspace.
- **Do not** rewrite ADR 0086, 0091, 0094, or 0097 bodies. This wave adds first-login scope + training choice; Record/Practice honesty stays.
- Leftover owner: CG-011 preference persist. **Do not re-implement that file.** Implement only *What to build*.
