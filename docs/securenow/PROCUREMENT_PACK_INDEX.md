> **Scope:** SecureNow procurement evidence index for a controlled-pilot conversation. Not an approved customer offer, not a public list price, and not a product certification.

# SecureNow procurement evidence pack — buyer index

**Audience:** Security, procurement, and GRC reviewers evaluating SecureNow (Azure path and evidence analysis), not the ArchLucid architecture-review product line.

**Last reviewed:** 2026-10-29 (UTC)

**How to cite:** Use the **Status** and **Evidence Type** columns as buyer-safe labels only. They are not attestations. For platform-wide controls shared with ArchLucid, read the linked file and do not treat it as a SecureNow-specific certification. Architecture-review diligence still uses [`../go-to-market/PROCUREMENT_PACK_INDEX.md`](../go-to-market/PROCUREMENT_PACK_INDEX.md).

## Procurement artifact status map (buyer-safe classification)

Labels are **not** attestations. **Template** means legal or owner execution is still required. **Deferred** items follow [`../library/V1_DEFERRED.md`](../library/V1_DEFERRED.md).

### SecureNow-specific

| Procurement Artifact | Status | Source File | Notes |
| --- | --- | --- | --- |
| Controlled pilot proposal | Template | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) | Internal proposal only; beta remains **NO_GO**; owner checklist unchecked — not an approved customer offer. |
| Beta evidence gate (22 requirements) | Self-attested | [BETA_EVIDENCE_GATE.md](BETA_EVIDENCE_GATE.md) | Matrix rows stay **UNKNOWN** until a PASS row records `test_command`, `result_reference`, and `commit_sha`; do not treat CI smoke as production proof. |
| Marketplace prepublication contract | Template | [MARKETPLACE_PREPUBLICATION_CONTRACT.md](MARKETPLACE_PREPUBLICATION_CONTRACT.md) | **HOLD_NO_PUBLICATION**; an ArchLucid Marketplace subscription is **not** a SecureNow entitlement; live billing stays off. |
| Private quote sheet | Self-attested | [PRIVATE_PRICE_SHEET.md](PRIVATE_PRICE_SHEET.md) | Owner-approved fees only; **not a public list price** and not a customer offer; fee table stays in the source file only. |
| Support commitment | Self-attested | [SUPPORT_COMMITMENT.md](SUPPORT_COMMITMENT.md) | Founder acknowledgement targets only; **not** a contractual SLA and **not** service credits. |
| Executive proof packet | Template | [EXECUTIVE_PROOF_PACKET_TEMPLATE.md](EXECUTIVE_PROOF_PACKET_TEMPLATE.md) | Template only; populate with real evidence and human review before any sponsor share. |
| Buyer demonstration script | Self-attested | [BUYER_PROOF_DEMO.md](BUYER_PROOF_DEMO.md) | Fixture or synthetic demonstration is **not** customer evidence. |
| In-tenant collection agent (ADR 0103) | Implemented | [../architecture/adrs/0103-securenow-in-tenant-collection-agent.md](../architecture/adrs/0103-securenow-in-tenant-collection-agent.md) | Accepted architecture decision; not proof of a live customer deployment. |
| In-tenant deployment (ADR 0104) | Implemented | [../architecture/adrs/0104-securenow-in-tenant-deployment.md](../architecture/adrs/0104-securenow-in-tenant-deployment.md) | Accepted architecture decision; not proof of a live customer deployment. |
| In-tenant Terraform root (engineering) | Self-attested | [../../infra/terraform-securenow-in-tenant/README.md](../../infra/terraform-securenow-in-tenant/README.md) | Engineering description of a customer-operated deployment option; not a deployed tenant attestation. |

### Platform-shared (do not treat as a SecureNow certification)

