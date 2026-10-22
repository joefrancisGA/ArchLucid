# IS-02 — Working Home, nav, and palette: one primary, two capabilities

**Do not fork CD-03, WA-02, or WD-10.** Those kept ADR 0067 or only emphasized by state. This file **implements ADR 0069** on Working chrome. Run **IS-01** first (or in the same PR).

## Goal

Working Home, architecture-group nav, hub headers, empty states, and the command palette present **one primary** derived from workspace state. Drafts and packages remain reachable as **capabilities**, not as two start products. Guided / buyer-eval keep ADR 0067 peer CTAs. No `Step 1` / `One lifecycle` ranking copy.

## Why

Livelihood failure: a paying architect opens the desk and is asked to pick Create architecture vs Start review. Muscle memory dies. Casual tools put a chooser on first run; professional tools resume work.

## Context

- ADR 0069 from IS-01
- `archlucid-ui/src/lib/buyer/create-review-peer-parity.test.tsx`
- `archlucid-ui/src/components/operator-home/OperatorHomeDualPathCards.tsx`
- `archlucid-ui/src/lib/buyer/buyer-polish-copy.ts` Home cards
- `archlucid-ui/src/lib/pilot-nav-group-builder.ts` and Working nav builders
- `archlucid-ui/src/lib/command-palette-actions.ts` / `resolve-visible-command-palette-actions.ts`
- `WORKING_NEW_REVIEW_LABEL`
- `operator-primary-cta-inventory.ts`

## What to build

1. Working Home: one primary CTA — resume last-open package or draft if present, else new work (`WORKING_NEW_REVIEW_LABEL` → draft editor). Secondary text links: **Drafts**, **Packages**. Do not render two equal filled buttons that name two products.
2. Working sidebar Architecture group: one start item (same href as Alt+N). Drafts list and Reviews list remain in the group as nouns, not a second Start.
3. Palette: one “New work” / resume row in Working; do not list Create architecture and Start review as siblings. Guided unchanged.
4. Split peer-parity tests: Guided asserts co-equal CTAs and bans ordinal funnel. Working asserts one primary from state and still bans calling a draft a sealed record.
5. Vitest: Working with drafts → resume primary; empty Working → new work into draft editor; Guided fixture still has peer CTAs without Step 1.

## Acceptance criteria

- A Working screenshot of Home cannot be read as two start products.
- Guided first-run still has two jobs of equal standing.
- `moreTabIds` on review-detail stays empty (do not “simplify” by hiding tabs).
- No customer-visible run/job/manifest regression (TB-645).

## Constraints

- Do not rewrite ADR 0067.
- Do not hide drafts forever — IS-14 still promotes the drafts list; this prompt only removes *peer start*.
- Do not implement GTM cohorts.
