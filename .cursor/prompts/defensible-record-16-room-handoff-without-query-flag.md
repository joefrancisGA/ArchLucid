# DR-16 — Room handoff on Working without requiring presenter=1

**Do not invent live presence, avatars, or finding-comment chat.** **Do not fork PC-09** — presenter yes-answers already append to the **asserted** trail. This prompt is **discoverability and default job**.

## Goal

R4’s liability persona is ArchLucid on a **conference-room projector**, mediating MUST questions. Today elicitation is a **mode** (`presenter=1` / html data attribute). On Working review-detail (and architecture desk when a draft is open), a durable **Room** control in the command bar starts elicitation **without** requiring the operator to know the query flag.

- Command palette work action: “Start room elicitation” (PC-11: work before nav).
- Keyboard: document in `KEYBOARD_SHORTCUTS.md` (Alt+ combo, not a bare letter).
- Asserted vs inferred trail remains visible on the primary Findings/Overview tab while elicitation is active — not only in presenter chrome.
- Deep links with `presenter=1` keep working.

Guided may keep the query-flag teaching path.

## Why

The seatholder’s job is hub-and-spoke: absorb a vague requester, confirm MUST questions, seal a defensible no. Hiding that behind a query string is an evaluator easter egg.

## Context

- `use-review-presenter-elicitation.ts` (PC-09)
- `reviewPresenterElicitationHrefFromSearch`
- `RunDetailPresenterElicitationBridge.tsx`
- `KEYBOARD_SHORTCUTS.md` / command palette handler actions
- ADR 0050 transparency trail (do not rewrite)

## What to build

1. Command-bar + palette entry that sets presenter elicitation on without losing `reviewTab`.
2. Trail panel visible in default Working layout when unanswered MUST questions exist.
3. Vitest: Working review-detail without query flag can start elicitation; asserted answer still writes the trail (reuse PC-09 tests).
4. Do not auto-enable projector styles (font zoom) unless the user chooses Room — elicitation ≠ zoom (WA eight-hour zoom stays separate).

## Acceptance criteria

- A Working user who never learned `?presenter=1` can run the R4 loop.
- No chat; answers go to the asserted trail only.

## Constraints

- No desktop tab overflow. No 300s undo change. TB-645.
