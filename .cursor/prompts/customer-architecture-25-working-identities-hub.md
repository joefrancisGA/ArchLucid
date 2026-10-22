# CA-25 — Working identities hub

**Do not fork IS-02** (Working Home one primary). **Do not** present the drafts list as the architecture portfolio on Working. CA-11 list API must exist.

## Goal

`/architecture/architectures` on an authenticated **Working** seat lists **identities** (`DisplayName`, updated, child counts), not `ArchitectureDraftListClient` relabeled.

1. Replace or gate `ArchitectureDraftListClient` behind Guided.
2. Working table: EnterpriseTable, sentence case, link to identity desk (CA-20).
3. Secondary **Drafts** filter/link is allowed; it must say **drafts**, not architectures.
4. `ArchitectureObjectMapStrip focus="draft"` must not remain the Working default — focus architecture or drop on Working.

## Why

The hub page title already says Architectures while the body lists drafts. That is the object-model lie.

## Context

- `archlucid-ui/src/app/(operator)/architecture/architectures/page.tsx`
- `ARCHITECTURES_HUB_PAGE_TITLE` / `architectures-hub-copy.ts`
- `ArchitectureDraftListClient.tsx`
- CA-07 / CA-11

## What to build

1. Working list client + copy module.
2. Vitest: two reviews of one system → **one** row; Guided fixture may still list drafts.
3. Do not add Home dual-start CTAs (IS-02).

## Acceptance criteria

- Working user with two reviews of one system sees one architecture row.
- Opening a row goes to the identity desk, not the draft wizard.

## Constraints

- No `max-w-prose` marketing column as the hub.
- No sample rows on live Working (CA-35).
