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
