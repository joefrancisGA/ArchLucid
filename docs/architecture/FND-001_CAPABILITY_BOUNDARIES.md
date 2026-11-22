# FND-001 — 2.0 capability ownership and bounded contexts (proposal)

Status: Proposed; documentation-only, no runtime activation. Release-first: this proposal must not block 1.0.

## Ownership

| Context | Owns | Does not own |
| --- | --- | --- |
| ArchLucid architecture intelligence | Versioned topology snapshots, dependency and trust-boundary graph, source provenance, drift | Remediation execution or production authorization |
| SecureNow defense | Findings, exposure and attack-path assessments, risk prioritization, remediation recommendations | Unilateral production deployment |
| Shared evidence | Evidence identity, provenance, append-only decision/outcome references, trace correlation | Reinterpreting unsupported claims as verified fixes |
| Governance | Tenant-scoped authorization, approvals, autonomy policy, audit decisions, revocation | Vulnerability discovery or infrastructure mutation |
| Remediation/verification (future) | Typed proposals, dry-run, staged execution, verification, rollback evidence | Bypassing governance or silently elevating autonomy |

## Cross-context invariants

1. Every object is tenant-scoped; reject missing or mismatched tenant identity at service boundaries.
2. Distinguish observation, inference, recommendation, approved change, executed change, and independently verified outcome.
3. An architecture snapshot is immutable once published; revisions create new version identifiers with provenance.
4. Findings reference architecture snapshot and evidence IDs; absence of evidence is not positive verification.
5. No AI-generated prose is executable authority. Only validated, typed proposals may be considered for execution.
6. Production mutations require an explicit, scoped authorization decision; default is deny. Dry-run and experiment flags must not grant production permissions.
7. Every state transition is auditable and correlatable; retries must be idempotent or explicitly identified as unsafe.
8. Rollback eligibility, blast radius, and verification criteria must be defined before any future automated execution.

## Candidate contracts (FND-002 through FND-015)

- ArchitectureSnapshotRef: tenant_id, snapshot_id, schema_version, observed_at, source_refs, provenance_digest.
- EvidenceRef: tenant_id, evidence_id, source, captured_at, confidence, integrity_digest, retention_policy.
- FindingRef: tenant_id, finding_id, snapshot_id, evidence_refs, status, uncertainty.
- RemediationProposal: tenant_id, proposal_id, finding_refs, typed_change, preconditions, impact, rollback_plan, validation_plan.
- GovernanceDecision: tenant_id, proposal_id, policy_version, decision, approver, expiry, scope, audit_ref.
- VerificationOutcome: tenant_id, proposal_id, execution_ref, test_evidence_refs, result, residual_risk, verified_at.

These are conceptual contracts, **not** an assertion that matching production APIs already exist. FND-002 must specify serialization, canonical identity, semantic versioning, and compatibility rules before adoption.

## 1.0 integration constraints

- No new runtime dependency, schema migration, public API, or enabled execution pathway is introduced by this ADR.
- Future 2.0 scaffolding is opt-in and disabled by default, with independent CI and security gates.
- Existing 1.0 ownership and behavior remain unchanged until an explicitly reviewed migration plan exists.

## Acceptance and next evidence

- [x] Record proposed context boundaries and invariants.
- [ ] Map each context to actual source modules and owning interfaces on current master and release branch.
- [ ] Identify overlap/dual-write and tenant-boundary risks with file-level evidence.
- [ ] Review against existing ADRs and remove contradictions.
- [ ] Approve ownership decisions and only then mark FND-001 complete.
- [ ] Begin FND-002 with schema fixtures and compatibility tests on an isolated branch.


## Source-code mapping (master inspected 2026-11-22)

This is a **file-level ownership inventory**, not a runtime security certification. Evidence below is drawn from existing master source files; names alone are not evidence of completed cross-product contracts.

