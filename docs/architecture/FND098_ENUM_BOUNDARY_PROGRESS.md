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

## Follow-up triage of the 110 scoped diagnostics

The starting SARIF inventory was from the scoped Release build for PR #8415's initial change. It contained 86 Persistence diagnostics and 24 Core diagnostics. Every site was assigned a review queue by consumer. Queue membership is a priority decision, not a finding disposition, a reviewed exception, or proof that the site is safe.

| Scoped queue | Sites | Disposition |
| --- | ---: | --- |
| Audit and finding verification materializers | 12 | Replaced unchecked conversions in the manual evidence, control evaluation, evidence snapshot, and finding verification repositories. Scoped and unscoped audit item queries now share one validated projection. |
| Action lifecycle, collection and identity | 19 | Review next, beginning with remediation state and automation level, tenant routing, and operational finding state. Inspect existing guard and absence semantics before changing behavior. |
| Provenance, applicability and inventory | 46 | Review observed-versus-inferred evidence, ownership and scope, crosswalks, audit framework and assessment state, and inventory coverage before presentation-only paths. |
| Display and finding metadata | 9 | Preserve historical names and absence semantics. Repair any unsafe conversion even if the immediate consumer is descriptive. |
| Core contracts and readers | 24 | Verify each semantic guard and fallback individually. A cast after a membership check is a ratchet finding, not automatically a confirmed application defect. |
| **Total** | **110** | **12 addressed in this pass and 98 left for investigation. No exemptions approved.** |

In the fixed projections an absent SQL value can no longer become `Collected`, `ObservedFact`, or `Materialized` through zero initialization. SQL read models preserve absence and reject undefined ordinals. Explicit historical zeros and legal nonzero states are retained. The catalog preflight now covers the additional ten stored fields, including the verification status's historical `TINYINT` shape. It has not been run against any live catalog.
