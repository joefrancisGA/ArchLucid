# WD-07 — Meeting elicitation surface (projector), not a demo overlay

**Do not fork PT-15 (Presenter) or PT-19 (meeting token keepalive).** If Presenter is unstarted, implement `professional-tool-15-presenter-mode.md` and use this file only for the residual below.

## Goal

Working mode gets a **meeting** presentation of the current draft or review: one visible question, three actions (yes / no / another question), and the asserted vs inferred trail. It is for a conference-room projector and a mediator — the founding persona. It is **not** the CTO demo tour overlay and **not** “hand the keyboard” explore mode.

## Why

Debate R4: ArchLucid on a projector; a business analyst mediating *“ArchLucid wants to know if a three-second response time is OK. Yes, no, or another question?”* What shipped is an eight-tab SPA plus `BuyerCtoDemoTourOverlay` “hand the keyboard” for **sales**. Idle timeout was extended to four hours because projector sessions dropped — a patch on the wrong interaction model. Livelihood use in the room needs a question, three answers, and a visible trail — not eight tabs.

## Context

- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R11 / R13
- ADR 0048 Socratic intake; `TransparencyTrailPanel`
- Draft workspace `/architecture/architectures/[id]`
- Review Overview / finalize path (WD-02 trail)
- **Do not extend** `.cursor/prompts/ux-hand-the-keyboard-mode.md` or `BuyerCtoDemoTourOverlay.tsx` — those are eval/demo
- `session-idle-timeout.ts` — keep 4h Working ceiling; do not shorten
- Socratic / guided-question components already on the draft (grep `SocraticIntake`, clarification, MUST/SHOULD)

## What to build

If PT-15 is not landed, **stop and run PT-15** (presenter query flag, one primary object, hide COGS). Then return here:

1. One entry only: reuse the PT-15 `presenter=1` (or whatever flag PT-15 shipped). Do not add a second `?view=meeting` product.
2. Presenter residual for the **mediator loop** (R4):
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
- Trail remains visible; skipped MUST is visible if present.
- Desktop review tabs are not deleted; meeting view is an alternate presentation of the same objects.

## Constraints

- Do not implement principal-architect dismissal cohort (**M-44**).
- Do not use bare `E` as a global shortcut (conflicts with demo tour; WCAG 2.1.4).
- Do not collapse the default Working tab strip behind More when *not* in meeting view.
