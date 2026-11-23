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

## Independently reread reviewed plan — FND-016 reuse increment (2026-11-23)

The v3 signer originally accepted expected forward/inverse steps as arguments
beside the evidence. Although each digest was checked, nothing in that direct
adapter required a separate authoritative plan read. A caller could submit
matching but self-selected evidence and steps.

The reference now provides `issue_from_authoritative_plan` and
`verify_against_authoritative_plan` using the **same** existing v3
`issue_with_external_signer`, `verify_evidence_bound_attestation`,
and `remediation_steps_sha256` controls. The adapter takes a trusted
server-side tenant/project/proposal scope, minimum permitted plan revision,
trusted clock, and a separately configured `read_current_plan(scope)`
callback. It does **not** accept expected plan steps from the signing request.
A `ReviewedPlanSnapshot` must match scope, be explicitly approved, have
a positive revision not below the trusted minimum, and fall within its
approval/expiry interval. The reference recalculates the snapshot SHA-256
from canonical scope, revision, approval interval, and both ordered step
digests. The resulting steps are rechecked against signed rehearsal evidence
before invoking the signer; the corresponding verifier must independently
reread the current plan and validate its signature and freshness.

Missing, foreign, stale, unapproved, expired, malformed, or checksum-inconsistent
snapshots reject before signing; a missing or failing provider never falls
back to request-supplied steps. The existing lower-level direct signing and
verification functions are retained as pure test/reference helpers. They
**are not independently authenticated production entry points**.

**Critical boundary still missing:** this Python reference does not supply
a trustworthy `read_current_plan` implementation, a separately authenticated
session, a monotonic revision anchor, or managed signing-key custody. The
callback, clock and minimum revision must be installed by a trusted signing
service, not controlled by a client submitting the evidence. A checksum
recomputed from a forged snapshot is *not proof of an immutable authoritative
store*. No production plan repository or execution worker is added here.
The existing `IImmutableSourceStore` in the .NET architecture-intelligence
module has content-hash checks but stores a different artifact type, and
its `GetById` interface alone does not establish a tenant-authorized
remediation-plan approval. Likewise, the governance approval-request
repository is scoped for a different workflow, not a FND-015 approved-plan
store. Directly wiring either to the Python reference would invent a
security integration. Production adoption needs a purpose-reviewed,
scope-authorized current-plan adapter, durable immutable/append-only
storage, trusted revision watermark and signer authority.

This increment does not alter the v3 signing envelope; it validates the
current plan at signing/verification time. **The envelope still does not
carry a separate plan revision or immutable plan-record identifier.**
Long-lived replay, revocation and revision-identity evidence therefore
remain separate design and release gates. Valid reference attestations
continue to yield `eligible_for_execution=False`.
