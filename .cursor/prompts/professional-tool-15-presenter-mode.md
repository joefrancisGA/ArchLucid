# PT-15 — Conference-room presenter surface

## Goal

Working-mode users can enter a **Presenter** layout: one large current question or current finding, audience-safe vocabulary, no admin/COGS chrome, no sample CTAs. Yes / no / ask-another-question (intake) or accept / remediate / not applicable (finding) stay keyboard-reachable. Existing print stylesheet and 4-hour Working idle remain; this is a live room layout, not PDF.

## Why

Foundational debate R4: ArchLucid on a conference-room projector, a mediator asking “is a three-second response time OK — yes, no, or another question?” The shipped product is a dense operator console. Working mode only lengthens idle timeout (`SESSION_IDLE_WORKING_TIMEOUT_MS`). There is no presenter chrome. Livelihoods are defended *in the room*, not only at the desk.

## Context

- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 conference-room persona
- `archlucid-ui/src/lib/auth/session-idle-timeout.ts` — Working 4h; focus heartbeat 60s — **do not shorten**
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/print/page.tsx` (TB-2205) — print is separate; reuse package content, not the print route as the live UI
- Shell chrome modes in `AppShellClient.tsx` (`minimal` exists — evaluate reuse vs a `presenter` mode)
- Guided intake current question; finding workspace cards; `TransparencyTrailPanel` (compact: asserted vs inferred only)
- PT-01 buyer-polish; presenter must not reintroduce sample recovery (PT-02)

## What to build

1. Entry: command palette + a header/overflow **Presenter** control on review-detail and on active guided-intake, Working mode only. Query flag e.g. `presenter=1` so a docked laptop can keep the URL.
2. Layout: hide sidebar, LLM budget pills, Internal Operations, sample shortcuts. Keep skip-link, Sign out, and Exit presenter.
3. Content: **one** primary object (current MUST question or selected finding) at `OPERATOR_TYPOGRAPHY` that remains readable at 1920×1080 from a table distance — increase type on this surface only; do not globally bump operator `h1` tokens.
4. Actions: the same disposition / answer controls already on the page, large hit targets. Do not add a new API.
5. Exit presenter restores the previous tab/finding (PT-14 params if present).
6. Vitest: Working can enter/exit; Guided has no Presenter control; buyer-unsafe strings (COGS, Service Bus, run id as headline) are absent from the presenter root.

## Acceptance criteria

- A Working user can put the current finding or intake question on a projector without the eight-tab console.
- Keyboard still disposes or answers without hunting a card `tabIndex`.
- Print view still exists unchanged.
- Demo/Guided do not auto-enter presenter.

## Constraints

- Do not collapse review workspace tabs on the normal (non-presenter) desktop layout.
- Do not implement GTM dry-run cohorts (**M-90**).
- Do not show engineering chrome (Fleet LLM COGS, RAG health).
- TB-645 vocabulary stays.
