# PC-09 — Presenter answers append to asserted trail (R4 conference room)

**Do not fork FD-01** — extend elicitation bridge. **Do not invent** live cursors, avatars, or finding-comment chat. **Do not fork WD-07** presenter surface.

## Goal

In Working **presenter mode** (`presenter=1`), when the operator records an answer to a presenter elicitation question (yes / no / typed response):

1. Persist answer on the **transparency trail** under **asserted** (with timestamp + question id + responder label “Room” or operator display name).
2. Show the new asserted row in the presenter panel and in the pre-finalize trail fold (FD-05).
3. Optional: export a one-page **meeting capture** PDF section listing Q&A — not a second sealed record.

## Why

R4 liability requires asserted vs inferred honesty. Collaboration without chat means the **room’s answers become first-class asserted facts**, not sticky notes. The BA mediating at the projector (R13) leaves a defensible trail.

## Context

- `RunDetailPresenterElicitationBridge`, presenter question URLs
- `IntakeTransparencyTrail`, draft → request projection
- ADR 0050, ADR 0073 trail gate
- FD-01 tests

## What to build

1. API mutation or draft patch path to append asserted trail entries (audit event).
2. UI: confirm line after each capture (“Recorded as asserted”).
3. Vitest: presenter answer → trail contains asserted entry; finalize scorecard shows it.

## Acceptance criteria

- Conference-room flow produces trail evidence without unsealing.
- Non-presenter Working unchanged.

## Constraints

- No multi-user realtime. Workspace scope only (ADR 0037).
