# Fix: CodeQL #3887 — JavaScript job UI build type error (TB-697 deferred metadata)

> Parent: [`fix-codeql-run-3887-00-index.md`](fix-codeql-run-3887-00-index.md)
> Job: **CodeQL (javascript)** · job id `87919277932`
> Failed step: **Install and build UI** (`npm ci` + `npm run build`) — CodeQL analysis / SARIF gate **skipped**.

## Symptom

```text
./src/app/(operator)/reviews/[runId]/_sections/RunDetailOperatorTechnicalForensicsPanel.tsx:44:44
Type error: No overload matches this call.
  Type 'RunSummary' is not assignable to type '{ ... } & { ... }'.
    Types of property 'structuralExecutionMode' are incompatible.
      Type 'number | "Simulator" | "Real" | "Fallback" | "Mixed" | null | undefined'
        is not assignable to type '"Simulator" | "Real" | "Fallback" | "Mixed"'.
          Type 'undefined' is not assignable to type '"Simulator" | "Real" | "Fallback" | "Mixed"'.
```

Call site:

```tsx
<RunDetailRunMetadataSectionDeferred run={props.run} runDetailTraceId={props.runDetailTraceId} />
```

`props.run` is `RunSummary`. Deferred chunk wraps `RunDetailRunMetadataSection`, whose props type is `RunDetail["run"]` (OpenAPI detail run where `structuralExecutionMode` is **required** string enum).

## Assessment

| Aspect | Detail |
|--------|--------|
| Introduced by | TB-697 deferred import of run-detail heavy modules (`RunDetailOperatorTechnicalForensicsPanel` + `run-detail-page-view-deferred-chunks.tsx`). |
| Root cause | `RunSummary` widens `structuralExecutionMode` to `StructuralExecutionMode \| number \| null \| undefined` (`authority.ts` wire extensions). Detail `run` requires a definite enum. Dynamic import preserved the stricter prop type; forensics panel only has `RunSummary`. |
| Security? | No — pure TypeScript assignability. Blocks CodeQL JS analysis entirely. |

## Required fix

Keep deferred loading (TB-697 intent). Fix types with the **smallest** change:

**Preferred:** Widen `RunDetailRunMetadataSection` props so `run` accepts what the forensics panel actually has:

```ts
type RunDetailRunMetadataSectionProps = {
  readonly run: RunSummary; // or Pick/compatible subset used by the section
  readonly runDetailTraceId: string | null;
};
```

Confirm the section only reads fields present on `RunSummary` (trace ids, retryCount, etc.). If it needs detail-only fields, guard with optional chaining / defaults — do not force callers to fabricate `structuralExecutionMode`.

**Alternative (also OK):** Add an explicit adapter at the forensics panel that maps `RunSummary` → the props type the section needs (normalize `structuralExecutionMode` via existing `normalizeStructuralExecutionMode` in `src/lib/structural-execution-mode.ts` if a required enum is truly needed for display). Prefer not to lie to the type system with `as`.

**Avoid:** Removing dynamic import / reverting TB-697; changing OpenAPI generated types by hand; `as any`.

## Tests / verify

From `archlucid-ui/`:

```powershell
npm run build
```

Or scoped UI compile check from repo root if that is the team habit:

```powershell
.\scripts\ci\agent-compile-check.ps1 -Ui
```

Optional: a shallow Vitest/render test is nice but not required if build typecheck is the regression signal.

## Acceptance

1. `npm run build` in `archlucid-ui` succeeds (typecheck + Next build).
2. CodeQL javascript job proceeds past **Install and build UI**.
3. Deferred chunk for `RunDetailRunMetadataSection` remains (`dynamic(...)` kept).
