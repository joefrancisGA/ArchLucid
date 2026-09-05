# RS-15 — Working empty presets do not hero a sample review

**Do not fork LD-06 or LI-06.** LD-06 owns Overview dual-path / first-review guide. Home Working primary CTA already exists (`OperatorHomeWorkingPrimaryCta`). This file is the leftover: **shared operator empty presets still offer “See a completed sample review”** on hubs a Working user hits with no data.

## Goal

Empty states on Working-mode **operator hubs** (reviews list, evidence graph empty, compare idle, deliverables, etc.) do not use sample/marketing CTAs (`/see-it`, Claims Intake, “See a completed sample review”) as a peer of starting real work. Guided and demo may keep sample actions. Working empty is New review / open drafts / retry — a desk, not a tour.

## Why

LD-06 closes Overview theater. Presets in `enterprise-compact-empty-state-presets-reviews.ts` still include actions like `{ label: "See a completed sample review", href: "/see-it" }` next to Start a review. Those presets mount on multiple hubs. A Working architect with an empty tenant should not be trained that the product is the sample.

## Context

- `archlucid-ui/src/lib/enterprise-compact-empty-state-presets-reviews.ts`
- `archlucid-ui/src/lib/operator/operator-empty-state-kind-presets.ts`
- Grep `See a completed sample review`, `/see-it`, `BUYER_EVIDENCE_TRAIL_SAMPLE_BUTTON` on operator (not marketing) surfaces
- `isLiveOperatorShellRecoveryContext` / Working mode — reuse; do not fork LD-02 (live *errors*)
- `OperatorHomeWorkingPrimaryCta.tsx` — do not regress

## What to build

1. Split preset **actions** by desk vs eval: Working/live omits sample hrefs; Guided/demo keep them.
2. Prefer a small helper `emptyStateActionsForDesk({ workingMode, liveRecovery })` over duplicating every preset object.
3. Do not change marketing `/see-it` or demo showcase pages.
4. Vitest: Working+live reviews-empty (or graph-empty) fixture has no `/see-it` / Claims Intake sample button; Guided empty may still.

## Acceptance criteria

- Working user with no reviews does not get “see a completed sample” as a hub empty primary/peer on operator presets.
- Guided/demo sample path remains.
- Overview Working CTA still goes to the dense editor (LD-06 — do not regress).
- Desktop never uses `ReviewWorkspaceMoreTabsMenu`.

## Constraints

- **Forbidden:** hiding review tabs behind More.
- Do not implement **M-44**.
- Do not delete the Claims Intake sample; stop offering it as Working empty chrome.
- Help links stay in-app `/help/{topic}`.
