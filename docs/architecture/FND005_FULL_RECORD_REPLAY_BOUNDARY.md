# FND-005 full-record signatures and replay boundary

This additive v2 envelope signs the **entire** canonical record JSON (including source, capturedAt and provenanceKind), the tenant, externally trusted lineage, key identifier, nonce, and issuance/expiry timestamps. The HMAC signature is domain-separated from the earlier partial-claim signature. SHA-256 verifies exact evidence bytes. No deployed feature is changed.

The verifier requires an authorized tenant ID and trusted lineage provided independently of the envelope, rejects invalid signatures, expired envelopes, inactive keys and replayed nonces, and reserves the nonce only after cryptographic verification. A replay-store exception fails closed. Tests include tampered metadata, tenant mismatch, replay and outage.

**Critical limitations:** `InMemoryReplayStore` is only single-process reference code. Production must use a durable, atomic shared reservation store and define retry/idempotency behavior. The verifier is not an authorization policy engine and must run only after authorization to dereference the evidence. JSON canonicalization is a project-specific deterministic encoding, not RFC 8785; other languages need interoperability fixtures. Payload size limits, complete JSON Schema validation, key vault integration, signature algorithm agility and operational replay TTL cleanup remain release gates.

Do not merge or enable the runtime exchange until required CI/security and FND-011 integration checks pass.
