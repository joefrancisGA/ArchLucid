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
- Audit missing positive-zero properties and historically absent state columns. Relational blank artifact/snapshot statuses now fail closed; review JSON-only legacy object defaults and database preflight evidence.
- Add direct negative/positive boundary tests for remaining callers. Resolve new warnings, verify no false affirmative fallback, then promote the analyzer from advisory to enforceable guard with explicit reviewed exceptions.
- Keep findings from this targeted audit separate from the systematic Aspects sample series; record defect inventory independently without inventing unique reviewed LOC.

Do not mark the enum audit complete merely because a PR exists or because the direct parsing search is exhausted.

## Closure implementation 2026-11-24

- PR #8045: migration 127 supplies non-null constrained SQL lifecycle columns and historical backfill. Reject missing/blank relational state; legacy blob fallback now takes SQL snapshot generation status as authority. Explicit invalid-zero success coercion removed in four DTOs. The coverage summary defaults to Generating if status was omitted. Historical object initializers for snapshot/artifact shapes are retained for compatibility pending inventory of JSON-only data.
- Run [enum-state-readiness-preflight.sql](enum-state-readiness-preflight.sql) with authorized read-only access against each catalog. No database values were changed. Investigate incompatible data; do not rewrite sealed evidence or promote unknown states to success.
- PR #8047: reusable JSON enum converter wraps existing factories in MVC, strict JSON/TOML import, CLI request files, LLM parser, agent-result persistence, merge schema. Existing custom converters and numeric default readers still require explicit coverage inventory. ENUM002 is an error for raw Parse/ToObject or a discarded TryParse result; ENUM001 remains the review inventory for other raw conversions. The compiler-backed RC49 inventory script rejects unreviewed and stale exceptions in verify mode. No automatic baseline approval.
- After owner merges #8044, #8045, #8047 and integrates into RC49, use a clean checkout of RC49: `python scripts/ci/enum_boundary_audit.py --output artifacts/enum-audit-first`. Review every diagnostic, correct unsafe paths, and record only exact source-site exceptions with rationale. Run again into a fresh directory with `--verify --exceptions <reviewed-json>`; a successful build and no unreviewed findings are required. The script also requires a compiler report for every C# solution project and executes the listed focused test classes with TRX evidence. Then run ordinary full RC49 CI. No .NET SDK or workflow dispatch capability was available in the editing session. Neither inventory nor C# regressions have been executed; the solution-wide gate is not certified or automatically wired to normal release CI yet.

Targeted test classes: DefinedEnumTests, RunFindingCoverageSummaryDeserializationTests, FindingsSnapshotJsonFallbackMapperTests, FindingsCoverageProjectionMapperTests, ArtifactBundleStatusParserTests, SynthesizedArtifactSliceStatusParserTests, AgentModelCatalogRepositoryCoreTests, BillingWebhookTrialActivatorTests, ArchLucidApiJsonSourceGenerationTests, ArchitectureRequestFileParserTests, EnumBoundaryReviewAnalyzerTests, and the tests added in PR #8044.

The first-wave PR #8044 encountered a pre-existing test compilation failure (CS0051, run 45473957702). Its public theory signatures now use a Boolean selector while retaining both internal enum outcomes. Merge #8044 then #8045 before #8047 to avoid enabling ENUM002 before the raw Enum.Parse migrations are present. The latest fixes have not been confirmed by compilation.

## Post-merge review

PRs #8042, #8044, #8045 and #8047 are confirmed merged. At the verification checkpoint master was d3aabdd478c97724193c20b29ea1ad189917b6b8 and RC49 was 0dcf4112ca3e560f9e1539b25ab2d8b62144c9d3. RC49 did not yet contain DefinedEnum, the analyzer or the inventory script. The branches were diverged (master 1035 commits ahead, 51 behind); do not force-sync the release branch as part of this audit.

Additional shared-parser migration closes the ordinary-enum composite-name gap: raw Enum.TryParse plus Enum.IsDefined accepts some comma-separated member names that combine into a declared value (e.g. Deferred,NeedsEvidence -> Remediated). Migrate to DefinedEnum.TryParse, retain existing downstream behavior and add explicit composition regressions. The E2E billing harness rejects invalid checkout tiers before subscription activation. No full build or catalog preflight executed; the semantic inventory and RC49 validation remain open.

### Shared-parser adoption follow-up

PR #8051 merged at ac209ef336e25c9ec88e80a9389e3d3ad31ec430. Follow-up pinned master 2c3faa52db0829377c1527989bc85eb2d9de5a72 migrates 12 further raw parsing sites across 10 production files, removes same-value redundant membership checks at earlier migrated sites, and adds composite severity/model evaluation tests. Preserve separate business-domain checks, validated ordinal conversions, flags semantics, and documented absence handling in the contract reader. Code-search indexing can lag and is not a complete semantic inventory. RC49 at 600542b4c93637fd6532058cb8a0ad1cafd47ec1 has the original audit infrastructure but not #8051 or this follow-up. Compile/test evidence, catalog readiness and complete ENUM001 classification remain release gates.
