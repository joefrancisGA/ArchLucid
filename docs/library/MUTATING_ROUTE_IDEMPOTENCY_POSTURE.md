> **Scope:** Engineering reference for INV-009 mutating HTTP idempotency posture; not a buyer-facing claim.

# Mutating route idempotency posture

ArchLucid classifies every `ArchLucid.Api` controller **POST / PUT / PATCH / DELETE** route for retry safety.

## Postures

| Posture | Meaning |
| --- | --- |
| `explicit-idempotency-key` | `Idempotency-Key` header or `[IdempotencyFilter]` on the controller |
| `naturally-idempotent` | PUT / PATCH / DELETE with safe replay semantics |
| `operator-documented-safe-retry` | Admin-only POST; operators must not parallel-retry without reading the action |
| `dry-run-no-persist` | `dryRun=true` validation path |
| `inbound-webhook-pipeline` | External webhook verify → parse → dispatch order |
| `audit-exempt` | Documented audit-matrix exemption |
| `non-idempotent-allowlisted` | Grandfathered exception in `scripts/ci/data/mutating_route_idempotency_allowlist.txt` |

## Automation

- Report: `python scripts/ci/check_mutating_route_idempotency_posture.py`
- Drift guard (CI): `python scripts/ci/detect_mutating_route_idempotency_drift.py` — fails only on **new** unclassified routes
- Proof artifact: `mutating-route-idempotency-posture.md` from `collect-first-pilot-proof.ps1`

When adding a mutating route, classify it in code (filter, key, or `// idempotency-posture: …` comment) or update the allowlist with a one-line rationale.
