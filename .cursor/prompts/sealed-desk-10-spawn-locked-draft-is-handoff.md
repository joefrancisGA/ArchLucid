# SD-10 — Spawn-locked draft URL is a handoff, not a second desk

**Do not fork RS-04** (spawn lock rule). **Do not fork IS-03** (`resolveWorkingStartHref`). **Do not merge** `DraftRequests` and `Runs`. This file is the **route leftover**: `/architecture/architectures/[id]` after handoff still mounts `ArchitectureDraftWorkspace` (fields disabled, but it is still the editor chrome). Working should treat that URL as a **read-only handoff** with a primary **Open review** to the spawned package.

## Goal

When `linkedReviewId !== null` (handoffEditorLocked), Working draft detail is not an editable architecture desk: read-only summary of what was handed off, sealed/in-flight status of the child review, primary CTA to the review, secondary clone-from-snapshot if WA-10 already exists. Deep links bookmarking the draft after spawn must not look like “keep designing here.”

## Why

One work object fails if Start goes to the review (IS-03) but yesterday’s draft URL is still a workspace. Two live instruments after spawn is how people edit the wrong object and think the sealed record moved.

## Context

- `use-architecture-draft-workspace.ts` `handoffEditorLocked = linkedReviewId !== null`
- `ArchitectureDraftWorkspaceBody.tsx` — form `disabled={editorLocked}` but still the form
- `architecture-draft-handoff-gate.ts`
- `working-start-route.ts` `spawn-locked-review`
- WA-10 clone-from-snapshot — reuse, do not build a second new-version path
- ADR 0068 — draft remains a different kernel; this is presentation/route, not a table merge

## What to build

1. Working + spawn-locked: replace the draft editor layout with a handoff panel (what was submitted, link to review, lock explanation). Keep the same route for bookmarks.
2. Guided may keep the disabled form if that is teaching; Working must not.
3. Autosave `enabled: false` already — do not regress. Primary button is Open review (`CTA_WIDTH.content`), not Start review.
4. Vitest: Working spawn-locked fixture has no enabled architecture fields; has Open review href to the linked run.

## Acceptance criteria

- A Working user who opens the old draft URL after Start review lands on a handoff, not a live form.
- Clone/new-version remains the legal way to mutate architecture after lock (existing WA-10).
- Desktop review tabs unchanged. No More menu.

## Constraints

- Do not unlock spawn with localStorage “edit anyway.”
- Do not delete the draft row.
- Do not implement a draft-diff engine.
