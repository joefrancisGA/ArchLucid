# ADR FND-012 — Risk and exposure semantics

Status: Proposed schema-only cross-product contract (2026-11-22).

## Existing authoritative sources
- `ArchLucid.Core/InfraEvidence/RemediationRiskFactor.cs` enumerates weighted risk factors.
- `docs/library/REMEDIATION_PRIORITIZATION_AND_WAVES.md` (IE-15) documents deterministic, tenant-configurable priority weights, `IE15-priority-v1`, and existing ranked APIs.
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` distinguishes observed, intended and unverified reachability; requires ordinal confidence, evidence provenance and independent dimensions.

## Decision
Add an isolated versioned **risk/exposure description**, not a replacement scoring engine. Carry exploitability, reachability, business criticality, blast radius, ordinal uncertainty and evidence grade as independent dimensions. Every record is tenant/snapshot scoped and references its scoring policy. Unknown and insufficient evidence are first-class states.

## Non-negotiable semantics
- Intended network reachability is not observed traffic; no data-exfiltration claims without data-plane evidence.
- Unknown criticality does not erase verified technical exposure.
- AI inference cannot become observed fact by narration.
- Do not invent numerical confidence probabilities. This contract intentionally does not define a magic composite risk score.
- A dimension's evidence references must be independently verified and tenant scoped; a nonempty list does not prove validity.
- Existing IE-15 weights, ranking and customer APIs remain authoritative; no runtime scoring changes.
- A risk description is not permission to remediate.

## Follow-up gates
Implement adapters to existing IE-15 factors and SecureNow path confidence, calibrate band mappings with evidence, test missing and contradictory observations, and enforce authenticated tenant/snapshot scoping. Do not change 1.0 scoring semantics in this PR.
