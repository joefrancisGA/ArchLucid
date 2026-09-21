# LS-002 — Inventory: signed-in users still on sample scope

**Wave:** live-seat (**LS**). **Cluster:** inventory. **Depends on:** LS-001.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Produce `docs/architecture/LIVE_SEAT_SIGNED_IN_SAMPLE_SCOPE_INVENTORY.md`: every path that can put a **signed-in** operator on Customer Intake Demo / dev-default / pinned demo scope without an explicit Training or sample visit.

## Why

The owner screenshot is Record + sample scope. Fixing Home copy without listing the writers of `archlucid_operator_scope_v1` will leave another silent demo landing.

## Context

- `archlucid-ui/src/lib/operator/operator-scope-bootstrap.ts`
- `operator-workspace-scope-model.ts` (`buildCustomerIntakeDemoScopeRecord`, `isSampleWorkspaceScope`)
- `operator-scope-actions.ts` (`visitSampleWorkspaceScope`)
- `OperatorWorkspaceScopeBootstrapHost.tsx`
- `archlucid-ui/src/lib/scope.ts` (`DEV_SCOPE_*`)
- `DevelopmentDefaultScopeTenantBootstrap.cs`
- Demo flags: `NEXT_PUBLIC_DEMO_MODE`, `NEXT_PUBLIC_DEMO_STATIC_OPERATOR`
- Post-auth complete redirect vs cookie/localStorage race

## What to build

1. Inventory table: writer, trigger, signed-in?, requires explicit sample visit?, test coverage today.
2. Call out **silent** writers: persisted Customer Intake Demo, missing dedicated candidate, registration payload falling through to sample, RSC cookie defaults, Playwright helpers that leak into product code.
3. Distinguish **intentional** demo builds (eval flags on) from **hosted signed-in** seats.
4. Do not change behavior. Vitest that the inventory file exists and names `bootstrapDedicatedWorkspaceScope` plus `visitSampleWorkspaceScope`.

## Acceptance criteria

A later LS-010 implementer can grep this inventory and know every silent demo writer. No UI copy edits in this prompt.

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
- Leftover owner: `LIVE_SEAT_COMPOSER_PROMPTS.md`. **Do not re-implement that file.** Implement only *What to build*.
