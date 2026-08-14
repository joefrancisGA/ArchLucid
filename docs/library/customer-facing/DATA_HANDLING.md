# Data handling and tenant isolation

## What ArchLucid does {#what-archlucid-does}

ArchLucid takes your architecture brief and optional evidence context, applies policy packs, and produces a **governed architecture package** with findings, decisions, a **sealed review record**, and an audit trail. ArchLucid does not execute code in your environment and does not require write access to your systems.

For the end-to-end product workflow, see [How ArchLucid works](/help/getting-started#how-archlucid-works).

## What leaves your tenant {#what-leaves-your-tenant}

Architecture brief text and evidence context you provide may be sent to the **configured model provider** for the workspace to produce review outputs. When configured, review evidence may be processed by the approved AI provider for the workspace, such as Azure OpenAI.

ArchLucid does not send source code repositories, secrets, or credentials as part of the standard review intake path. Review your customer-approved AI endpoint data processing terms for inference retention and subprocessors.

## What stays in your tenant {#what-stays-in-your-tenant}

All findings, sealed review records, decisions, governance approvals, and audit log entries are stored in your ArchLucid tenant database. ArchLucid does not retain copies outside your tenant boundary for product analytics on governed review content.

## Data residency {#data-residency}

Hosted ArchLucid runs on vendor-hosted Azure workloads. Primary processing regions follow the contracted Azure regions and private-connectivity setup negotiated at onboarding — confirm residency in your order or security diligence pack, not from in-product region pickers alone.

## What ArchLucid does not collect

ArchLucid is not designed to ingest production secrets, credentials, or privileged access tokens through the standard architecture review intake path. Optional cloud connectors use read-only roles scoped to evidence collection — not administrative control of your cloud estate.

## Isolation {#isolation}

Three layers of protection govern tenant isolation — database-per-tenant is the **blast-radius** control, not the only control.

1. **Request layer** — Tenant identity is resolved at the host boundary (authenticated claims or explicit ambient job scope). API requests carry a tenant scope; production-like hosts reject unbound or header-only scope for protected routes. ([Security and trust](/help/security-trust))
2. **Application layer** — Authorization and scoped data access enforce that handlers and repositories operate inside the resolved tenant. A named inventory of authorization-boundary tests exercises IDOR and cross-tenant request paths; compromising a single handler without the correct scope does not grant another tenant's catalog. ([Security and trust](/help/security-trust))
3. **Data layer** — Each customer tenant uses a dedicated database catalog. That catalog boundary is the primary isolation mechanism for paying-client data. Where any shared platform tables exist, they are classified and must not hold another tenant's review content as a substitute for catalog isolation. SQL row-level security is not the production isolation boundary. ([Subprocessors](/help/subprocessors) · [DPA template](/help/dpa-template))
4. **What a single-layer compromise does not give an attacker** — A bug that omits a within-tenant filter does not cross paying-client catalogs when routing is correct. Possession of one tenant's database credentials does not unlock another tenant's catalog. Token theft is limited by claim-bound scope checks on subsequent requests. ([Security and trust](/help/security-trust))

Tenant identity is decided at the host boundary, and API requests carry a tenant scope that the data layer enforces on tenant-facing queries — that is the standard customer path, not a claim that every staff or platform surface is free of cross-tenant aggregation. For isolation and assurance detail, see [Security and trust](/help/security-trust). Append-only audit logging records every governed action within your tenant.

## Audit trail {#audit-trail}

Every inference that contributed to a finding can be traced through the append-only audit log and evidence trail — you can see what input produced each output. Open the [audit trail](/governance/audit) in your tenant governance workspace.

## Cloud connectors are optional

You can complete reviews using uploaded evidence only. Azure, AWS, and GCP connectors are optional read-only integrations configured only for platforms relevant to the workspace.

## AI provider handling

Review outputs may use the workspace's approved AI provider or customer-approved AI endpoint when configured. Model routing, retention, and subprocessors depend on your plan and provider configuration — confirm details during security diligence.

## Demo and sample data

Demo and evaluation workspaces use sample architecture data so evaluators can inspect findings, evidence trails, and exports without uploading customer production data.

## Data portability

Download an export bundle from any finalized architecture package at any time. You own the artifacts in your tenant.

## Export and deletion posture

Finalized architecture packages support exportable governance artifacts for sponsors and audit. Tenant data lifecycle, retention, and deletion requests are handled according to your agreement and the security review process — contact your administrator or ArchLucid support for workspace-specific posture.

## Related topics {#related-topics}

- [How ArchLucid works](/help/getting-started#how-archlucid-works) — product workflow from evidence to exports
- [Security and trust](/help/security-trust) — assurance materials and diligence support
- [Trust Center](/trust) — public evidence downloads and procurement posture
- [Audit trail](/help/audit-trail) — immutable events and export posture
- [Subprocessors](/help/subprocessors) — hosted processing partners and residency notes
- [DPA template](/help/dpa-template) — data processing agreement starting point
- [Procurement FAQ](/help/procurement) — security and residency questionnaire answers
