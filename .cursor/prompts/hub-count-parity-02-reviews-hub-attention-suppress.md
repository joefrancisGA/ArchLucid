# HCP-02 — Suppress attention chips the Reviews hub already surfaces

**Do not fork HOM `#1493` or re-theme `OperatorAttentionKindStrip`.** Home already passes `suppressKinds` when Your work is composed. This file is the leftover on **`/architecture/reviews`**: `RunsPageView` renders a compact attention strip with **no** `suppressKinds`, so Unfinished work (and sometimes Awaiting approval) restates the Continue strip and inventory.

## Goal

On Reviews hub, attention chips omit kinds already visible as a **primary zone on the same page**. Unfinished work is omitted when `ReviewsHubContinueReviewStrip` or the in-flight inventory filter already carries that queue. Do not drop Assigned to me or Alerts unless those queues are also a first-viewport zone on this route (they are not today).

## Why

Home removed helper text that restated chips and suppressed unfinished-work when the rail was present. The hub still shows four chips next to “Continue this review” naming the same packages. Duplicate counts train the architect to ignore both.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/RunsPageView.tsx` — `<OperatorAttentionKindStrip variant="compact" />` inside `reviews-hub-guidance` (no `suppressKinds`)
- `archlucid-ui/src/components/operator/OperatorAttentionKindStrip.tsx` — already supports `suppressKinds`
- `archlucid-ui/src/lib/operator/operator-attention-taxonomy.ts` — kinds: `unfinished-work`, `assigned-to-me`, `alerts`, `awaiting-approval`
- `archlucid-ui/src/app/(operator)/_sections/OperatorHomePageView.tsx` — Home call site to copy the **suppress rule**, not the layout
- `archlucid-ui/src/lib/compose-operator-home-sections.ts` — Home decides suppress from composed sections; hub should decide from continue-strip / inventory presence
- Run **HCP-01** first if both are in flight so “continue zone visible” is a stable signal

## What to build

1. When the hub renders `ReviewsHubContinueReviewStrip` **or** the inventory is showing in-progress packages as the primary list, pass `suppressKinds={["unfinished-work"]}`.
2. If the summary row / inventory already deep-links awaiting-approval (`REVIEWS_HUB_SUMMARY_AWAITING_APPROVAL_HREF` / ready-for-governance), also suppress `awaiting-approval`. If that count is **only** on the chip, keep the chip.
3. Keep compact variant. Do not re-add the “Needs-you queues” helper paragraph (removed on Home in `#1549`).
4. Vitest:
   - Hub with an in-flight continue candidate: no `operator-attention-kind-chip-unfinished-work`.
   - Hub with no continue candidate and no in-progress rows: unfinished-work chip may remain.
   - Assigned-to-me and Alerts chips still render when their counts are non-zero (unless you can prove they are duplicated in the first viewport — they should not be suppressed by default).
   - Home suppress tests still pass.

## Acceptance criteria

- Reviews hub first viewport + guidance strip cannot show Unfinished work as both a Continue primary and a chip for the same packages.
- Compact chip row remains for kinds the hub does **not** already own.
- No new attention taxonomy kinds.

## Constraints

- Do not hide the whole `OperatorAttentionKindStrip` — suppress by kind.
- Do not change nav badges or Home composition.
- Do not collapse review-detail tabs.
- Do not restyle chips away from `buyerFilterChipClass` / `AttentionLinkChip`.
