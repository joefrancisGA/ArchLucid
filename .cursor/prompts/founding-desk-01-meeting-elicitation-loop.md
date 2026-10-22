# FD-01 — Meeting elicitation is yes / no / another question, not a layout

**Do not fork PT-15** for `ReviewPresenterSurface`, `?presenter=1`, or quiet toasts (WA-21). **Do not fork WD-07** for the original meeting prompt. This file is the leftover: `presenterFindingActions` is declared and **never passed**. Presenter shows a title and body. The R4 mediator loop is missing.

## Goal

Working presenter (`presenter=1`) on an open draft or review shows **one current MUST/SHOULD question** (or “ready to finalize” + skipped MUST list), three actions — confirm / reject / ask another — and a compact asserted vs inferred vs skipped trail. Reuse existing intake APIs. Do not invent a chat. Do not reuse `BuyerCtoDemoTourOverlay`.

## Why

Debate R4: ArchLucid on a projector; a business analyst mediating *“ArchLucid wants to know if a three-second response time is OK. Yes, no, or another question?”* What shipped is an eight-tab SPA plus a presenter **layout**. Livelihood use in the room needs a question, three answers, and a visible trail.

## Context

- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R11 / R13
- `archlucid-ui/src/components/reviews/ReviewPresenterSurface.tsx`
- `archlucid-ui/src/components/reviews/ReviewDetailWorkspace.tsx` — `presenterFindingActions` optional, no call sites
- Draft Socratic / clarification components (grep `SocraticIntake`, MUST/SHOULD)
- `TransparencyTrailPanel`
- `session-idle-timeout.ts` — keep 4h Working ceiling

## What to build

1. One entry only: existing `presenter=1`. Do not add `?view=meeting`.
2. Wire `presenterFindingActions` (or equivalent) to three labeled buttons that call **existing** intake confirm/reject/next-question handlers. If no live question, show skipped MUST + “ready to finalize” — not an empty hero.
3. Compact trail on the same viewport (asserted / inferred / skipped). Architecture name + business outcome only — no COGS, sample CTAs, or CTO tour.
4. Hide teaching strips and demo overlay in presenter. Desktop tabs remain in the non-presenter Working strip.
5. Vitest: Working can enter presenter and see three actions or an honest empty; Guided unchanged; `BuyerCtoDemoTourOverlay` not mounted; only one query flag.

## Acceptance criteria

- A mediator can run yes/no/another-question without the eight-tab strip dominating the first viewport.
- Demo “hand the keyboard” overlay is not shown.
- Trail remains visible; skipped MUST is visible if present.

## Constraints

- Do not implement **M-44**.
- Do not use bare `E` as a global shortcut (demo tour; WCAG 2.1.4).
- Do not collapse the default Working tab strip behind More when *not* in presenter.
