# PT-03 — Expert start path: dense editor, not a first-run funnel

## Goal

Returning and **Working**-mode architects start work in a dense draft/review editor. First-run wizard theater, collapsed “one primary CTA,” and sample-first home cards stay on **Guided** only.

## Why

Foundational design (R13) says the seatholder is a qualified SME; Socratic intake absorbs a *naive requester through that expert*. Shipped first-run still walks the expert through a linear wizard and demotes advanced modes (`TB-2130`, `CANONICAL_FIRST_RUN_PATH.md`). Home still forks “create an architecture” vs “review an existing architecture” as peer objects that both become a run. A professional bringing a real brief should not re-learn the product every Monday.

## Context

- `docs/library/CANONICAL_FIRST_RUN_PATH.md` — first-run vs expert 15-minute lane (do **not** run GTM **M-44** cohort work)
- `archlucid-ui` create-architecture bootstrap (`/architecture/architectures/new`) and draft workspace (`/architecture/architectures/[id]`)
- First-run primary CTA composition (`HomeFirstRunWorkflowGate`, operator home CTA helpers)
- `TB-2130` / `TB-1462` resume-first when drafts exist
- `docs/architecture/information_architecture_assessment_and_backlog.md` dual-path home cards

## What to build

1. **Working mode**
   - Home primary action is **resume last draft or last review**, else **New review** into the draft editor — not the first-review guide.
   - `/architecture/reviews/new` and `/architecture/architectures/new` skip the “pick a path / collapse advanced modes” theater. Advanced intake (guided questions, templates) is reachable as peer tabs or a disclosure, not hidden as lesser.
   - If drafts exist, resume-first already required by TB-1462 must hold in Working without a “Start new” hero competing.
2. **Guided mode** keeps today’s single primary first-run CTA and teaching copy.
3. Stop treating create-architecture and start-review as two products on Working Overview: one lifecycle, one primary CTA, drafts listed as resumable work.
4. Do not deep-link Working users at “Explore sample review” as a header secondary when they have live workspace data (sample remains in Guided / empty-eval).
5. Vitest for home CTA composition, create bootstrap resume-first, and Working vs Guided forks.

## Acceptance criteria

- Working user with a draft: first viewport is resume, not “Start first review.”
- Working user with no drafts: New review opens the dense editor; wizard path-switcher is not the only way in.
- Guided first-session behavior remains intact for evaluators.
- No new dual-object story on Overview.

## Constraints

- Do not implement principal-architect dismissal cohort (**M-44**).
- Do not delete guided intake; demote it for Working, do not remove it.
- Saving a draft must still never start a review.
