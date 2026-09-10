# FC-02 — Shared career artifact honesty module (TypeScript)

**Depends on FC-01 (ADR 0078 Proposed or Accepted).** **Do not fork** `career-export-coverage-honesty.ts` — extend or re-export from one module.

## Goal

Create **`archlucid-ui/src/lib/career-artifact/career-artifact-honesty.ts`** (and colocated tests) as the **single Working entry point** every stamp/export/print/sponsor path calls before rendering a career artifact.

The module composes existing helpers (`career-export-coverage-honesty`, `transparency-trail-completeness`, `career-export-finding-inventory`, `sponsor-review-coverage-honesty`, measurement floor presenter bindings) into one result:

```typescript
type CareerArtifactHonestyVerdict = {
  readonly canRender: boolean;
  readonly blockedReasons: readonly string[]; // human sentences for UI + export header
  readonly headerLines: readonly string[];      // always render when canRender
  readonly warnings: readonly string[];         // render but allow export (legacy seal re-export)
};
```

## Why

Today each export path imports different subsets. Sponsor PDF can omit skipped MUST while the desk shows them. One module makes FC-04–FC-80 enforcement mechanical.

## Context

- FC-01 ADR 0078
- Existing: `career-export-coverage-honesty.ts`, `export-transparency-trail-section.ts`, `listSkippedMustQuestionKeys`, `formatInsightDensityMeasurementFloorPresentation`
- Inventory: `career-export-mounted-ui-paths.ts`, `career-export-mounted-ui-paths.test.ts`

## What to build

1. Implement `evaluateCareerArtifactHonesty(input)` with explicit inputs (trail, classification counts, enginesSucceeded, execution mode, pilot strict, sample/demo flags, feasibility verdict).
2. Refactor **at least two** high-traffic call sites (sponsor banner + finalize stamp band) to use the module — do not refactor all 80 surfaces in one PR.
3. Vitest: table-driven tests for blocked vs allowed combinations aligned with ADR 0078 §Decision.
4. Update `career-export-mounted-ui-paths` if new export entry points added.

## Acceptance criteria

- No caller renders sponsor PDF or stamp primary band without passing through `evaluateCareerArtifactHonesty`.
- Blocked reasons use TB-645 vocabulary and sentence case.
- `DeterministicInsightDensityGate.cs` untouched.

## Constraints

- One class/file per TS module pattern already used in repo.
- No ghost/link Button. TB-2005 on finalize form CTAs.
