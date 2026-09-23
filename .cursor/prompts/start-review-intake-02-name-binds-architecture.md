# SRI-02 — The architecture name is required, and the review stays parented

**Wave:** start-review-intake (**SRI**). **Depends on:** SRI-01.

Follow [`.cursor/prompts/start-review-intake-00-index.md`](start-review-intake-00-index.md) global constraints.

## Goal

On the empty-workspace guided-questions first screen, **System Name** is required. Continuing creates or binds a named architecture with the existing draft APIs and `START_REVIEW_INTENT`. The later review submit includes that architecture id. A review with an empty architecture id cannot be started.

## Why

AO-22 exists so a review is not a second product with no parent. The empty picker enforced that by blocking. The name field is the same rule, collected where the person is already describing the system. Today the non-create path renders System Name with `required={false}` (`SocraticIntakeWizardStepScope`).

## Context

- `SocraticIntakeWizardStepScope.tsx` — System Name is required only when `isCreateArchitectureFlow` is true. The start-review branch marks it optional.
- Label constant: `GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL` ("System Name"). Keep it.
- Draft create already exists: `use-guided-intake-draft-create.ts`, `createDraftRequest`, `initializeArchitectureCreation`, `START_REVIEW_INTENT` in `architecture-workflow-intent.ts`.
- Create architecture (`CREATE_ARCHITECTURE_INTENT`, `/architecture/architectures/new`) stays a separate flow. Do not send empty-workspace Start review to that route.
- Nested start (`sourceArchitectureId` in the query or `/architecture/architectures/{id}/reviews/new`) already loads the parent. Do not require a second name, and do not create a second architecture.

## What to build

1. Empty-workspace Start review (no `sourceArchitectureId`): System Name is required. Continue stays disabled until the name passes the existing workspace availability check and whatever minimum the creation flow already enforces. Show the failure on the field. Do not toast it (**TB-2005**).

2. On continue, persist the name through the existing draft create / patch path with `workflowIntent: START_REVIEW_INTENT`. Store the resulting architecture id and send it on review submit. Reuse the submit payload field the nested start already sends. Do not add a table, a new intent value, or a second create API.

3. Nested start and a picker row that already chose an architecture: name is prefilled and not a second required create. Submit still includes that architecture id.

4. Tests:
   - Empty-workspace first screen: continue disabled while System Name is empty or conflicting; enabled when the name is available.
   - Submit (or the draft patch that precedes it) includes a non-empty architecture id and `START_REVIEW_INTENT`.
   - Nested start does not call architecture create again.
   - Create-architecture route still uses `CREATE_ARCHITECTURE_INTENT`.

## Acceptance criteria

- Empty workspace: the person types the system name on the first screen, then continues into clarifications.
- No code path in this wave starts a review when the architecture id is blank.

## Constraints

- **Do not** merge `DraftRequests` and `Runs`.
- **Do not** make System Name optional again on this empty-workspace screen.
- **Do not** block continue on a missing upload. Upload is SRI-03 and stays optional.

## Done when

The first screen collects a required system name, the draft is that architecture, and review submit is parented to it.
