# WA-09 — Compare shows asserted vs inferred delta (R12 leftover)

**Do not fork RS-08** for prefilling Compare from the open review. This file is **what the diff shows**: Compare already emits Assumptions / Warnings / Decisions sections; Working chrome must treat **asserted vs inferred / skipped MUST** as first-class, not an appendix the architect can miss in a meeting.

## Goal

Working-mode Compare two reviews (when both sides are committed packages) hoists an assumption/provenance delta: what each side asserted, inferred, or skipped. Reuse Compare’s existing Assumptions-delta — do not build a draft-diff engine. In-flight / uncommitted sides stay incomparable (R12 gate).

## Why

R12: branches may differ in what was inferred; Assumptions-delta is the envelope. If livelihoods depend on the trade-off, a cost/finding delta without provenance is a lying chart. Casual tools show “what changed.” A professional needs “what we assumed.”

## Context

- Compare UI under `/insights/compare-two-reviews`
- `AuthorityCompareService` / comparison DTO — prefer existing Assumptions section
- `TransparencyTrailPanel` — compact reuse
- `buildCompareTwoReviewsHref` — keep base prefill
- Debate R12 in `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md`

## What to build

1. When both manifests have trails, Working Compare puts asserted/inferred/skipped in the first viewport (or a dedicated band above cost/findings). Guided may keep it below.
2. If a side has no trail (legacy), say so — do not invent MUST rows (LD-04 missing-trail rule).
3. Do not enable Compare on drafts or in-flight analysis (existing gate).
4. Vitest: fixture with different skipped-MUST counts renders the provenance band; no new compare API if the DTO already has Assumptions.

## Acceptance criteria

- A Working architect comparing two sealed packages sees assumption divergence without opening an appendix.
- Uncommitted packages still cannot compare.
- Desktop tabs unchanged.

## Constraints

- Do not implement a mutable-draft diff engine (R12 rejected alternative).
- Do not change `typed-engine-protected`.
- Do not add a billable branch runner in this prompt (WA-20 owns what-if entry).
