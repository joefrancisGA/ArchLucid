> **Scope:** Buyer-facing — security reviewer summary of documented posture; not certification or formal attestation.

# Security reviewer one-pager (generated)

> **Not a certification.** This page summarizes current documented posture vs deferred formal assurance.

**Posture:** Self-assessed controls and documented engineering evidence — not CPA SOC 2, ISO certification, or third-party pen-test attestation today.

## Current controls (V1 evidence today)

- Tenant-scoped auth (OIDC/SAML/API key) with least-privilege operator ranks
- Append-only audit events and correlation IDs on API failures
- Config summary and config lint without returning secrets
- Policy packs and governance workflows (optional after first commit)
- DPA/SIG/CAIQ-style templates in procurement pack — templates, not legal guarantees

## Deferred / informational only (not V1 blockers)

- CPA SOC 2 Type I/II report
- Third-party penetration test publication
- No ISO or statutory certification automation in V1 (deferred)
- Live marketplace checkout as procurement gate

## We will never ask you to paste

- Production database connection strings in tickets
- API keys, SAML secrets, or Key Vault values in email
- Unredacted LLM prompts in buyer-safe attachments
- Customer-operated webhook secrets in V1 required path

## Control-to-evidence map

- [`SECURITY_CONTROL_EVIDENCE_MAP.md`](SECURITY_CONTROL_EVIDENCE_MAP.md) — control, evidence path, status, deferred boundary per row

## Source documents

- `docs/go-to-market/TRUST_CENTER.md` (Trust center narrative) — present
- `docs/security/SOC2_SELF_ASSESSMENT_2026.md` (SOC 2 self-assessment (not CPA attestation)) — present
- `docs/go-to-market/SOC2_ROADMAP.md` (SOC 2 roadmap (deferred CPA program)) — present
- `docs/library/V1_DEFERRED.md` (Explicit V1 deferrals) — present
