# LK-04 — Spawn-locked draft URL is a handoff, not a second desk

**Do not fork RS-04** (spawn lock rule). **Do not fork IS-03** (`resolveWorkingStartHref`). **Do not merge** `DraftRequests` and `Runs`. **Do not fork SD-10** if `ArchitectureDraftHandoffPanel` already replaces the Working editor — then this prompt only closes residuals (enabled fields, Start review CTA, autosave still on). This file is the **product of ADR 0072**.

## Goal

When `linkedReviewId !== null` (handoffEditorLocked), Working draft detail is not an editable architecture desk: read-only handoff of what was submitted, in-flight or sealed status of the child review, primary **Open review** to the linked run, secondary clone-from-snapshot if WA-10 exists. Deep links bookmarking the draft after spawn must not look like “keep designing here.”

If ADR 0072 chose a `/architecture/work/{id}` resolver, implement it here and keep old draft URLs working as redirects/handoffs.

## Why

One chrome primary fails if Start goes to the review and yesterday’s draft URL is still a form. Two live instruments after spawn is how people edit the wrong object.

## Context

- ADR 0072 (LK-03)
- `use-architecture-draft-workspace.ts` `handoffEditorLocked = linkedReviewId !== null`
- `ArchitectureDraftWorkspaceBody.tsx` — form `disabled={editorLocked}` is not enough if the form is still the layout
- `ArchitectureDraftHandoffPanel.tsx` / `ArchitectureDraftHandoffBanner.tsx`
- `architecture-draft-handoff-gate.ts`
- `working-start-route.ts`
- Autosave `enabled: false` on lock — do not regress

## What to build

1. Working + spawn-locked: handoff layout, not a disabled clone of the editor. Primary button Open review (`CTA_WIDTH.content`). No Start review. No enabled architecture fields.
2. Guided may keep the disabled form.
3. Vitest: Working spawn-locked fixture has no enabled architecture fields; Open review href is the linked run; Guided fixture may still show the form disabled.
4. If a new work resolver route is in 0072, add it plus redirects; update palette/help only if SD-11 leftovers would list a hidden destination — prefer not to fork SD-11.

## Acceptance criteria

- A Working user who opens the old draft URL after Start review lands on a handoff, not a live form.
- Clone/new-version remains the legal mutation after lock.
- Desktop review tabs unchanged.

## Constraints

- Do not unlock spawn with localStorage “edit anyway.”
- Do not delete the draft row.
- Do not implement a draft-diff engine.
