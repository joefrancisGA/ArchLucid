# ADR FND-005 — Canonical security evidence record

Status: Proposed schema-only 2.0 foundation, not an active evidence store or verifier.

## Existing source mapping
- `ArchLucid.Contracts/Findings/Finding.cs`: `FindingId`, `EvidenceRefs`, `EvidencePackageId`, `AgentExecutionTraceId` are existing finding-level references; **do not replace** them.
- `ArchLucid.Core/Findings/FindingEvidenceRefs.cs`: appends package-resolvable citation strings. A citation is not proof that evidence was independently verified.
- `docs/library/INFRA_EVIDENCE_PLANE.md`: proposed shared collection/snapshot lineage and five provenance classes. Preserve its distinction between observations, deterministic derivations, AI inference and human assertions.
- `docs/quality/RELEASE_EVIDENCE_BUNDLE_SCHEMA.md`: release artifact manifests with hashes; **different purpose** from security evidence records.
- `schemas/integration-events/`: established integration event schema/versioning; do not silently change.

## Decision
Add a new, isolated JSON Schema Draft 2020-12 record in `schemas/evidence/canonical-record/` for future cross-product evidence exchange. Version is semantic `1.0.0` at the new boundary, while existing integer finding/graph versions remain unchanged.

Every record requires a tenant identifier, evidence identifier, source locator, capture time, explicit provenance classification, digest and verification status. `verified` requires verification metadata. All existing sources remain authoritative until a separately reviewed adapter is built.

## Trust model
- The schema checks **shape only**. It does not validate a digest against bytes, establish the collector's identity, authenticate tenant membership, or prove that verification occurred.
- A forged `verificationStatus=verified` with fabricated metadata can still pass schema validation. Independent verifier signatures and trusted storage are required before accepting the claim.
- `AiInference` and `HumanAssertion` must not be promoted to `ObservedFact` by summarization.
- Parent evidence references must be resolved within the authenticated tenant boundary; check cycles, missing ancestors, and authorization.
- Retention is a policy decision, not a guarantee from a timestamp.
- Evidence and findings are distinct from approvals and remediation execution authority.
- Preserve original source bytes and their digest; never rewrite sealed historical records in place.

## Follow-up gates
1. Identify actual producer and consumer endpoints and persisted evidence objects.
2. Define canonicalization, hashing, signature and trusted verifier policy; include tamper/replay tests.
3. Enforce authenticated tenant isolation on every evidence dereference.
4. Add explicit source-to-record adapters and negative tests for unsupported evidence.
5. Verify required security/CI checks before merging; no runtime integration in 1.0 by default.
