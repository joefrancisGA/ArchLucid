# DR-11 — Pin a second review context without collapsing desktop tabs

**Do not hide desktop review workspace tabs behind More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`). **Do not merge** `DraftRequests` / `Runs`. **Do not fork PC-06** read-only seal delta — this is a second **open review**, not a field diff.

## Goal

Working architects juggle two packages (current review + last seal, or security’s copy). Today compare is a **separate route** and the workspace is one `runId`. Add a **pinned secondary context** on review-detail:

- Side panel or split pane listing the other run’s findings count, stamp status, and “open in this pane” finding inspect.
- Entry from Compare, architecture desk children (CA), or “Pin this review” on the reviews hub.
- Closing the pin returns to single-review; desktop tab strip for the **primary** review stays a full strip.

Do not build a multi-document IDE. Depth = **one** pin. No third pane.

## Why

All-day professional work is multi-context. Forcing sequential navigation is an evaluator demo flow.

## Context

- `ReviewDetailWorkspace.tsx` / `ReviewWorkspaceShell.tsx`
- `COMPARE_TWO_REVIEWS_PATH`
- `ArchitectureFindingsDualPane.tsx` (within one architecture — do not overload)
- Architecture identity children table (CA)

## What to build

1. URL or session pin: `pinRunId` query (shareable) with tenant-scoped 404 if out of workspace.
2. Panel UI: Carbon side panel; keyboard Escape closes; findings in the pin are read-only unless the user makes it primary.
3. Vitest: pin + primary tab strip still lists all primary tabs; pin cannot hide them.
4. Guided may omit the pin.

## Acceptance criteria

- Two review ids visible at once without a **More** overflow on the primary tab strip.
- Pin is not a second editable draft of a sealed record.

## Constraints

- No live presence avatars. No table merge.
