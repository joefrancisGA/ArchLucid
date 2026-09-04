# FD-07 — Copy finding as work item carries the honesty line

**Do not fork CD-07** for sealed JSON/ADR export asserted vs inferred. This file is **clipboard / ticketing paste**: `copy-finding-as-work-item-types.ts` builds title, severity, recommended action, links — not typed-engine-protected, not asserted vs inferred, not skipped MUST.

## Goal

Working-mode copy-as-work-item (markdown and JSON envelope) includes one honesty sentence: typed-engine-protected when the finding is typed-engine, plus asserted vs inferred when that label exists on the inspect payload. Do not invent a Jira API. Do not change the gate.

## Why

The career event is often a pasted finding in Jira/ADO, not the in-app list. A Decision-grade paste without the miss clause is the same false confidence as a screenshot of the chip.

## Context

- `archlucid-ui/src/lib/copy-finding-as-work-item-types.ts`
- Builders that format markdown / `FindingWorkItemJsonDocument`
- Inspect payload fields already used for trustLabel
- `INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE`
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`

## What to build

1. Extend `FindingWorkItemBuildInput` / JSON document with optional `coverageHonesty` / provenance kind. Populate from inspect when present; omit rather than guess.
2. Markdown templates: honesty line after title/severity, same element block, not a footnote URL only.
3. Vitest: Working typed-engine fixture clipboard markdown contains `typed-engine-protected` (or the shipped honesty constant). JSON schema bump only if required — keep `archlucid.work-item.v1` compatible (additive fields). Gate `.cs` empty diff.

## Acceptance criteria

- A pasted Working finding cannot read as density-curated without the gate.
- Guided may keep a shorter paste; do not strip fields the inspect already has.
- No new ticketing integration.

## Constraints

- **Forbidden:** demoting typed engines.
- Do not collapse review tabs.
- Clipboard failures stay toast/system (`showError`), not validation.
