# CA-50 — Acceptance audit (residual DraftId-as-architecture)

**Do not add features.** This is the **wave close**. Run after CA-01–49 (or skip rows that were skipped).

## Goal

Prove the customer object is real enough to stop the next overlay wave from treating drafts as architectures.

1. Grep operator UI + Application (not docs/archive, not generated OpenAPI noise):
   - `architectureId = created.draftId`
   - `getDraftRequest(architectureId)`
   - `ArchitectureDraftWorkspace architectureId=`
   - Working hub still mounting `ArchitectureDraftListClient` unconditionally
2. Manual checklist in the PR (not a new assessment scorecard):
   - ADR 0074 exists
   - DisplayName + draft FK exist
   - GET list/get work scoped
   - Working hub lists identities
   - `{architectureId}` desk ≠ draft editor
   - Spawn copies ArchitectureId
   - Showing N of M on Working lists
   - Career ADR cannot silent-cap
3. Fix **only** leftovers that are one-line lies (wrong prop name, wrong hub mount). Larger gaps become a named follow-up — do not start wave 15 inside this file.

## Why

Thirteen overlay waves failed because nobody audited the object. This prompt is the ratchet.

## Context

- This index’s already-shipped table
- CA-22 / CA-23 / CA-25 / CA-48
- `docs/architecture/CUSTOMER_ARCHITECTURE_COMPOSER_PROMPTS.md`

## What to build

1. PR comment / short `docs/architecture/CUSTOMER_ARCHITECTURE_ACCEPTANCE_2026-09-05.md` **only if** you need a durable residual list — prefer the PR body if residuals are zero.
2. Grep evidence pasted in the PR.
3. Focused Vitest already added by prior CA files — re-run those files, do not invent a full suite.

## Acceptance criteria

- `ArchitectureId` is distinct from `DraftId` in Working create/list/open paths.
- Guided/demo/trial still work.
- Residual list (if any) names the owning CA file, not a new prompt set.

## Constraints

- Do not paste DA/LK/IS.
- Do not implement BFF, engines, or GTM cohorts.
- Do not collapse review tabs.
- Working-tree safety on every tracked edit.
