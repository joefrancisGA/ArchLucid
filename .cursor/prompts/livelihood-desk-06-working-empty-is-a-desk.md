# LD-06 — Working empty home is a desk, not first-review theater

**Do not fork LI-06, PT-03, or PT-10** for Alt+N routing, drafts-in-nav, or Overview in-flight/unfinished slots. Those shipped. This file is **empty Working still competing with first-review guide, dual-path cards, and sample rails**.

## Goal

A Working-mode architect with no drafts yet sees one primary action: **New review** into the dense draft editor. First-review guide, dual-path peer heroes, sample-first rails, and “Start first review” wizard copy stay on **Guided** (and marketing). Shortcut/palette text already say draft editor — do not regress.

## Why

Professionals resume or start work. Evaluators take a tour. LI-06 demoted dual-path for some Working phases and put drafts in nav. `PilotCommandCenterCard` still mounts dual-path on eval-empty when **not** Working; verify Working eval-empty does not still lead with Getting started / first-review guide / sample explore as the first viewport. `composeOperatorHomeSections` Working eval-empty leads in-flight/unfinished/start-something — the **content** of start-something must not be two peer objects plus a sample.

## Context

- `archlucid-ui/src/lib/compose-operator-home-sections.ts` — Working early-phase sections (keep)
- `archlucid-ui/src/components/usability/PilotCommandCenterCard.tsx`
- `archlucid-ui/src/components/operator-home/OperatorHomeDualPathCards.tsx`
- `archlucid-ui/src/app/(operator)/architecture/first-review-guide/`
- `archlucid-ui/src/lib/pilot-nav-group-builder.ts` — Getting started already hidden in Working via `hideGettingStartedFromMainNav`
- Sample reviews on Overview preference
- `WORKING_MODE_NEW_REVIEW_ROUTE` / `WORKING_ALT_N_SHORTCUT_DESCRIPTION`

## What to build

1. Working eval-empty: one primary CTA (New review → draft editor). Dual-path peer heroes only on Guided. If Guided empty, copy must say **one lifecycle, two doors**.
2. Working Overview must not auto-route or hero-link `/architecture/first-review-guide`. Palette already omits Finish setup in Working — keep it.
3. Sample explore on Working Overview only if the user opted into sample-reviews preference; label it sample. Default Working empty is not Claims Intake.
4. Do not send Working users to `/architecture/reviews/new` wizard from Home, Shift+?, or palette.
5. Vitest: Working eval-empty first viewport CTA href is the draft editor; dual-path test id absent; Guided empty may still show dual-path; sample rail absent unless preference on.

## Acceptance criteria

- Working user with no drafts: first viewport is New review / draft editor, not “Start first review” / first-review guide.
- Working user with a draft: unfinished/resume still wins (LI-06 — do not regress).
- Guided first-session behavior remains intact.
- Desktop never uses `ReviewWorkspaceMoreTabsMenu`.

## Constraints

- **Forbidden:** hiding “rare” tabs behind More.
- Do not implement principal-architect dismissal cohort (**M-44**) or first-session cohort (**M-90**).
- Do not delete guided intake; demote it for Working.
- Saving a draft must still never start a review.
