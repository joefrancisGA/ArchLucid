> **Scope:** ADR 0102 — first login lands on live tenant workspace; Training is explicit.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0102: First login lands on live workspace; Training is explicit

- **Status:** Proposed
- **Date:** 2026-09-20
- **Owner decision:** A signed-in operator's default seat is their **live tenant workspace**. **Training** is a once-per-user first-session choice, not silent sample scope.

## Context

Signed-in operators were landing on **Customer Intake Demo** with **NOT LIVE DATA** banners while **Record** was selected. Record vs Practice (ADR 0097) is correct; the bug is **scope** — dev-default sample scope persisted in the browser without an explicit Training choice.

Axes stay separate: **scope** (live tenant vs sample), **first-session purpose** (Start in my workspace vs Training), **workspace mode** (Working vs Guided), and **review type** (Record vs Practice). Training is Guided teaching chrome plus an explicit sample visit; it is not Practice.

Post-auth order: invitation → one membership → select workspace → create workspace → no access; then the first-session chooser when purpose is unset. Assumed until owner corrects: see `.cursor/prompts/live-seat-00-index.md` (six questions).

## Decision

1. **Default seat is live.** After post-auth Complete, dedicated tenant/workspace/project scope from the session JWT replaces silent demo scope unless the user chose Training.
2. **First-session chooser.** Unset `firstSessionPurpose` shows **Start in my workspace** (primary) and **Training** (secondary). No dismiss without a choice.
3. **Server preference.** `PUT /v1/user/preferences/first-session-purpose` stores `live` | `training` once per user. Returning logins skip the chooser.
4. **Training path.** `training` enables Guided mode and `visitSampleWorkspaceScope()`; **NOT LIVE DATA** honesty stays on sample scope.
5. **Exit Training.** Return to dedicated workspace and persist `live` purpose.

Does not rewrite ADR 0086, 0091, 0094, or 0097. No host `AgentExecution:Mode` flip (G-REAL-06).

## Trade-offs

**Gains:** Signed-in Record users see their tenant data immediately; procurement screenshots cannot imply demo is the default seat; Training is an informed opt-in; invite/bootstrap JWT scope aligns with proxy headers.

**Sacrifices:** One extra modal on true first login; grandfather PUT for existing personalized seats; additional preference surface to test; remote bootstrap still required when JWT scope is incomplete.

## Constraints

- Tenant isolation unchanged (ADR 0037). Sample scope must never be mistaken for the operator's tenant in copy or default headers.
- Do not hide **NOT LIVE DATA** on sample workspaces.
- Do not add Training as a third Record/Practice segment.

## Expected impact

- **Security:** Reduces risk of operators acting on demo data believing it is their tenant; scope headers prefer dedicated/JWT scope over sticky demo localStorage for signed-in users without an active sample visit.
- **Scalability / reliability / cost:** One UserSettings row per user; chooser runs once; bootstrap reuses existing `operator-scope-bootstrap` remote resolution.
- **Reliability:** Post-auth redirect applies JWT scope before navigation; bootstrap host still backfills from API when storage was demo.

## Consequences

- UI: `FirstSessionPurposeChooserHost`, copy module `first-session-purpose-copy.ts`, OpenAPI preference fields.
- Ops: No new infrastructure; preference stored in existing `dbo.UserSettings`.
- **Training is not Practice (LS-020):** first-session **Training** is Guided scope plus an explicit sample visit. **Practice** remains the Working review-type door (`rehearsal`). Do not add Training as a third Record/Practice segment or `training` door token on `WorkingCareerRehearsalChooser`.
- **Default workspace waiting (LS-009):** tenant provisioning creates a live default workspace and project; invitations bind to that workspace (or the admin’s current workspace). Missing invitation workspace ids resolve to the tenant default — never Customer Intake Demo.
- **Host demo seed ≠ customer create (LS-022):** `DemoSeedStartupHostedService` and eval hosts may seed Contoso-style demo data; post-auth `IncludeDemoSeed` stays default **false** for customer workspaces. Training sample scope is explicit, not create-time seeding.
