# WA-04 — Working help is a desk reference, not a first-session script

**Do not fork LD-15** for teaching-chrome auto-open gates. Those shipped. This file is **help topic copy and Getting started / first-session checklists** that still narrate the evaluator funnel as the job.

## Goal

Working-mode `/help/{topic}` bodies that describe “your first review,” “open the sample,” or “Finish setup” either (a) stay behind Guided-only sections, or (b) add a Working lead: resume drafts, open packages, sealed records, Report Problem. Shift+? and F1 remain. Help links stay in-app, not GitHub blob URLs.

## Why

Eight-hour users open help when stuck, not to be onboarded again. Help registries still excerpt first-session checklists (`help-index.generated.ts` “Walk first-session navigation”). Casual products keep the tutorial as the manual. A livelihood tool’s manual assumes the seat already exists.

## Context

- `archlucid-ui/src/lib/help/help-index.generated.ts` — do not hand-edit if generated; fix the generator source
- `archlucid-ui/src/lib/contextual-help/help-topic-rows-operator.ts`
- `archlucid-ui/src/lib/core-pilot-first-review-copy.ts`
- Getting started / first-review-guide help topics
- `docs/library/PRODUCT_DOCUMENTATION_PRESENTATION.md`
- LD-15 inventory — do not re-gate mounts; this is **copy when help is asked**

## What to build

1. Inventory operator help topics whose H1/lead is first-session, sample review, or Finish setup.
2. Working: lead with desk tasks (resume draft, open package, sealed records, retry/Report Problem). Move first-session steps into a Guided-only subsection or a clearly labeled “If you are evaluating ArchLucid.”
3. Do not auto-open any of this (LD-15). Do not change marketing `/why`.
4. Vitest or copy guard: Working-rendered help topic fixtures do not put “Open the sample review” in the first paragraph.

## Acceptance criteria

- A Working user who presses F1 on review-detail does not get a first-run script as the lead.
- Guided help may still teach first review.
- No GitHub blob URLs in customer help.
- Desktop tabs unchanged.

## Constraints

- Do not claim VPAT upgrades.
- Do not auto-switch Guided users to Working.
- Do not implement GTM **M-90** first-session cohorts.
