# What ArchLucid does with your data

Data flow, tenant isolation, audit trail, and portability for architecture review evidence.

## What ArchLucid does {#what-archlucid-does}

ArchLucid takes your architecture brief and optional evidence context, applies policy packs, and produces a **governed architecture package** with findings, decisions, a **signed review record**, and an audit trail. ArchLucid does not execute code in your environment and does not require write access to your systems.

For the end-to-end product workflow, see [How ArchLucid works](/help/how-it-works).

## What leaves your tenant {#what-leaves-your-tenant}

Architecture brief text and evidence context you provide may be sent to the **configured model provider** for the workspace to produce review outputs. When configured, review evidence may be processed by the approved AI provider for the workspace, such as Azure OpenAI.

ArchLucid does not send source code repositories, secrets, or credentials as part of the standard review intake path. Review your customer-approved AI endpoint data processing terms for inference retention and subprocessors.

## What stays in your tenant {#what-stays-in-your-tenant}

All findings, signed review records, decisions, governance approvals, and audit log entries are stored in your ArchLucid tenant database. ArchLucid does not retain copies outside your tenant boundary for product analytics on governed review content.

## What ArchLucid does not collect

ArchLucid is not designed to ingest production secrets, credentials, or privileged access tokens through the standard architecture review intake path. Optional cloud connectors use read-only roles scoped to evidence collection — not administrative control of your cloud estate.

## Isolation {#isolation}

Each customer tenant uses a dedicated database catalog. Tenant identity is decided at the host boundary, and API requests carry a tenant scope that the data layer enforces on tenant-facing queries — that is the standard customer path, not a claim that every staff or platform surface is free of cross-tenant aggregation. For isolation and assurance detail, see [Security and trust](/help/security-trust). For the shorter data-flow overview, see [Data handling](/help/data-handling). Append-only audit logging records every governed action within your tenant.

## Audit trail {#audit-trail}

Every inference that contributed to a finding can be traced through the append-only audit log and evidence trail — you can see what input produced each output.

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

## Related topics

- [How ArchLucid works](/help/how-it-works) — product workflow from evidence to exports
- [Security and trust](/help/security-trust) — assurance materials and diligence support
- [Data handling and tenant isolation](/help/data-handling-tenant-isolation) — three-layer isolation deep-dive
- [Trust Center](/trust) — public evidence downloads and procurement posture
- [Audit trail](/help/audit-trail) — immutable events and export posture
- [Subprocessors](/help/subprocessors) — hosted processing partners and residency notes
- [DPA template](/help/dpa-template) — data processing agreement starting point
- [Procurement FAQ](/help/procurement) — security and residency questionnaire answers
- [Data handling](/help/data-handling) — shorter data-flow overview
