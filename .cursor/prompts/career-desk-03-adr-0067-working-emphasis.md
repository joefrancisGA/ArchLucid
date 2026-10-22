# CD-03 — ADR 0067 stays; Working uses workspace-state emphasis

**Do not fork WA-02** for palette/nav one start. **Do not rewrite ADR 0067.** Create architecture and Review remain co-equal *jobs* with unequal artifacts (draft ≠ sealed record). This file is the leftover **guard**: `create-review-peer-parity.test.tsx` and Home buyer copy still force two product-preference peer CTAs on surfaces a Working seat sees.

## Goal

Guided / buyer-eval surfaces keep ADR 0067 co-equal entry points (no Step 1/Step 2, equal weight when both appear). Working surfaces use ADR 0067 **§6**: emphasis from workspace state (drafts exist → resume; no packages → `WORKING_NEW_REVIEW_LABEL`; open package → continue that package). Hard-coded preference for either path as a *product* remains illegal. Do not demote Create architecture to a subordinate of Review on Guided.

## Why

ADR 0067 rejected “single Start review, draft is Resume” as a *product* ranking. The livelihood diagnosis rejected two *start products* on the paying desk. Those are compatible: §6 already licenses state-based emphasis. The leftover is tests and Home chrome that treat co-equal CTAs as mandatory on Working.

## Context

- `docs/architecture/adrs/0067-create-architecture-and-review-co-equal-entry-points.md` — keep Accepted; §6 is the Working hook
- `archlucid-ui/src/lib/buyer/create-review-peer-parity.test.tsx`
- `archlucid-ui/src/lib/buyer/buyer-polish-copy.ts` Home cards
- `WORKING_NEW_REVIEW_LABEL`
- `operator-primary-cta-inventory.ts` — TB-1539 single-primary-per-hub unchanged

## What to build

1. Split peer-parity tests: Guided/buyer still assert co-equal CTAs and ban ordinal funnel. Working asserts workspace-state emphasis (one primary from state), still bans `Step 1` / `One lifecycle` ranking, still forbids calling a draft a sealed record.
2. Working Home / hub headers: do not render two equal “pick a product” cards when workspace state already implies the next object. Keep both *jobs* reachable (drafts list + packages list), not two competing primaries on one hub.
3. Add a short comment on the ADR or a Working chrome note in the test file pointing at §6 — do not change ADR status or decision points 1–5.
4. Vitest: Working fixture with drafts emphasizes resume; empty Working tenant emphasizes New review; Guided fixture still has peer CTAs without Step 1.

## Acceptance criteria

- ADR 0067 is not rewritten or marked superseded.
- Working cannot screenshot two peer start products as the identity of the desk.
- Guided first-run still has two jobs of equal standing.
- Artifacts remain unequal in copy.

## Constraints

- Do not introduce `Step 1` / `Step 2` / `One lifecycle` buyer copy.
- Do not collapse desktop review tabs.
- Do not implement **M-44**.