| Procurement Artifact | Status | Source File | Notes |
| --- | --- | --- | --- |
| Data Processing Agreement (DPA) | Template | [../go-to-market/DPA_TEMPLATE.md](../go-to-market/DPA_TEMPLATE.md) | Platform template until executed under customer legal review; SecureNow pilot terms remain **TO BE NEGOTIATED** in the controlled pilot proposal. |
| SOC 2 procurement status statement | Self-attested | [../go-to-market/SOC2_STATUS_PROCUREMENT.md](../go-to-market/SOC2_STATUS_PROCUREMENT.md) | Honest platform posture; confirms **no** CPA-issued SOC 2 Type II report in this repository today. |
| Tenant isolation (database-per-tenant) | Implemented | [../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | ADR 0037 adopted for the platform; SQL RLS is not used in production. |
| Trust Center (platform index) | Self-attested | [../go-to-market/trust-center.md](../go-to-market/trust-center.md) | Platform security and procurement index; **not** a SecureNow product offer or transactable listing. |

## Evidence artifacts — SecureNow-specific

| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |
| --- | --- | --- | --- | --- |
| Controlled pilot scope and acceptance | Self-asserted | 2026-10-29 | [CONTROLLED_PILOT_OFFER.md](CONTROLLED_PILOT_OFFER.md) | Describes qualification, milestones, and honest objection responses; explicitly **not** an approved offer while beta is **NO_GO**. |
| Beta release evidence matrix | Self-asserted | 2026-10-29 | [BETA_EVIDENCE_GATE.md](BETA_EVIDENCE_GATE.md) | Offline gate; strict mode stays **NO_GO** until all requirements have observed PASS provenance. |
| Marketplace hold and entitlement boundary | Self-asserted | 2026-10-29 | [MARKETPLACE_PREPUBLICATION_CONTRACT.md](MARKETPLACE_PREPUBLICATION_CONTRACT.md) | Documents fail-closed future entitlement rules; does not authorize Partner Center publication. |
| Private fee identity (internal) | Self-asserted | 2026-10-29 | [PRIVATE_PRICE_SHEET.md](PRIVATE_PRICE_SHEET.md) | Records owner-approved quote IDs and payout identity; does not enable billing or a public list price. |
| Founder support acknowledgement targets | Self-asserted | 2026-10-29 | [SUPPORT_COMMITMENT.md](SUPPORT_COMMITMENT.md) | Weekday Eastern business-hour acknowledgement targets; not a contractual SLA. |
| Buyer demo and proof discipline | Self-asserted | 2026-10-29 | [BUYER_PROOF_DEMO.md](BUYER_PROOF_DEMO.md) | Scripted evaluation path; synthetic results are **not** customer evidence. |
| Collection agent architecture | Implemented | 2026-10-29 | [../architecture/adrs/0103-securenow-in-tenant-collection-agent.md](../architecture/adrs/0103-securenow-in-tenant-collection-agent.md) | Reader handoff and blob ingest design accepted; customer must still authorize collection scope. |
| In-tenant hosting architecture | Implemented | 2026-10-29 | [../architecture/adrs/0104-securenow-in-tenant-deployment.md](../architecture/adrs/0104-securenow-in-tenant-deployment.md) | Private data-plane deployment pattern accepted; not a guarantee that every pilot uses this root. |

## Evidence artifacts — Platform-shared

| Evidence Artifact | Evidence Type | Last Reviewed UTC | Source File | Buyer-safe Claim |
| --- | --- | --- | --- | --- |
| DPA template | Self-asserted | 2026-10-29 | [../go-to-market/DPA_TEMPLATE.md](../go-to-market/DPA_TEMPLATE.md) | Template wording only until executed; applies to the platform vendor relationship, not a finished SecureNow order form. |
| SOC 2 procurement statement | Self-asserted | 2026-10-29 | [../go-to-market/SOC2_STATUS_PROCUREMENT.md](../go-to-market/SOC2_STATUS_PROCUREMENT.md) | States that a CPA-issued SOC 2 report is not claimed; points to self-assessment and roadmap elsewhere. |
| Tenant isolation ADR | Implemented | 2026-10-29 | [../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | Database-per-tenant catalogs and app-layer scope predicates; do not cite SQL RLS as deployed. |
| Trust Center index | Self-asserted | 2026-10-29 | [../go-to-market/trust-center.md](../go-to-market/trust-center.md) | Central platform index; SecureNow buyers still need this SecureNow index for product-line scope and hold posture. |

## What this index does not authorize

- A beta **GO**, a public price, Marketplace **Published** status, or live billing.
- Checking the owner release checklist in the controlled pilot proposal.
- Implying CPA SOC 2 attestation, ISO 27001 certification, or a completed third-party penetration test for SecureNow.
