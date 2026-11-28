> **Scope:** FND-098 closure evidence for the compiler enum inventory, historical read boundaries and the staged enforcement gate.

# FND-098 enum boundary verification

The reviewed `master` baseline is `14bc40c9c58e24fb8337d66dd3b0d59acd85cef8`. PR #8062 installed compiler-backed staged coverage and is already merged. This increment does not replace that analyzer or start a second solution build. The same fast-core compilation preserves compiler failure, emits evidence errors for absent diagnostics/coverage, and runs the selected analyzer, historical JSON and SQL-mapper suites against the existing build with TRX receipts. Missing-source diagnostics cannot be mistaken for a clean inventory. RC50 is now recognized by the existing explicit audit harness, alongside its previous accepted refs.

Five persisted InfraEvidence mappers now validate ten explicitly stored integer fields that previously used unchecked casts. Nullable transport projections distinguish a missing database field from the declared ordinal zero. A missing or undeclared ordinal fails materialization, without inventing approval, active status, or a relationship. Valid persisted ordinals, including the declared regulatory classification at 99, retain their meaning. JSON regressions verify names and explicit zero and reject omission, null, composites, and undeclared values for waiver status and review action. Broader JSON custom converters, default conventions and historical compatibility remain separate from compiler verification.

The read-only [catalog preflight](enum-state-readiness-preflight.sql) now reports schema and row readiness for the ten ordinal fields in addition to the existing migration 127 checks. It neither alters nor backfills catalogs. Run it only through the existing authorized read-only catalog access and record which catalogs actually ran. Unit fixture results are not live catalog evidence.

## Scoped verification

The local Release compilation produced four SARIF files and confirmed `ENUM000` for Contracts, Core and Persistence, three of the 33 product projects in the solution. It reported 110 remaining `ENUM001` sites in the inspected projects, none in the changed production files, and zero `ENUM002` findings. The solution gate correctly rejected the scoped reports as incomplete. A separate real-compiler control emitted no finding for a compliant source, emitted `ENUM001` for an unchecked cast that all-mode rejected, and failed compilation with `ENUM002` for a raw parse.

## Closure still requires evidence

- Obtain a completed fast-core artifact for the current review commit (or merge result), confirm all solution product assemblies have the actual compilation-end marker, and retain the SARIF and test receipts.
- Classify each remaining `ENUM001` site, fix unsafe reads, and record only individually reviewed exact fingerprints where required. No exceptions were added by this increment.
- Finish the source-generated/custom JSON and historical catalog compatibility review. An unavailable source is an open coverage gap.
- Keep `ENUM002` blocking. Keep the checked-in `ENUM001` policy at `changed-files` until the complete inventory and catalog evidence allow `all`. Verify failing and compliant controls on the release path before recording closure. An explicit inventory run is not release acceptance.
- Keep this targeted work out of the ordinary Aspects density series.
