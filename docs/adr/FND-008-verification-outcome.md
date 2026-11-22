# ADR FND-008 — Independent remediation verification outcome

Status: Proposed schema-only foundation (2026-11-22); no runtime verifier, authority or customer mutation.

## Source mapping
- `docs/library/REMEDIATION_INSTANCE_WORKFLOW.md` (IE-13): existing instance state machine includes `Verified` and `VerificationFailed`; checks use a later inventory snapshot. Executed is not verified.
- `ArchLucid.Core/InfraEvidence/RemediationPatternVersionContent.cs`: existing `VerificationQueries` in pattern execution definition.
- `docs/library/SECURENOW_PATH_REMEDIATION_NARRATIVE.md`: verification query examples, including path removal and resource properties.
- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md`: engineer/analyst handoff explicitly separates fix verification from auditor conclusion.

## Decision
A versioned outcome record connects proposal, remediation instance, execution reference, baseline snapshot, later verification snapshot, verifier identity, individual checks, regressions, residual risk and evidence references. `passed` requires every listed check to pass and zero recorded regressions; `inconclusive` is first-class.

## Trust and lifecycle constraints
- JSON Schema validates shape and internal consistency, **not** cryptographic authenticity, actual time ordering, independent verifier identity, or completeness of tests.
- A passing record is not itself an authorization, proof of deployment, control attestation, or auditor conclusion.
- Validate the later-snapshot timestamp and trusted provenance against immutable stored snapshots in a future runtime adapter.
- Independently resolve tenant-scoped proposal, instance, execution and evidence references.
- A verifier must be independent of the proposing/executing actor under the deployment's trust policy.
- Never infer `passed` from `ExecutionSucceeded` or advisory Terraform emission.
- Unmeasured regressions and unknown residual exposure must remain explicit; no silent promotion to verified.

## Follow-up
Build real adapters and checks against existing IE-13 state, add signed provenance, ordering and authorization tests, and link to FND-009 audit correlation. No active 2.0 runtime module is introduced.
