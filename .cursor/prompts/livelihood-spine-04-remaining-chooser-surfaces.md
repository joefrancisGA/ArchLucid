# LS-04 — Remaining Working chooser surfaces after IS-02

**Do not fork IS-01, IS-02, or CD-03.** Home dual-path cards already hide when `isWorkingMode` (`PilotCommandCenterCard.tsx`). This file is leftover **guards, Path chooser, help, and empty presets** that still force two peer start products onto a Working seat.

## Goal

Working fixtures in peer-parity / CTA inventory / empty-state tests assert **one primary from workspace state**, not Create architecture + Review as equal filled buttons. `/architecture/reviews/new` Path chooser is not the default Working start (IS-03 owns the href; this file removes chooser **mounts** and copy that re-asks the product question). Guided keeps ADR 0067 peer CTAs and may keep Path chooser.

## Why

IS-02 can fix Home and still lose to a Vitest that requires `OperatorHomeDualPathCards` on Working, or to help/empty copy that says “Create an architecture or start a review.” Muscle memory dies at the next surface.

## Context

- `archlucid-ui/src/lib/buyer/create-review-peer-parity.test.tsx`
- `operator-primary-cta-inventory.ts`
- `PathChooserCreateObjectVocabularyRail.tsx` / `architecture/reviews/new`
- `operator-home-intent.ts` / `OPERATOR_HOME_SETUP_NEXT_CHOOSE_PATH`
- `OperatorHomeDualPathCards.test.tsx` (Working vs Guided)
- `page.test.tsx` Overview dual-path assertions
- ADR 0069 (IS-01) — quote it; do not rewrite 0067

## What to build

1. Split peer-parity: Guided = two jobs, no Step 1. Working = one primary; drafts/packages as text capabilities.
2. Working must not mount Path chooser as the default body of `/reviews/new` (redirect or render the IS-03 target instead). Explicit `?path=guided-intake` remains for Guided.
3. Sweep Working empty/help strings that present two start products. Keep artifact inequality (draft ≠ sealed record).
4. Vitest: Working Overview / start route screenshot contract cannot be read as two filled product CTAs; Guided fixture still has peers.

## Acceptance criteria

- A Working empty Overview cannot be read as two start products.
- Guided first-run still has two jobs of equal standing.
- `moreTabIds` on review-detail stays empty.

## Constraints

- Do not hide drafts forever (IS-14).
- Do not auto-switch stored Guided users.
- Do not implement **M-90**.
