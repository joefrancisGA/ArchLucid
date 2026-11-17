# NEC-03 — Delete the unread inference-source flag

**Do not implement from the index.** This file is the whole task.

## Goal

Remove `allSourcesMissing` from `resolveInferredSourceLegendFallback` in `archlucid-ui/src/lib/infra-evidence/resolve-infra-evidence-diagram-legend-inferred-line.ts`. Leave the two legend returns as they are.

## Why

The function sets `allSourcesMissing` to true when there is at least one inferred edge, then sets it to false when an edge has a non-empty inference source. Nothing reads it.

The returns already match the tests on PR #5463:

- A stored inference source that is not app settings, linked-service text, or AI → `INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNNAMED_KIND`
- Every inferred edge omits `inferenceSource` → `INFRA_EVIDENCE_DIAGRAM_LEGEND_INFERRED_SOURCE_UNKNOWN` (“inference source was not stored”)

Copilot thread `4407277917` offers a second option: drive a new legend from the flag. That option is rejected. There is no third copy, and the missing-source case is already the unknown return.

## Context

- Branch: `cursor/al-polish-narrative-wizard-ask-honesty-4156` (PR #5463), or `master` after that PR merges
- Tests: `archlucid-ui/src/lib/infra-evidence/resolve-infra-evidence-diagram-legend-inferred-line.test.ts`
- The unnamed-kind test uses inference source `inventory-app-authorized-access`
- The not-stored test uses `inferenceSource: null`

## What to build

1. Delete the `allSourcesMissing` declaration and every assignment to it.
2. Keep `hasStoredUnnamedSource` and both returns.
3. Re-run the legend inferred-line Vitest file. Do not add a test whose only job is “the deleted variable is gone.” The two existing outcome tests are the lock.

## Acceptance criteria

- The file no longer mentions `allSourcesMissing`.
- Unnamed stored source and omitted inference source still resolve to the two legend lines above.
- No new string in `infra-evidence-diagram-copy.ts`.

## Constraints

- Do not fold the unnamed-kind line back into the unknown line.
- Do not add a legend for “no inferred edges.” The fallback is only reached when the named kinds did not match; changing that path is out of scope.
