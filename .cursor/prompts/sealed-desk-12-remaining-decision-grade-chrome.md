# SD-12 — Remaining Decision-grade chrome does not screenshot as Ready

**Do not fork FD-13** (`StatusTag kind="ready"` on Decision-grade). **Do not fork IS-06 / IS-07** (stamp counts / two bands). **Do not fork LS-12** (Ask / sponsor). This file is **remaining chips, CLI dumps, and list cells** that still use Ready / Approved semantics for `FindingClassification.DecisionGradeFinding` or that print every finding as if it were decision-grade.

## Goal

Any remaining Working surface that shows a finding classification uses the same two-band vocabulary as IS-07 (Decision-grade vs checklist coverage). `StatusTag kind="ready"` is reserved for actual ready/approved workflow state, not insight-density classification. CLI `findings` / snapshot dumps include classification, not a flat list that screenshots as “all findings.”

## Why

False confidence is the livelihood-class failure. FD-13 and IS-07 can fix the findings desk while a hub chip or CLI JSON still looks like a green stamp. Sponsors screenshot whatever is green.

## Context

- Grep `archlucid-ui/src` for `DecisionGrade` / `decision-grade` / `kind="ready"` near finding classification
- `StatusTag` kinds — Ready means workflow ready, not density
- CLI finding list formatters under `ArchLucid.Cli`
- FD-13 tests — extend fixtures, do not fork the tag component
- IS-07 checklist band — reuse copy constants

## What to build

1. Inventory remaining Ready/Approved tags bound to finding classification. Switch to a classification chip/copy from IS-07.
2. CLI list/JSON: include `classification` (and checklist count in summaries). Do not default missing classification to Decision-grade.
3. Vitest + CLI snapshot tests for the fixtures you touch.
4. Guided may keep simpler chips; it must not call checklist rows Ready.

## Acceptance criteria

- Grep of remaining finding-classification call sites does not assign `kind="ready"` for Decision-grade.
- CLI finding summary names checklist vs Decision-grade counts when the snapshot has both.
- Stamp/PDF/Ask are not restyled here.

## Constraints

- Do not demote via LLM judge.
- Do not delete typed-engine rows.
- Do not change `DeterministicInsightDensityGate`.
