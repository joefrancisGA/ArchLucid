> **Scope:** Security reviewer evidence packet template — controls map and honest attestation boundaries.
> **Canonical sources:** [`trust-center.md`](../../go-to-market/trust-center.md), [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../TENANT_ISOLATION_DEFENSE_IN_DEPTH.md), [`SYSTEM_THREAT_MODEL.md`](../SYSTEM_THREAT_MODEL.md).

# Evidence packet — security reviewer (template)

**Audience:** Customer security champion, vendor assessor, procurement security questionnaire responder.

**Assessment posture:** Self-assessment and architecture evidence — **not** third-party attestation unless explicitly attached and labeled.

---

## Required review artifacts

| Artifact | What it proves | Honest boundary |
| --- | --- | --- |
| [`trust-center.md`](../../go-to-market/trust-center.md) | Data handling, subprocessors, control narrative | Self-attested |
| [`SOC2_SELF_ASSESSMENT_2026.md`](../SOC2_SELF_ASSESSMENT_2026.md) | Control mapping readiness | **Not** CPA SOC 2 report — roadmap only |
| [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../TENANT_ISOLATION_DEFENSE_IN_DEPTH.md) | Database-per-tenant + optional RLS (ADR 0037) | Design intent — verify deployed config |
| [`SYSTEM_THREAT_MODEL.md`](../SYSTEM_THREAT_MODEL.md) | STRIDE coverage | Living document |
| OpenAPI buyer snapshot | API surface boundary | `buyer-contract.openapi.snapshot.json` — excludes `/v1/internal/*` |
| Staging readiness capture | Live auth/TLS/health posture | **Staging** environment — Bearer default |

## Optional (deep dive)

| Artifact | When to request |
| --- | --- |
| `production-profile-preflight.md` | Hosted production-like config review |
| `azure-iac-parity-proof.json` | Azure deployment alignment |
| `managed-identity-verification.json` | Managed identity posture |
| CodeQL / Trivy / Gitleaks CI artifacts | Supply-chain and SAST evidence from release bundle |
| Support bundle (redacted) | Incident or config triage — operator-supplied |

## Strict claim language

- **May claim:** JWT/API key auth modes; SQL tenant isolation design; audit immutability (`DENY UPDATE/DELETE` on audit); webhook HMAC option; private endpoint Terraform modules documented.
- **May not claim:** SOC 2 Type II certification, published third-party pen test, or production pen-test scope without explicit attachment.
- **Live environment:** Contract-authoritative live evidence is **Staging**, not repo-local config lint — [`RC_TARGET_ENVIRONMENT_MATRIX.md`](../../library/RC_TARGET_ENVIRONMENT_MATRIX.md).

## Questionnaire accelerators

| Standard ask | Primary doc |
| --- | --- |
| CAIQ / SIG | Procurement pack build + Trust Center |
| Tenant isolation | `TENANT_ISOLATION_DEFENSE_IN_DEPTH.md` |
| API auth | [`SECURITY.md`](../../library/contributor-reference/SECURITY.md), [`API_CONTRACTS.md`](../../library/API_CONTRACTS.md) |
| Subprocessors | Trust Center subprocessor table |

## Related

- [`PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager`](../../go-to-market/PROCUREMENT_PACK_INDEX.md#deal-ready-one-pager)
- [`evidence-packet-buyer.template.md`](../../go-to-market/templates/evidence-packet-buyer.template.md)
