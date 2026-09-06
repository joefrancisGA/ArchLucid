# CA-48 — Vocabulary drift guards

**Do not change product behavior** except tests and constants that pin the old lie.

## Goal

Automated guards fail if Working copy says the architectures hub **is** the drafts list.

1. Update `review-terminology-guard.test.ts` / architectures hub tests that **require** draft inventory labels on Working.
2. Pin: Working `OPERATOR_NAV_LINK_LABELS.architectures` is not `ARCHITECTURE_DRAFTS_LIST_LABEL`.
3. Pin: `architectureDraftPath` no longer has a one-arg draft-id signature (CA-20/23).
4. Allow Guided fixtures to keep draft labels.

## Why

TB-738-style guards currently protect “Architecture packages” and draft-as-architecture naming. Without flipping them, CA-32 cannot stay merged.

## Context

- `review-terminology-guard.test.ts`
- `architectures/page.test.tsx`
- `architecture-routes.test.ts`
- CA-32 / CA-44

## What to build

1. Guard updates + any constant renames already implied by CA-32.
2. Do not rewrite TB-645 package vocabulary for **review packages** — that noun can remain for the review artifact.

## Acceptance criteria

- Working test fixture fails if hub subtitle says the page lists drafts as architectures.
- Guided tests still pass.

## Constraints

- Do not scan `docs/archive/`.
- No More menu.
