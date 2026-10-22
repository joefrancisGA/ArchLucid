---

title: "ArchLucid buyer trust and topology pack"

subtitle: "Version 2026.08.06i â€” generated from docs/architecture/architecture_handbook"

---



# Buyer front matter â€” ArchLucid platform architecture (excerpt)

**Pack:** Buyer  
**Version:** see `../VERSION`  
**Audience:** Evaluators, security reviewers, and procurement technical readers.

## What this pack is

A short, diagram-backed excerpt of how the **ArchLucid platform** is built and operated (Azure-first, authority pipeline, tenant isolation).

## What this pack is not

It is **not** a customer architecture review package produced by ArchLucid for a tenantâ€™s systems. Those come from evidence through the product authority pipeline and product exports.

## Honesty

- Production tenant isolation is **database-per-tenant** (ADR 0037). SQL Row-Level Security is **not** the production control.
- Async authority pipeline + transactional outbox is the SQL default (ADR 0038).
- CPA SOC 2 attestation and third-party pen-test publication are **owner/GTM** tracks â€” do not infer them from this pack.



# 1. System context (buyer)

ArchLucid is an Azure-first architecture authority platform: operators use the architect workspace; automation calls the versioned API; SQL holds authoritative run state; Worker drains outboxes; Azure OpenAI / Service Bus / Blob are optional depending on profile.

![System overview](../../architecture_diagrams/archlucid-system-overview.png)

![Review happy path](../../architecture_diagrams/archlucid-review-happy-path.png)



# 2. Authority pipeline (buyer)

A review request persists a run, then runs (or queues) five stagesâ€”context ingestion, knowledge graph, findings, decisioning, artifact synthesisâ€”before transactional finalize into a golden manifest and decision trace.

![Authority pipeline](../../architecture_diagrams/archlucid-authority-pipeline.png)



# 3. Tenant isolation (buyer)

**Primary control:** one product SQL catalog per tenant (`SystemWithPerTenantCatalogs`), resolved at connection time.  
**Not used in production:** SQL Row-Level Security (removed; ADR 0037).  
Defense-in-depth adds identity scope, HTTP route binding, scoped repositories, and tenant-prefixed blobs.

![Tenant isolation](../../architecture_diagrams/archlucid-tenant-isolation.png)



# 4. Security model (buyer)

Ingress via browser/CLI (optional Front Door/APIM), Entra JWT or API keys, default-deny controllers with claims policies, production-like Key Vault / managed identity, and startup safety rules (including blocking single-catalog SQL in production-like hosts).

![Security model](../../architecture_diagrams/archlucid-security-model.png)



# 5. Azure topology (buyer)

Representative hosted shape: Container Apps for Api and Worker, Azure SQL (per-tenant catalogs), optional Service Bus / Blob / Azure OpenAI, Entra ID, private endpoints and managed identity where pilots require them. Exact SKUs follow Terraform and the pilot SoW.

![Azure topology](../../architecture_diagrams/archlucid-azure-topology.png)



# Buyer references

| Need | Doc |
|------|-----|
| Full platform handbook | `docs/architecture/architecture_handbook/README.md` |
| Diagram index | `docs/architecture/architecture_diagrams/README.md` |
| ADR 0037 tenant isolation | `docs/architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md` |
| ADR 0038 outbox / durability | `docs/architecture/adrs/0038-run-durability-multi-store-outbox-production-secrets.md` |
| Trust / isolation buyer page | `docs/go-to-market/TENANT_ISOLATION.md` |
| One-page poster | `docs/ARCHITECTURE_ON_ONE_PAGE.md` |
| Handbook vs product capabilities | `docs/architecture/PLATFORM_HANDBOOK_VS_PRODUCT_CAPABILITIES.md` |



