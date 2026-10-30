> **Scope:** SecureNow questionnaire crosswalk. Not a completed SIG or CAIQ. Not an approved customer offer. SecureNow beta remains **NO_GO**.

# SecureNow questionnaire crosswalk

Shared controls stay in the ArchLucid buyer security packet. This table only routes the question.

**Last reviewed:** 2026-10-30 (UTC)

| Theme | Where the shared answer lives | SecureNow difference | Paste this |
| --- | --- | --- | --- |
| Azure write scope | [Controlled pilot proposal](CONTROLLED_PILOT_OFFER.md) | SecureNow-specific | No. SecureNow does not apply ARM or Terraform changes. Engineers change Azure **outside** SecureNow under customer change control. |
| Path vs exploit | [Buyer demonstration script](BUYER_PROOF_DEMO.md) | SecureNow-specific | No. Paths combine observed configuration, deterministic inference, and labeled uncertainty. They do not prove an **observed exploit**. |
| SOC 2 report | [SOC 2 procurement status](../go-to-market/SOC2_STATUS_PROCUREMENT.md) | Same honesty; SecureNow adds no CPA report | No CPA-issued SOC 2 Type II report is included for SecureNow. Platform status is self-attested only; do not treat this overlay as SOC 2 certification. |
| Third-party pen test | [V1 deferred scope](../library/V1_DEFERRED.md) | SecureNow-specific deferral | Do not claim a published third-party pen test for SecureNow. An organizational vendor program is deferred per section 6c. |
| Data collected | [Procurement pack index](PROCUREMENT_PACK_INDEX.md) | SecureNow-specific | Tenant-authorized Azure **Reader** inventory or an approved upload within agreed subscription scope. |
| Partial collection | [Beta evidence gate](BETA_EVIDENCE_GATE.md) | SecureNow-specific | Partial or missing collection stays visible. The product does not imply a clean status when evidence is incomplete. |
| Tenant isolation | [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) | Same platform control | Database-per-tenant catalogs and app-layer scope per ADR 0037. Do not describe SQL row-level security as a deployed production control. |
| Product entitlement | [Marketplace prepublication contract](MARKETPLACE_PREPUBLICATION_CONTRACT.md) | SecureNow-specific | No. An ArchLucid architecture-review Marketplace or subscription success is **not** SecureNow access. SecureNow commerce remains **HOLD**. |
| Retention and exit | [Data-processing schedule](DATA_PROCESSING_SCHEDULE.md) | SecureNow pilot blanks | Controlled-pilot retention and exit are **TO BE NEGOTIATED** in the pilot proposal. The platform DPA is a **template** until executed under customer legal review. |
| Support vs SLA | [Support commitment](SUPPORT_COMMITMENT.md) | SecureNow-specific | Founder acknowledgement targets are **not** a contractual SLA and **not** service credits. Contractual SLA requires an executed order form. |
| Public list price | [Private quote sheet](PRIVATE_PRICE_SHEET.md) | SecureNow-specific | There is no public list price. Owner-approved fees live in a private quote sheet only; that sheet is **not** a customer offer. |
| Marketplace purchase | [Marketplace prepublication contract](MARKETPLACE_PREPUBLICATION_CONTRACT.md) | SecureNow-specific | No. Status is **HOLD_NO_PUBLICATION**; live billing and Partner Center publication stay off. |
| In-tenant deployment | [ADR 0104](../architecture/adrs/0104-securenow-in-tenant-deployment.md) | SecureNow-specific | An in-tenant deployment pattern is documented in ADR 0104 and the Terraform root README as engineering design, not proof that your tenant is already deployed. |
| Verification label | [Executive proof packet template](EXECUTIVE_PROOF_PACKET_TEMPLATE.md) | SecureNow-specific | Requires a later successful capture, chronology, completed analysis, and substantive postcondition. Otherwise label **NOT VERIFIED** or insufficient evidence. |
| Synthetic demo | [Buyer demonstration script](BUYER_PROOF_DEMO.md) | SecureNow-specific | No. A fixture or synthetic demonstration is **not** customer evidence. |
| Beta / GA status | [Beta evidence gate](BETA_EVIDENCE_GATE.md) | SecureNow-specific | Beta remains **NO_GO** until the 22-row evidence gate and owner checklist are cleared with observed PASS provenance. |
| Subprocessors | [Subprocessors delta](SUBPROCESSORS_DELTA.md) | SecureNow reading of platform register | Use the platform subprocessors register via the SecureNow delta; customer policy still applies to SecureNow pilots. The register that changes remains [`SUBPROCESSORS.md`](../go-to-market/SUBPROCESSORS.md). |
| Identity / IdP | [Buyer security packet — isolation one-pager](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md) | Same as platform plus Entra binding | Customers use their existing Microsoft Entra tenant; the product binds work to tenant, workspace, and project scope. SecureNow does not replace customer IdP. |
| Vulnerability report | [Trust Center](../go-to-market/trust-center.md) | Same contact path | Route coordinated disclosure through **security@archlucid.net** and the platform security.txt path. No separate SecureNow-only mailbox. |
| Breach warranty | [Controlled pilot proposal](CONTROLLED_PILOT_OFFER.md) | SecureNow-specific | No breach-prevention warranty. SecureNow prioritizes evidence-linked path clarity, not guaranteed breach avoidance. |
| Identity binding (production) | [Buyer security packet](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md) | Same as platform | Authenticated identity binds tenant and workspace scope; forged scope headers do not override production-like hosts. |
| DPA / processor terms | [DPA template](../go-to-market/DPA_TEMPLATE.md) | Platform template until executed | Platform DPA template applies to the vendor relationship; SecureNow pilot retention and exit remain **TO BE NEGOTIATED** until an order form is executed. |
| Subprocessor list (platform) | [Subprocessors](../go-to-market/SUBPROCESSORS.md) | SecureNow delta for hosting mode | See [`SUBPROCESSORS_DELTA.md`](SUBPROCESSORS_DELTA.md) for which register rows apply to hosted vs in-tenant SecureNow. |
| ISO 27001 certification | [SOC 2 procurement status](../go-to-market/SOC2_STATUS_PROCUREMENT.md) | Refused claim | Do not claim ISO 27001 certification for SecureNow from this repository. |
| Data processing exhibit | [Data-processing schedule](DATA_PROCESSING_SCHEDULE.md) | SecureNow template exhibit | Template schedule only — not an executed DPA. Blanks remain where the pilot offer has no agreed term. |
| Vendor setup cover | [Quote cover](QUOTE_COVER.md) | SKU ids without fees | **NOT AN APPROVED CUSTOMER OFFER.** Names SN-EVAL, SN-ANNUAL, SN-SUB-ADD, and SN-SNAP-4 without publishing fees. |

## How to use

Copy the **Paste this** column into your spreadsheet and attach the linked file in **Where the shared answer lives** or **SecureNow difference**. This crosswalk is **not a completed SIG or CAIQ** and does not replace legal review, executed contracts, or an approved customer offer.
