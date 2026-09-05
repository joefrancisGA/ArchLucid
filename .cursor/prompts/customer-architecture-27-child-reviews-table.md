# CA-27 — Child reviews table on the architecture desk

**Do not** build a second reviews product. **Do not collapse review tabs.** CA-26 chrome + CA-08 children must exist.

## Goal

Desk shows this architecture’s reviews:

1. Status, sealed or in-flight, updated, href to review detail (ADR 0072 owns that URL).
2. Showing N of M if paged (CA-39 helper if already shipped; otherwise a local count line).
3. Empty: “No reviews yet” + **Start review** child action — not sample reviews.

## Why

Two people can name the same system and see every sealed record against it. That is the livelihood primitive.

## Context

- Reviews hub `EnterpriseTable` patterns
- CA-08 child summaries
- `reviewDetailPath`

## What to build

1. Table section + Vitest: only rows with this `ArchitectureId`.
2. Do not include other systems’ reviews when the API is wrong — test the filter.

## Acceptance criteria

- A Working user with two reviews of one system sees two child rows on **one** desk.
- Clicking a row opens review detail, not a new wizard.

## Constraints

- No N-way compare (CA-30 is two-sided).
- No More menu on review tabs.
