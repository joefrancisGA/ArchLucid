# LD-13 — Meeting elicitation (projector), not a demo overlay

**Do not fork LI-14, PT-15, or PT-19.** Presenter query flag, print activity heartbeat, and token refresh-before-warning already shipped. This file is **WD-07 residual: the mediator loop**.

## Goal

Working mode gets a **meeting** presentation of the current draft or review: one visible question, three actions (yes / no / another question), and the asserted vs inferred trail. It is for a conference-room projector and a mediator — the founding persona (debate R4). It is **not** the CTO demo tour overlay and **not** “hand the keyboard” explore mode.

## Why

Debate R4: ArchLucid on a projector; a business analyst mediating *“ArchLucid wants to know if a three-second response time is OK. Yes, no, or another question?”* What shipped is an eight-tab SPA plus `BuyerCtoDemoTourOverlay` for **sales**, plus a presenter flag that keeps the session alive. Idle timeout was extended to four hours because projector sessions dropped — a patch on the wrong interaction model. Livelihood use in the room needs a question, three answers, and a visible trail.

## Context

- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R11 / R13
- ADR 0048 Socratic intake; `TransparencyTrailPanel`
- `readPresenterModeFromSearchParams` / review-detail presenter (LI-14)
- Draft workspace `/architecture/architectures/[id]`
- **Do not extend** `.cursor/prompts/ux-hand-the-keyboard-mode.md` or `BuyerCtoDemoTourOverlay.tsx` — those are eval/demo
- `session-idle-timeout.ts` — keep 4h Working ceiling; do not shorten
- Socratic / clarification / MUST/SHOULD components already on the draft (grep `SocraticIntake`)

## What to build

1. One entry only: reuse the shipped `presenter=1` (or equivalent). Do not add a second `?view=meeting` product.
2. Presenter residual for the **mediator loop**:
   - Current MUST/SHOULD question (or “ready to finalize” + skipped MUST list)
   - Three explicit actions: confirm / reject / ask another (reuse existing intake APIs; do not invent a chat)
   - Compact transparency trail (asserted / inferred / skipped)
   - Architecture name + business outcome only — no COGS, sample CTAs, or tour chrome
3. Hide teaching strips, shortcut coaches, and demo tour in this view. Keep skip link + main landmark.
4. If `package-print-view.ts` is cheap to reuse, add a **one-page leave-behind** of the current question + trail. Do not invent a second PDF stack.
5. Vitest: Working can enter/exit presenter; Guided unchanged; demo overlay not mounted; only one query flag exists.

## Acceptance criteria

- A mediator can run yes/no/another-question on a projector without the eight-tab strip dominating the first viewport.
- Demo “Explore / hand the keyboard” overlay is not reused or shown.
- Token keepalive from LI-14 still holds; Working idle remains 4 hours.
- Desktop review tabs are not collapsed; presenter is a layout, not a More menu.

## Constraints

- Do not disable session timeout as a global “never log out.”
- Do not lengthen idle for Guided.
- Do not store tokens in `localStorage` beyond existing OIDC session helpers.
- Do not implement GTM first-session cohorts.
