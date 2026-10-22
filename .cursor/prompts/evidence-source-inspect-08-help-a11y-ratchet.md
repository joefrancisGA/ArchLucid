# ESI-08 — Help, accessibility, and regression ratchet

**Depends on ESI-03–ESI-05** (affordances exist). Last prompt in the set.

## Goal

Operators can discover that attached files are inspectable, and CI fails if the Evidence table regresses to dead text for **stored-file** rows.

## Why

Evidence-intake help still describes upload and formats, not “open the original on the review.” Without a ratchet, the next inventory refactor will drop the link.

## Context

- `archlucid-ui/src/lib/evidence-intake-help-guide-content.ts` and related evidence-intake help
- `docs/architecture/help_review_and_architecture_guidance_assessment.md` (intake vs recipes leftover — do not rewrite the whole topic)
- `RunDetailEvidenceInventorySection.test.tsx`
- `UI-Accessibility-Baseline.mdc` (link vs button; focus-visible; no clickable `div`)
- PC-12 / TB-2097: customer noun **Evidence graph** vs prose **evidence** — this set is **submitted evidence** / **source file**, not a rename of the graph

## What to build

1. Evidence-intake help: one short step — after analysis, open **Submitted evidence** on the review; click the file name to preview; use **Download** to save a copy. Not the sealed package ZIP.
2. First-pilot / start-review guides: only if they already mention attachments — add the same inspect sentence; do not add a new help topic.
3. Vitest ratchet: stored-file fixture **must** render a link or download button (`getByRole`). Citation fixture **must not**. Guard lives next to existing inventory tests.
4. Optional Playwright (only if a live-api evidence upload spec already exists): upload → review Evidence → download event. Do **not** add a new flaky e2e if none exists; prefer Vitest + API tests.
5. Command palette / nav: **no new destination**. This is an in-page control.

## Acceptance criteria

- Help does not say files are inspectable on intake-only screens that never persist originals (pre-ESI-06). Phrase as “files stored with the review.”
- Axe/keyboard: download button has an accessible name; preview dialog (if ESI-04) closes on Escape.

## Constraints

- In-app `/help/...` links only — no GitHub blob URLs (`PRODUCT_DOCUMENTATION_PRESENTATION.md`).
- Do not restyle the whole help hub.
- Do not hide desktop review tabs.
- Do not implement from earlier ESI prompts if they are not merged — skip tests that require missing APIs and say so.
