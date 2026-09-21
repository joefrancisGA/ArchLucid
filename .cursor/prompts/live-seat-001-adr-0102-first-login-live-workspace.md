# LS-001 — ADR 0102: first login lands on live workspace

**Wave:** live-seat (**LS**). **Cluster:** kernel-adr. **Depends on:** none — run first.

Do not implement from the wave index. Implement only *What to build*.

## Goal

Author `docs/architecture/adrs/0102-first-login-live-workspace-explicit-training.md` (**Proposed**). Decision: a signed-in operator’s default seat is their **live tenant workspace**. **Training** is an explicit first-session choice, not the silent default. Admin invite is the normal join path; a default live workspace should already be waiting. Does not rewrite ADR 0086 doors, 0091 gravity, 0094 one-execute, or 0097 Record/Practice labels. No host Mode flip. No G-REAL-06.

## Why

Owner 2026-09-20: Record is selected (good) but Home still shows **NOT LIVE DATA** / **Customer Intake Demo**. Record vs Practice is not the bug. Silent sample scope is the bug. First-time users must be asked, unambiguously, whether they want Training. Returning users must see their own workspace with live data immediately.

## Context

- Index glossary: `.cursor/prompts/live-seat-00-index.md`
- ADR template: `docs/architecture/adrs/template.md` (Trade-offs, Constraints, Expected impact — security required)
- `docs/architecture/adrs/README.md` (next number **0102**; **0101** is AI diagram assist)
- Post-auth: `ArchLucid.Application/Identity/PostAuthBootstrapService.cs`
- Scope: `archlucid-ui/src/lib/operator/operator-scope-bootstrap.ts`
- Tenant default workspace: `ArchLucid.Application/Tenancy/TenantProvisioningService.cs`

## What to build

1. Write ADR 0102 with numbered Decision, Trade-offs, Constraints, Expected impact (include **security** — sample/demo scope must not be mistaken for the operator’s tenant; tenant isolation stays ADR 0037; do not weaken Record honesty on sample data), Consequences.
2. Quoteable glossary from the index: axes Scope / First-session purpose / Workspace mode / Review type. Training ≠ Practice. Live tenant workspace is **scope language**, never a Record/Practice door label.
3. Post-auth order: invitation → one membership → select workspace → create workspace → no access. Then first-session chooser if purpose unset.
4. README row. Proposed in this PR is OK.
5. Guard test: ADR file exists; `WorkingCareerRehearsalDoorValues.Career` remains `"career"`; host Mode default unchanged.
6. Record owner questions from the index (six items) as **Assumed until owner corrects** — do not invent different answers.
7. Do **not** change UI or bootstrap behavior in this prompt (LS-004+).

## Acceptance criteria

PR review can quote 0102 for “where do I land after login?” → live tenant workspace unless Training was chosen, and “is Training a third review type?” → No.

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
- Leftover owner: ADR 0097 / `OPERATOR_UI_EXPERIENCE_MODES.md`. **Do not re-implement that file.** Implement only *What to build*.
