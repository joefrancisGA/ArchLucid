# ADR FND-007 — Typed remediation proposals

Status: Proposed schema-only foundation (2026-11-22). No execution path is added.

## Existing source mapping
- `docs/library/REMEDIATION_PATTERN_MATCHING.md` (IE-11) restricts AI to PossibleMatch/ProbableMatch and forbids AI-generated ExactMatch.
- `docs/library/REMEDIATION_INSTANCE_WORKFLOW.md` (IE-13) defines approved patterns, fail-closed preflight, state transitions and advisory-only execution. A proposal is **not** a remediation instance.
- `docs/library/SECURENOW_PATH_REMEDIATION_NARRATIVE.md` defines dependency-aware blast radius, preconditions, rollout and later-snapshot verification.
- `docs/library/INFRA_EVIDENCE_PLANE.md` prohibits direct customer Azure mutation.

## Decision
Introduce a versioned, strictly proposal-only exchange contract under `schemas/remediation/proposal/`. Require tenant, finding and evidence references, typed change, affected resources, preconditions, blast radius, expected outcome, rollback plan and verification plan. The `proposalStatus` field is fixed to `proposed`: schema-valid proposals do not confer authorization, create instances or imply execution.

## Security invariants
- The authenticated tenant/resource context must be checked independently of the envelope.
- Evidence references require trusted resolution and provenance verification; nonempty refs are not proof.
- An `unknown` blast radius or `not-yet-defined` rollback strategy blocks future automatic execution until explicitly resolved.
- Even a well-formed rollback plan must be independently tested before use.
- A proposed change cannot self-approve, execute, or attest its own verification.
- Existing IE-11 conflict handling and IE-13 exception/preflight/approval gates remain authoritative.
- No `terraform apply`, ARM mutation, or production remediation is enabled.

## Follow-up
Map actual remediation pattern/instance DTOs and adapters, add authorization and lifecycle tests, then connect to FND-008 verification outcome and FND-009 audit correlation. This schema is a low-cost 2.0 hook, not a replacement for 1.0 workflows.
