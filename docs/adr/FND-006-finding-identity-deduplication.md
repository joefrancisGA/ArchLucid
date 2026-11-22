# ADR FND-006 — Cross-product finding identity and deduplication

Status: Proposed additive contract, 2026-11-22. No production deduplication behavior changed.

## Existing authoritative design
Accepted `docs/architecture/adrs/0063-cross-review-finding-identity.md` defines run-scoped unique `findingId`, cross-run policy-rule/fingerprint correlation, fuzzy possible-match fallback, and no automatic transfer of governance dispositions.

Code:
- `ArchLucid.Application/Findings/NormalizedFindingFingerprintNormalizer.cs` computes SHA-256 over lowercased whitespace-normalized category and message. `TryBuildDedupeKey` requires `PolicyRuleId`.
- `ArchLucid.Decisioning/Findings/FindingSnapshotMergeKey.cs` uses similar normalization for `Finding.Category` and `Finding.Title`, but lowercases policy rule IDs while the application normalizer only trims them.
- `ArchLucid.Contracts/Findings/CrossReviewFindingCorrelationResult.cs` tracks policy and fuzzy match counts.

**Observed seam:** policy-rule casing differs between two existing key producers. Do not assume their string outputs are interchangeable or change either legacy algorithm without compatibility tests.

## Proposed additive boundary
`schemas/findings/identity-correlation/1.0.0.schema.json` describes a correlation *record*, not a replacement for run-scoped `FindingId`. It carries tenant, run, finding ID, matching method, confidence class and lifecycle status. Fuzzy correlation must always be marked `possible-match`.

## Safety invariants
- Tenant identity is authenticated by the caller; a tenant field alone is not isolation. Never deduplicate across tenant boundaries.
- A hash collision or common normalized title does not establish identical root cause. Compare asset scope, policy, evidence and code location before merging counts.
- A stable fingerprint is a correlation hint, not a unique immutable defect identifier.
- Changes in source revision do not automatically mean a new defect or a verified fix.
- `resolved` requires independent evidence that the defect no longer exists; `reopened` requires prior resolution and rediscovery.
- Never transfer approvals, suppressions or human dispositions across runs automatically.
- For Aspects metrics, preserve raw discoveries, distinct confirmed defects, and possible duplicates as separate counts with audit links.

## Before runtime integration
Build adapters for actual source DTOs, reconcile policy rule normalization, add cross-run/tenant/collision tests, and establish an authoritative lifecycle transition store. This PR only defines the additive schema and isolated validation.
