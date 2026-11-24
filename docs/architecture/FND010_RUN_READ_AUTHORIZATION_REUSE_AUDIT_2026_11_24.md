# FND-010 and architecture-share run-read reuse audit — 2026-11-24

## Scope and decision

Focused production-consumer audit of **existing** authorization controls on actual API evidence-read paths, against the checked-in `master` source. Branch `audit/fnd010-share-guard-run-roi-timeline-20261124` targets `master` in a **draft PR**. This is reuse hardening, not an authorization redesign, no independent cloud execution, and no comprehensive `master` build.

The FND-010 `ICentralAuthorizationDecisions` service implements a scoped and audited `evidence.read` decision; `EvidenceReadAuthorizationGate` delegates to it. The `GraphController.GetArchitectureGraphTemporalSnapshot` **SecureNow exchange** calls this gate twice for anchor and resolved run with fail-closed denial, whereas ordinary graph mode deliberately follows the existing `ReadAuthority` policy. Requiring this SecureNow-specific entitlement on every general read route would be a new policy decision, **not** a safe refactor and is not proposed.

Separately, `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync` already enforces per-architecture sharing for run-specific reads. It resolves a run inside the trusted scope, checks its associated architecture's read sharing authority, and emits a non-disclosing 404 on denial. `SealedManifestReadGuard` checks **integrity**, not whether a caller is allowed to read a restricted architecture. These controls are complementary.

## Production source inventory

| Inspected surface | Existing safeguards | Audit finding |
|---|---|---|
| `ArchLucid.Api/Controllers/Planning/GraphController.Snapshot.cs` | ReadAuthority on containing controller; FND-010 central evidence gate for both SecureNow exchange anchor and resolved run; scoped queries and sealed-manifest hash guard | Existing intended control reuse observed; no production bypass claimed |
| `ArchLucid.Api/Controllers/InfraEvidence/CloudResourceEvidenceHubController.cs` | ReadAuthority, project scope, sealed-run hash validation via existing application guard | Different read policy and resource type; not proof the SecureNow exchange gate is universally required |
| `ArchLucid.Api/Controllers/Authority/ExportsController.cs` | ReadAuthority and reuse of sealed-manifest read helper; scoped export query facade | Additional read-share callers need separate consumer-specific review; not certified here |
| `ArchLucid.Api/Controllers/Planning/ProvenanceController.cs` | ReadAuthority, scoped provenance service and sealed-manifest read helper | Additional read-share callers need separate consumer-specific review; not certified here |
| `ArchLucid.Api/Controllers/Authority/RunQueryController.Detail.cs` | ReadAuthority, scoped query service, sealed-manifest helper; **only `GetRun` had the architecture-share run-read gate** | **Confirmed inconsistency:** ROI and stage-timeline routes skipped the established architecture-sharing check |
| `ArchLucid.Api/Controllers/Authority/RunQueryController.Provenance.cs` | ReadAuthority, scoped services, sealed-manifest helper | Seven run-specific graph/provenance/evidence/trace/forensics reads skipped the existing architecture-sharing gate |
| `ArchLucid.Api/Controllers/Authority/RunQueryController.Findings.cs` | ReadAuthority, scoped services, sealed-manifest helper | Five run-specific finding/evidence/export access paths skipped the existing architecture-sharing gate |

Do **not** report a proven cross-tenant exploit: scoped repositories and platform read policy already exist. The demonstrated gap is a **missing additional architecture-sharing restriction**, which can matter for runs linked to restricted architectures in the same scope.

## Reuse correction

Extend the existing `RunQueryController` sealed-manifest helper partial with `EnsureRunReadBoundaryAsync(runId, ct)`: parse the run ID fail-closed, consult **the existing** `IArchitectureShareAccessGate.EnsureRunReadAllowedAsync` in the current trusted scope, return its denial before executing any protected query, then delegate to the existing `EnsureSealedManifestReadAllowedAsync` integrity helper.

Replace **all 15 previously enumerated run-specific call sites** across `RunQueryController.Detail.cs` (3), `RunQueryController.Provenance.cs` (7), and `RunQueryController.Findings.cs` (5) to use that single shared read boundary. The main run-detail route no longer contains a separate, redundant share invocation. Scopeless aggregate ROI telemetry and paged run listings are not specific-run reads; they were not changed.

This approach reuses both established controls rather than introducing a parallel decision service, duplicating policy rules, or weakening a sealed-manifest requirement. A missing run or architecture-sharing entitlement returns a non-disclosing 404 before the application read. Preserving a database-enforced scope remains mandatory independently.

## Focused regression and validation

`ArchLucid.Api.Tests/RunQueryControllerTests.cs` now exercises denied restricted-run access for six representative actions (detail, ROI, stage timeline, interactive graph, run evidence, finding evidence) and asserts their query services were **not invoked**. It also rejects invalid ROI/timeline identifiers before a query or share-gate call. The existing positive `GetRun`, ROI and timeline tests remain present.

The existing `.github/workflows/fnd010-dotnet-evidence-authorization.yml` focused PR workflow now includes `RunQueryControllerTests`, alongside central authorization, audit, worker and SecureNow exchange tests. **Do not claim this branch's .NET execution succeeded until its actual run is checked.**

## Coverage and provenance limitations

The 15 is an **explicit count of pre-existing sealed-manifest helper call sites in three inspected RunQueryController source files**, not 15 independent newly discovered vulnerabilities nor a full-repository endpoint census. Other partial controllers, exports, and architecture-share read paths need follow-up source and negative-test review. `master` remains the authorized integration target, but merges are exclusively the user's decision; full builds are restricted to RC49.

The oldest-file and last-modified timestamps of these source files were **not verifiable** from the connector's file/blob APIs. They expose source and blob SHA, not complete rename-following Git history; do not invent dates. Use an exact `git log --follow` review to establish those ages when repository history access is available.
