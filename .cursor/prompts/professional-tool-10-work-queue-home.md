# PT-10 — Overview is a work queue, not a first-run landing

## Goal

Working-mode **Overview (`/`)** is a desk: resume work, needs-attention, drafts, last reviews. First-run panels, sample-package shortcut cards, and “Start first review” heroes stay on **Guided** / empty-eval only.

## Why

`HomeFirstRunWorkflowGate` still decides chrome from `isBuyerPolishedOperatorShellEnv()` (always true) and `useArchitectWorkspaceChrome()`. On buyer-polished it **returns null** (hiding the first-run panel) but the main column can still elevate sample-review cards. `SamplePackageShortcutsCard` renders on the curated rail when full-shell chrome is off. Command palette still offers **Finish workspace setup**. A daily user should see their queue, not a second product launch every Monday. Working-mode nav already skips first-session hide (`useOperatorShellNavRows`) — do not re-open that. This prompt is the **home canvas**.

## Context

- `archlucid-ui/src/components/HomeFirstRunWorkflowGate.tsx`
- `archlucid-ui/src/components/operator/OperatorFirstRunWorkflowPanel.tsx`
- `archlucid-ui/src/components/operator-home/SamplePackageShortcutsCard.tsx`
- Operator home page under `archlucid-ui/src/app/(operator)/page.tsx` and home section components
- `archlucid-ui/src/lib/command-palette-actions.ts` — `action-finish-setup`
- `docs/architecture/information_architecture_assessment_and_backlog.md` dual-path home cards
- PT-03 (expert start) owns Alt+N / create path. This prompt owns Overview composition. Coordinate if both run; do not fight over the same CTA helper.

## What to build

1. Working + live tenant:
   - Primary column: work queue (resume draft, last review, needs-attention / assigned findings if those tiles already exist).
   - Do not render `SamplePackageShortcutsCard` or “Explore sample review” when the workspace has any live draft or review.
   - Do not render `OperatorFirstRunWorkflowPanel` except as a dismissible empty-state when there is **no** draft and **no** review.
2. Guided / demo / trial: keep today’s first-run panel and labeled sample cards.
3. Command palette in Working: omit or demote `action-finish-setup` below work actions (PT-06 may already do this — share the same visibility helper).
4. One lifecycle language: do not show peer heroes “Create an architecture” vs “Review an existing architecture” as two products. Drafts are resumable work; reviews are packages.
5. Vitest for Working vs Guided home composition (empty workspace, workspace with draft, workspace with sealed review, demo flags on).

## Acceptance criteria

- Working user with a draft or review: first viewport is the queue / resume, not sample Claims Intake and not “Start first review.”
- Working empty workspace: one New review CTA into the expert start path (PT-03), plus optional dismissible Guided offer — not a sample rail.
- Guided and demo still show teaching / sample as today.
- Unauthorized or capability-gated tiles stay hidden.

## Constraints

- Do not implement GTM first-session observation cohorts (**M-90**).
- Do not hide desktop review workspace tabs as part of “simplifying” home.
- Do not use nav visibility as a substitute for API authorization.
- Sample remains available from Guided Overview and marketing `/why`, labeled sample.
