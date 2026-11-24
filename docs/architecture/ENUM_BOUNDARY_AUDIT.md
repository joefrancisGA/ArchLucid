# Enum boundary audit

Status: OPEN — targeted hardening, not repository-wide validation. Started 2026-11-24.

## Invariant

External or persisted values must not become a meaningful domain enum merely because parsing succeeded. Ordinary enum inputs require a declared value; comma composites are disallowed. Flags require known-bit validation. Missing values must be explicitly required or represented by a documented safe absence state. Invalid persisted authority values must not synthesize approval, active waivers, complete evidence, commercial entitlement, or connected status.

## Changes

- PR #8042: merged ITSM status mapper correction.
- PR #8044: first cross-boundary TryParse guard wave (open when checked).
- PR #8045: shared DefinedEnum parser, direct Enum.Parse migration and further TryParse adoption, persisted authority and billing fail-closed corrections (open when checked).
- PR #8047: API JSON read validation, explicit run governance decision presence, flags bitmask policy, advisory Roslyn ENUM001 inventory (open when checked).

## Closure gates

- Reconcile all pending PR diffs and merge in review order. No full build of master is authorized by this audit.
- Compile and run focused regression tests, then full RC49 validation under the existing release policy.
- Run ENUM001 across the complete product solution; classify every reported site (including casts, raw Parse/TryParse/ToObject, generic helpers, and intentionally valid flags). The initial code-search results are not a semantic proof of full coverage.
- Review JSON boundary coverage beyond MVC: source-generated contexts, property/type-specific converters, LLM output, imports, persisted JSON, job/outbox and CLI readers. Preserve valid wire formats and optional sentinels only where the contract explicitly documents them.
- Audit missing positive-zero properties and historically absent state columns. Existing legacy blank artifact/snapshot status defaults are intentionally unchanged pending a data/migration audit; unknown nonblank status is rejected.
- Add direct negative/positive boundary tests for remaining callers. Resolve new warnings, verify no false affirmative fallback, then promote the analyzer from advisory to enforceable guard with explicit reviewed exceptions.
- Keep findings from this targeted audit separate from the systematic Aspects sample series; record defect inventory independently without inventing unique reviewed LOC.

Do not mark the enum audit complete merely because a PR exists or because the direct parsing search is exhausted.
