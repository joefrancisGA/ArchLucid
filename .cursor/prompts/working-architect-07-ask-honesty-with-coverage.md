# WA-07 — Ask answers carry coverage honesty (quiet engines / skipped MUST)

**Do not fork LD-03, RS-01, or RS-02** for queue/inspect/packet quiet-engine copy or the Finalize coverage strip. This file is **Ask**: answers can still sound like a complete review when actor-dependent engines did not run or MUST questions were skipped.

## Goal

Working-mode Ask (inline on review-detail and `/ask` with a package selected) shows the same quiet-engine / skipped-MUST honesty line the review already has, before or beside the answer. Hide-generic stays opt-in. Do not change `typed-engine-protected`. Do not invent a second density scale.

## Why

If livelihoods depend on ArchLucid, Ask is a meeting weapon. An answer that omits “engines did not run” is false confidence. Review-detail and queues were fixed; Ask is the leftover mouth.

## Context

- `archlucid-ui/src/components/findings/FindingAskInlinePanel.tsx`
- `archlucid-ui/src/components/AskRunIdPicker.tsx` / Ask run page
- `ActorDependentFindingsQuietEnginesHint` — **reuse**, do not fork copy
- Transparency trail / `HasSkippedMustQuestions`
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`
- WA-05 owns empty-no-package; this prompt assumes a package is selected

## What to build

1. When the selected package has quiet engines (analysis complete, actor count 0) or skipped MUST, Ask chrome hoists the existing hint. The model answer must not be the only visible thing.
2. If Ask has no package (WA-05), do not add a fake honesty line.
3. Vitest: fixture with quiet engines renders the hint on Ask; `DeterministicInsightDensityGate.cs` empty diff.

## Acceptance criteria

- Working Ask on a quiet-engine package cannot be screenshot as an all-clear Q&A.
- Generic typed-engine rows remain unless hide-generic is on.
- Guided may keep a shorter hint; do not strip honesty.

## Constraints

- **Forbidden:** applying `DemotionThreshold` to typed engines; adding a 40th coverage engine.
- Do not collapse review tabs.
- Do not send Ask to guided intake (RS-01).
