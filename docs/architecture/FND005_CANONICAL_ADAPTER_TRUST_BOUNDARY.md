# FND-005 canonical record adapter — security boundary

The adapter accepts the existing `schemas/evidence/canonical-record/1.0.0.schema.json` shape, validates essential fields, checks content SHA-256, requires an authenticated tenant ID and a separately trusted evidence-ID-to-lineage binding, and optionally authenticates the producer using a caller-owned keyring with explicit activation and retirement windows.

**Not production-ready:** the existing canonical schema contains only `tenantId`, not workspace/project/run/snapshot. Therefore a trusted external lookup of `evidenceId` must bind all lineage identifiers; caller-provided strings alone are insufficient. The adapter requires `expected_lineage.evidence_id` and rejects absent bindings. This code does not perform authorization, storage lookup or cryptographic key retrieval.

**Signature coverage limitation:** the current HMAC claim signs evidence ID, digest, tenant and lineage identifiers, but does not sign source metadata, capture timestamp, provenance kind or key ID. An attacker who controls the record could modify these unsigned metadata fields without invalidating the signature. Until a future envelope signs the full canonical record and includes nonce/replay protections, treat only the signed subset as authenticated. Never promote `AiInference` to observed fact.

Keys are never loaded from the evidence record. Use external key management, audit key rotation and enforce replay/retention policy before runtime wiring.

Tests cover valid signature, tampering, foreign tenant, missing lineage, unknown/expired key, unsigned evidence and future capture. The adapter is additive and read-only.
