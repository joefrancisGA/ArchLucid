# FND-016 evidence-bound recovery attestation and disposable rehearsal

This increment binds an Ed25519 attestation to the complete canonical FND-016 in-memory rehearsal evidence via SHA-256. An independent signing authority receives the canonical payload and signs it; the rehearsal code has no signing key. Verification requires a separately pinned Ed25519 public key, exact key identifier, matching tenant/project/proposal, matching source/rollback digests and matching rehearsal evidence hash. Any alteration to the rehearsal's forward/reverse decision identifiers or simulated state digest invalidates the attestation.

A dedicated GitHub Actions job runs the rehearsal regression suite inside a disposable Docker container with networking disabled, read-only filesystem, dropped Linux capabilities, no-new-privileges and resource limits. This exercises process isolation but **does not provision real cloud infrastructure or prove real infrastructure rollback**. The signed evidence contract explicitly records `isolation=in-memory-only` to prevent confusing a simulated rehearsal with live recovery evidence.

Production gates: independent signing service with non-exportable keys; durable immutable evidence storage; authenticated provenance of rehearsal execution; real disposable cloud test environment with teardown and resource controls; independently measured restoration of infrastructure and dependent services; verified CI and safety review. No remediation execution is enabled.

## Ordered-plan input binding (2026-11-23 reuse audit)

The earlier evidence-bound v2 Ed25519 envelope covered the canonical
rehearsal evidence and before/after model digests, but not the exact
`RemediationStep` sequences used in the rehearsal. Two different forward
or rollback paths can have identical original/simulated/rollback model
digests. A signature over only those digests does **not** establish which
ordered operations and intermediate values were rehearsed.

The non-executing reference now emits `schemaVersion: 1.1.0` rehearsal
evidence with `forwardStepsSha256` and `inverseStepsSha256`. Each SHA-256
binds an ordered JSON list of `operation`, `resource_id`, `key`,
`expected_value` and `new_value` for every step. The independently
signed envelope includes both hashes and the digest of all rehearsal
evidence. The signing domain is explicitly versioned **v3**
(`archlucid.fnd016.recovery-rehearsal.v3`), rather than silently treating
a legacy v2 signature as proof of these additional facts. The v3 verifier
rejects v2 envelopes and invalid evidence schema/hash formats.

The verifier now **requires** independently obtained
`expected_forward_steps` and `expected_inverse_steps`, recomputes their
digests using the same pure, stdlib-only helper and fails closed on either
mismatch. These expected values must come from a separately authenticated,
immutable authorized plan; simply copying them out of the signed payload
would not provide an independent trust boundary. Existing signatures
for the former v2 format cannot be used with the updated v3 verifier;
any external integration must explicitly migrate and re-attest its
rehearsals. Indexed default-branch code search found reference code and
tests but no production verifier integration.

The existing `assess_recovery_and_stop` still returns
`review_required` and `eligible_for_execution=False` even when handed
a freshly verified, properly scoped v3 attestation. It does not provide
remediation execution authorization. FND-016 exact inverse-sequence
verification on separate draft #7900 is a related safeguard; its PR
must be validated and reconciled before production use. No cloud
execution worker, signing-key custody, or runtime admission gate was added.

## Pre-sign attestation gate — FND-016 reuse audit (2026-11-23)

The independent signer adapter previously checked only the payload field
set and signature domain before invoking the external signing callback.
That permitted malformed or incorrectly bound input to reach the signing
boundary; the stronger evidence and independently expected forward/rollback
plan checks existed **only in the downstream verifier**. A bad signature
request might be rejected later, but should not be signed in the first place.

The existing `_validate_payload_binding` helper is now shared between
`issue_with_external_signer` and
`verify_evidence_bound_attestation`. Both require the v3 evidence digest,
exact tenant/project/proposal and model bindings, signed-domain claim,
literal rehearsal success, valid issued-at timestamp, and SHA-256 hashes of
the **independently supplied expected forward and inverse steps**. The
signer callback is not invoked on rejected input. The external signer
adapter now takes mandatory keyword-only `evidence`,
`expected_forward_steps` and `expected_inverse_steps` arguments.
This is a **breaking reference API adjustment**; only unit tests were
found calling the adapter in the indexed `master` search.

These checks **do not prove** that the expected plan came from an
independent immutable authority: that provenance must be established by
the real signing service and authenticated plan store. The arbitrary
`signer` callback in this reference remains a test seam, not a deployed
hardware-backed key or signing authority. The downstream verifier
still checks the pinned Ed25519 public key and signature. The recovery
stop gate continues to return review-required, never execution eligibility.


## Existing production persistence review — current approved pattern version (2026-11-23)

The FND-016 v3 reference signing adapter now expects a separately trusted,
current, approved FND-015 *plan*. The current ArchLucid .NET codebase **does
not yet contain an identified persisted, immutable FND-015 plan record**
with the ordered forward/inverse steps, approval validity, independent actor
and revision watermark required by that contract. Do not cast a signed
in-memory rehearsal, an architecture-intelligence source artifact, or a
governance manifest approval into an approved remediation plan.

The real `IRemediationPatternRepository` already persists *remediation
patterns* and version states in `dbo.RemediationPatterns` and
`dbo.RemediationPatternVersions` (migration 357). Pattern approval
atomically updates a version and the parent `CurrentApprovedVersion`
pointer. A generic `TryGetVersionAsync` can still retrieve an older
approved version after the pointer advances, while the bulk
`ListApprovedVersionsForTenantAsync` deliberately includes every approved
version for matcher version-skew/conflict analysis. Neither is safe to
silently substitute for a **current** approval lookup.

This reuse increment adds the narrow, fail-closed
`IRemediationPatternRepository.TryGetCurrentApprovedVersionAsync(tenantId,
patternId)`. Its SQL implementation joins the parent and pointed version
**in one statement** while checking the exact tenant/pattern, current
version, `Approved` status and recorded independent approval metadata.
Draft, noncurrent, retired, deleted or out-of-tenant versions return no
record. Unsupported repository implementations default to no result.
Existing pattern matcher, frozen-version instance workflows, and global
retention/repair semantics are **unchanged**.

This is a **production-oriented read primitive for approved patterns**, not
a production integration from FND-016 to FND-015. Pattern content does not
establish the proposal's scoped forward/inverse steps or independent plan
signing policy. The SQL read uses the current persisted pointer; an actor
must still supply independently authenticated tenant scope and signing
authority. The pattern's `ApprovedUtc` and status do not provide
remediation-plan expiration, revision revocation, immutable plan-content
attestation, or approval of cloud mutations.

SQL integration coverage is intentionally contained in a disposable test
catalog; it tests old approved versions remaining in SQL while the current
pointer moves, foreign tenants, drafts, and retirement. The existing SQL
fixture may skip if unavailable; a skip is not a passing SQL proof.
No production signing service or Azure mutation was enabled.
