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