| Proposed context | Existing implementation anchor | Verified observation / boundary |
| --- | --- | --- |
| ArchLucid architecture intelligence | `ArchLucid.Provenance/ArchitectureGraphTemporalSnapshotResponse.cs` | Existing temporal architecture graph snapshot DTO identifies resolved run, as-of timestamp and graph. It documents `GET /v1/evidence-graph/snapshot`. Not yet the proposed cross-product `ArchitectureSnapshotRef`. |
| SecureNow defense / exposure | `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AzureInventoryDefenderAttackPathReadModel.cs` | Existing Defender attack-path read model carries subscription, attack path, entry/target resource IDs and evidence reference. This is an ingestion/read model, not proof of an autonomous attack-path engine. |
| Shared evidence | `ArchLucid.Core/Findings/FindingEvidenceRefs.cs`; `ArchLucid.Application/Governance/FindingEvidenceReferentialIntegrityValidator.cs` | Existing citation normalization and pinned-evidence integrity checks for high-severity findings. No claim that a universal canonical `EvidenceRef` schema exists. |
| Governance and approvals | `ArchLucid.Contracts/Governance/GovernanceApprovalRequest.cs`; `ArchLucid.Contracts/Governance/RunOperatorGovernanceDecision.cs` | Existing tenant/workspace/project-scoped manifest promotion request and run disposition enum. These do not themselves grant generic autonomous remediation authority. |
| Audit | `ArchLucid.Core/Audit/AuditEvent.cs` | Append-only-intent audit event with event/actor/tenant/workspace/project/run identifiers. Actual storage immutability and completeness require separate tests. |
| Remediation | `ArchLucid.Api/Controllers/InfraEvidence/RemediationInstancesController.cs` | Existing tenant-tier-gated, authorized remediation-instance HTTP surface and scoped read endpoints. Do not equate it with a sandboxed autonomous executor or verified rollback. |
| Experimental isolation | `ArchLucid.Core/Configuration/IFeatureFlags.cs` | Existing asynchronous feature-flag abstraction. Disabled-by-default behavior for each future feature must be independently tested. |
| Tenant boundary enforcement | `ArchLucid.Analyzers/TenantIdentityBoundaryAnalyzer.cs`; `ArchLucid.Analyzers/TenantScopedQueryScopeBindingAnalyzer.cs` | Compile-time analysis exists. Analyzer source explicitly excludes `ArchLucid.Api`, host assemblies and test assemblies for the first analyzer; runtime/API/database enforcement remains a separate concern. |

### Ownership and overlap findings

1. **Architecture / defense seam:** provenance graph snapshots and Defender attack-path ingestion live in different modules. FND-002 must define an immutable snapshot reference and evidence lineage so risk assessments cannot silently mix graph versions.
2. **Evidence seam:** citation strings and pinned-package validation are established capabilities, but a typed, versioned cross-product evidence envelope is not established by the inspected files. Avoid duplicate evidence authorities and preserve legacy citation compatibility.
3. **Governance / remediation seam:** an approval for manifest environment promotion is not authorization for arbitrary production remediation. Introduce an explicitly typed action, tenant scope, expiry, policy version and blast-radius bound before any future executor.
4. **Audit seam:** audit-event intent is append-only, but the DTO has setters; verify repository and storage append-only enforcement rather than claiming immutability from comments.
5. **Tenant seam:** analyzer exclusions mean analyzer coverage cannot be treated as a complete tenant-isolation guarantee. Trace controller scope providers, persistence predicates and integration tests before any autonomy elevation.
6. **Feature seam:** an interface for flags exists; it does not guarantee all 2.0 experiments default to disabled. Future flags require negative-path CI tests.

### FND-001 disposition

**Source-code mapping: completed. Architectural acceptance: conditional.** Context boundaries now have concrete master anchors and identified risks, but a full dependency audit, ADR conflict review, and design approval are not yet demonstrated. Do not mark FND-001 fully accepted or merge merely because the mapping exists.

**FND-002 handoff:** specify versioned `ArchitectureSnapshotRef`, `EvidenceRef`, `RemediationProposal`, `GovernanceDecision`, and `VerificationOutcome` contracts, with tenant/scope invariants, compatibility fixtures, and tests. Keep all executable remediation disabled.
