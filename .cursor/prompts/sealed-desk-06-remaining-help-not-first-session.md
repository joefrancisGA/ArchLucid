# SD-06 — Remaining help is a desk reference, not a first-session script

**Do not fork WA-04** (help lead rewrite). **Do not fork LD-15** (teaching-chrome mounts). **Do not fork CD-01** (first-week copy vs nav). This file is **topics WA-04’s inventory missed**: remaining `/help/{topic}` bodies, Getting started leftovers, and generated help index rows that still open with sample review / Finish setup / first architecture as the job for Working.

## Goal

Working-rendered help that is still first-session-led either moves that lead into a labeled “If you are evaluating ArchLucid” subsection or is Guided-only. Working lead: resume work, open package, sealed record, Report Problem, retry. F1 / Shift+? unchanged.

## Why

Eight-hour users open help when stuck. A first-run script as the H1 trains the product as casual even after Working Home is one door. WA-04 named the class; leftovers remain in generated index excerpts and specialty topics.

## Context

- `archlucid-ui/src/lib/help/help-index.generated.ts` — fix generator source, do not hand-edit if generated
- `archlucid-ui/src/lib/contextual-help/help-topic-rows-operator.ts`
- `archlucid-ui/src/app/(operator)/help/_sections/`
- WA-04 acceptance: first paragraph must not be “Open the sample review”
- `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`

## What to build

1. Grep help sources for `sample review`, `first session`, `Finish setup`, `first architecture`, `getting started` in H1/lead components used on Working.
2. Apply WA-04’s Working vs Guided split to remaining topics. Do not auto-open (LD-15).
3. Guard test: extend WA-04’s fixture list rather than a second matcher library.
4. No GitHub blob URLs.

## Acceptance criteria

- Remaining Working help fixtures fail if the first paragraph is a first-run script.
- Guided first-review topics may still teach first review.
- Marketing `/why` untouched.

## Constraints

- Do not implement GTM **M-90**.
- Do not auto-switch Guided users to Working.
- Do not claim VPAT upgrades.
