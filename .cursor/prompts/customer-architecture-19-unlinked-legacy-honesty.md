# CA-19 — Unlinked legacy honesty

**Do not** invent identities in the UI. **Do not** hide orphan drafts/reviews. CA-18 may have left legitimate orphans (failed FK, incomplete backfill).

## Goal

Working surfaces that list drafts or reviews **without** an `ArchitectureId` must say so.

1. One sentence, sentence case: this draft/review is **not yet on an architecture**. Offer **Link to architecture** only if CA-09/10 exist and you can call ensure (same conservative rules — one identity per orphan draft, no name merge).
2. Architecture desk empty because backfill was not run: honesty on the hub, not a sample hero (CA-35).
3. Do not claim the portfolio is complete when orphans exist — count them (CA-39 pattern).

## Why

A desk that silently omits last year’s reviews is a career defect. Casual empty states hide gaps. Livelihood desks name them.

## Context

- Reviews hub / draft list clients
- CA-18 leftover rows
- `ArchitectureObjectMapStrip`

## What to build

1. Copy module + strip/banner on Working list rows missing `architectureId`.
2. Vitest: fixture without FK shows the line; fixture with FK does not.
3. Guided may keep teaching copy; must not claim the orphan **is** the durable architecture.

## Acceptance criteria

- Working cannot look like every review is filed under a named architecture when orphans remain.
- No auto-merge control.

## Constraints

- No sample recovery href on live Working (PT-02 / CD-02).
- TB-645 vocabulary.
