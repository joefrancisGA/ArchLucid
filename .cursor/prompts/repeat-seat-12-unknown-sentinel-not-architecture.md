# RS-12 — Unknown placeholders must not become architecture

**Do not fork LI-01.** Server start already blocks unconfirmed structured-brief placeholders (`ArchitectureDraftReviewReadinessValidator`) and draft copy can name fields (`formatArchitectureReviewReadinessMessage`). This file is the leftover: **the projector / graph must not promote “Unknown — confirm before review” into requirement-like nodes**.

## Goal

Unconfirmed Unknown sentinels never appear as confirmed constraints, capabilities, quality attributes, or graph requirement nodes. Start review stays disabled while they exist. The draft UI names **which fields** are still Unknown (keep/extend existing copy). Do **not** change `typed-engine-protected`.

## Why

A livelihood tool that looks official while treating “Unknown” as architecture is a career event. LI-01 asked the projector not to promote the sentinel. If `UniversalIntakeAnswerProjector` still emits requirement-like graph nodes from the placeholder string, the findings desk can look populated for reasons that were never confirmed.

## Context

- `ArchLucid.Application/Drafts/ArchitectureDraftReviewReadinessValidator.cs`
- `ArchLucid.Application/Drafts/UniversalIntakeAnswerProjector.cs` (or current projector type)
- `archlucid-ui/src/lib/architecture/architecture-draft-structured-brief-state.ts` — `ARCHITECTURE_DRAFT_UNKNOWN_CONFIRM_LABEL`
- `archlucid-ui/src/lib/architecture/architecture-review-readiness-copy.ts`
- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **empty diff**

## What to build

1. Projector (and any graph-node builder from structured brief): do not create requirement/capability/QA nodes from the Unknown sentinel. Tests on the projector.
2. Draft UI: Start review disabled; readiness message names the unconfirmed field labels (already in `listUnconfirmedStructuredBriefFieldLabels` — mount it if a path still shows the generic “placeholders” sentence only).
3. Vitest + existing projector tests: a brief that is only Unknown cannot start a review and cannot emit confirmed-looking graph nodes.
4. Empty diff on `DeterministicInsightDensityGate.cs`. Scoped compile if C# projector changes.

## Acceptance criteria

- A draft with only “Unknown — confirm before review” cannot start a review; the form names the fields.
- Graph/requirements do not treat that sentinel as confirmed architecture.
- Working vs Guided: both fail closed; Guided may add teaching copy.

## Constraints

- Do not invent a 40th coverage engine.
- Do not collapse review tabs.
- Tenant isolation unchanged.
- One class per file; no `ConfigureAwait(false)` in tests.
