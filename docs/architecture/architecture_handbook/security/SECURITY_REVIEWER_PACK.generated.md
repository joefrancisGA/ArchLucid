---

title: "ArchLucid security reviewer pack"

subtitle: "Version 2026.08.06i â€” generated from docs/architecture/architecture_handbook"

---



# Security reviewer front matter â€” ArchLucid platform architecture (excerpt)

**Pack:** Security  
**Version:** see `../VERSION`  
**Audience:** InfoSec, risk, and technical security reviewers evaluating the **ArchLucid platform**.

## What this pack is

A short, diagram-backed security excerpt: tenancy, identity, secrets, ingress threats (Ask/RAG and webhooks), content safety, rate limits, commit segregation of duties, audit, and compliance honesty.

## What this pack is not

- Not a customer architecture review package produced by ArchLucid for a tenantâ€™s systems.
- Not a CPA SOC 2 report or a published third-party penetration-test summary.
- Not the full platform handbook (DbUp, CI lanes, Polly defaults, every hosted service).

## Honesty

- Production tenant isolation is **database-per-tenant** (ADR 0037). SQL Row-Level Security is **not** the production control.
- Async authority pipeline + transactional outbox is the SQL default (ADR 0038).
- CPA SOC 2 attestation (**G-REAL-05**) and third-party pen-test publication (**G-ASSURANCE-02**) remain **owner/GTM** tracks â€” do not infer them from this pack.
- Content safety and prompt-injection controls reduce risk; they do **not** claim â€œinjection-proof.â€



# 1. System context (security)

ArchLucid is an Azure-first architecture authority platform. Operators use the architect workspace; automation calls the versioned API; SQL holds authoritative run state; Worker drains outboxes. Security review starts from this boundary picture, then zooms into controls below.

![System overview](../../architecture_diagrams/archlucid-system-overview.png)



# 2. Tenant isolation (security)

**Primary control:** one product SQL catalog per tenant (`SystemWithPerTenantCatalogs`), resolved at connection time.  
**Not used in production:** SQL Row-Level Security (removed; ADR 0037).  
Defense-in-depth adds identity scope, HTTP route binding, scoped repositories, and tenant-prefixed blobs.

![Tenant isolation](../../architecture_diagrams/archlucid-tenant-isolation.png)



# 3. Security model (security)

Ingress via browser/CLI (optional Front Door/APIM), Entra JWT or API keys, default-deny controllers with claims policies, production-like Key Vault / managed identity, and startup safety rules (including blocking single-catalog SQL in production-like hosts).

![Security model](../../architecture_diagrams/archlucid-security-model.png)



# 4. Entra role claims (security)

Entra (or generic OIDC) app roles and SAML attributes are normalized onto `ArchLucidRoles` plus fine-grained `permission` claims. Role sources, Architect/Reviewer aliases, and token diagnostics sit behind the authn-route matrix.

![Entra role claims](../../architecture_diagrams/archlucid-entra-role-claims.png)



# 5. Secrets and Key Vault (security)

Runtime secrets resolve only through `ISecretProvider` (Key Vault or environment, optionally composed). ITSM and Teams store Key Vault *secret names*, not raw credentials. Hosted pilots emit Key Vault references from stack generation.

![Secrets Key Vault resolution](../../architecture_diagrams/archlucid-secrets-keyvault-resolution.png)



# 6. Threat model â€” Ask / RAG (security)

Ask and retrieval paths must preserve tenant scope on embeddings, retrieval, and answer grounding. Treat this diagram as the primary cross-tenant and prompt-abuse surface for conversational featuresâ€”not a claim that every RAG risk is closed.

![Threat Ask RAG](../../architecture_diagrams/archlucid-threat-ask-rag.png)



# 7. Threat model â€” webhooks (security)

Outbound and inbound webhook surfaces use HMAC/CloudEvents envelopes, shared-secret handling, and dry-run probes where enabled. Reviewers should separate **outbound delivery** (customer HTTP / Service Bus) from **inbound** abuse assumptions.

![Threat webhooks](../../architecture_diagrams/archlucid-threat-webhooks.png)



# 8. Content safety ingress (security)

Ingress precheck on create-run, Azure AI Content Safety on completion I/O, evidence sanitizers, and prompt redaction form a layered trust boundary. Health probes and regression datasets support the posture without claiming injection-proof.

![Content safety ingress](../../architecture_diagrams/archlucid-content-safety-ingress.png)



# 9. Rate limiting (security)

ASP.NET rate policies gate fixed, expensive authority, replay, bulk evidence, OTP, and policy-pack dry-run surfaces with role/IP/tenant partitions. Quick Scan identity abuse is a separate admit gate that can also return rate-limited outcomes.

![Rate limiting throttling](../../architecture_diagrams/archlucid-rate-limiting-throttling.png)



# 10. Manifest commit segregation of duties (security)

Finalize runs through an optional pre-commit gate plus SoD that compares Entra-oid actor keys (not display names), blocking self-approval. This is submitterâ‰ approver on approval requestsâ€”not a blanket â€œevery pack blocks commitâ€ rule.

![Manifest commit SoD](../../architecture_diagrams/archlucid-manifest-commit-sod.png)



# 11. Audit event catalog (security)

Durable operator and pipeline forensics centralize in `AuditEventTypes` â†’ `dbo.AuditEvents`, spanning authority, governance, drafts, notifications, and product-learning signals, with hot-path list shapes and collision tests.

![Audit event catalog](../../architecture_diagrams/archlucid-audit-event-catalog.png)



# 12. Compliance claim honesty (security)

Trust-center and buyer-facing language must not imply a CPA-issued SOC 2 report or a published third-party pen-test summary unless those artifacts exist. Engineering TB rows for program kickoff may be Done while GTM owner execution remains open.

![Compliance claim honesty](../../architecture_diagrams/archlucid-compliance-claim-honesty.png)



# Security reviewer references

| Need | Doc |
|------|-----|
| Full platform handbook | `docs/architecture/architecture_handbook/README.md` |
| Buyer trust / topology pack | `docs/architecture/architecture_handbook/buyer/` |
| Diagram index | `docs/architecture/architecture_diagrams/README.md` |
| ADR 0034 SoD actor keys | `docs/architecture/adrs/0034-segregation-of-duties-entra-oid-actor-keys.md` |
| ADR 0037 tenant isolation | `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md` |
| ADR 0038 outbox / production secrets | `docs/architecture/adrs/0038-run-durability-multi-store-outbox-production-secrets.md` |
| ADR 0061 DDoS / rate posture | `docs/architecture/adrs/0061-ddos-protection-posture-v1.md` |
| Trust / isolation buyer page | `docs/go-to-market/TENANT_ISOLATION.md` |
| Handbook vs product capabilities | `docs/architecture/PLATFORM_HANDBOOK_VS_PRODUCT_CAPABILITIES.md` |



