# RS-01 — Quiet engines recover on this document, not in the wizard

**Do not fork LI-01, WD-03, or LD-03.** LD-03 owns quiet-engine honesty on **queues and packets**. Review-detail already hoists `ActorDependentFindingsQuietEnginesHint`. This file is the leftover: **the recovery CTA still opens guided intake**.

## Goal

When actor-dependent engines did not run because the graph has no Actor nodes, Working-mode recovery stays on **this architecture / this review**. The hint must not send a repeat professional to `/architecture/reviews/new` guided intake. Copy stays honest: engines did not run, not “no issues found.”

## Why

A daily driver who forgot actors should stay in the same document. Routing them into a first-run wizard is evaluator design and breaks livelihood continuity (the open package, the selected finding, the in-flight analysis). Current copy:

`ACTOR_DEPENDENT_FINDINGS_QUIET_ENGINES_COPY` tells them to “Add people and systems in guided intake” and links `REVIEWS_NEW_GUIDED_INTAKE_HREF`.

The architecture tab and the draft editor are already the place actors live. The hint must deep-link there (Working: architecture tab on this review, or the linked draft if still editable; Guided may keep a teaching path).

## Context

- `archlucid-ui/src/components/findings/ActorDependentFindingsQuietEnginesHint.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFindingsWorkspace.tsx`
- `archlucid-ui/src/lib/reviews-new-path-copy.ts` — `REVIEWS_NEW_GUIDED_INTAKE_HREF`
- Review-detail tab ids in `review-detail-workspace-tabs.ts` (Architecture)
- Draft routes: `ARCHITECTURES_LIST_PATH` / `/architecture/architectures/[id]`
- LI-01 owns honesty/placement — do not move the hint back below the simulator notice

## What to build

1. Working: replace the guided-intake link with a same-package control — “Add people and systems on Architecture” (tab deep-link `?reviewTab=` **default landing only**, not tab visibility/order) and, when a linked draft still exists and is not handoff-locked, a secondary “Open draft actors.”
2. Copy: engines did not run because there are no Actor nodes. Do not say “clean.” Do not say the only fix is guided intake.
3. Guided: may keep a teaching link to guided intake **in addition to** the Architecture tab link — not instead of it.
4. Do not start a new review from this hint.
5. Vitest: Working hint has no `REVIEWS_NEW_GUIDED_INTAKE_HREF`; Architecture deep-link present; Guided may still mention guided intake.

## Acceptance criteria

- Working findings toolbar hint does not navigate to `/architecture/reviews/new`.
- A Working user can add actors without leaving the open package’s lifecycle (Architecture tab or linked draft).
- Zero-actor complete analysis still cannot read as an all-clear (LI-01 placement stays).
- Desktop review tabs stay fully visible in stable order.

## Constraints

- Do not collapse tabs to “make actors easier.”
- Do not change `typed-engine-protected`.
- Do not invent a 40th coverage engine.
- Do not delete guided intake; demote it from this recovery path in Working.
