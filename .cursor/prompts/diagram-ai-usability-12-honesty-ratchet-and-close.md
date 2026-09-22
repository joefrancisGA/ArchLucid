# DAU-12 — Honesty ratchet and wave close

**Wave:** diagram-ai-usability (**DAU**). **Depends on:** DAU-01–DAU-11 (implement what landed; do not fake remaining rows as Done). **Last prompt.**

Do not implement from the wave index. Implement only *What to build*.

## Goal

Lock the kernel in CI and an acceptance file so the next agent cannot claim PNG analysis, LLM Mermaid as source of truth, or default-on vision. Record residuals honestly.

## Why

AS-100 / IDH-03 / FP-24 exist because waves rot without ratchets. DAU is especially easy to “complete” with a chat box that emits Mermaid.

## Context

- `.cursor/prompts/diagram-ai-usability-00-index.md`
- `docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md` honesty CI section
- `archlucid-ui/src/lib/architecture-spine/architecture-review-diagram-input-contract.test.ts`
- `ArchLucid.Core/Configuration/DiagramVisionOptions.cs`
- ADR 0101 (DAU-01)
- Pattern: `docs/architecture/ARCHITECTURE_SPINE_ACCEPTANCE_2026-09-09.md`

## What to build

1. Acceptance doc `docs/architecture/DIAGRAM_AI_USABILITY_ACCEPTANCE_2026-09-13.md`:
   - Table DAU-01–DAU-12: **Shipped / Partial / Not started** from the tree (grep/tests, not hope).
   - Done tests from the index kernel table.
   - Residuals: C4 morph, change-impact preview, declaration-omission conversation, sponsor display names, snapshot walkthrough, unlabeled-shape namer, infinite canvas.
2. Honesty tests (extend existing contract tests rather than a new flaky grep of all markdown):
   - Operator/marketing strings in touched UI modules must not match `/analyz(e|es|ed) your (PNG|diagram image)/i` unless adjacent to VisionOptIn / interpret-with-AI copy.
   - `DiagramVisionOptions` default remains `false` (existing or new config test).
   - Guard: no production call that assigns Ask/LLM output to mermaid source without going through `architectureDiagramModelToMermaid` / `DiagramAst` renderer. Prefer a focused test on the NL-patch path (DAU-09) if present: mock LLM mermaid fence is ignored.
3. Pointers: wave doc status line; `docs/architecture/INFRA_EVIDENCE_COMPOSER_PROMPTS.md` DAU row; ADR 0101 **Follow-ups** if that section exists.
4. Do **not** mark IDG/IDH complete. Do **not** list GTM M-90/M-44/M-91/M-92 as engineering gaps. Do **not** reopen TB-135/TB-136.

## Acceptance criteria

- A future PR that sets vision default true fails a unit/config test.
- Acceptance file does not claim DAU-11 shipped if the interpret dialog is absent.
- Kernel sentence “LLM Mermaid is not the diagram of record” is in the acceptance file.

## Constraints

- Working-tree safety script before tracked edits.
- **Do not** implement skipped product prompts in this close-out. Report them as Not started.
- Verification: the honesty Vitest/C# tests you add. No full solution build.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
