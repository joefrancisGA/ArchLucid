> **Scope:** SecureNow answer overlay for security questionnaires. Not a completed SIG or CAIQ. Not an approved customer offer. SecureNow beta remains **NO_GO**.

# SecureNow procurement response overlay

Use [`../go-to-market/PROCUREMENT_PACK_INDEX.md`](../go-to-market/PROCUREMENT_PACK_INDEX.md) for platform-wide controls on the ArchLucid vendor relationship. Use this table only where the SecureNow product-line answer differs from architecture-review diligence.

**Last reviewed:** 2026-10-29 (UTC)

| Theme | Question | Answer | Source |
| --- | --- | --- | --- |
| Azure write scope | Does SecureNow change Azure resources? | No. SecureNow does not apply ARM or Terraform changes. Engineers change Azure **outside** SecureNow under customer change control. | [Controlled pilot proposal](CONTROLLED_PILOT_OFFER.md) |
| Path vs exploit | Does a ranked path prove an attacker used it? | No. Paths combine observed configuration, deterministic inference, and labeled uncertainty. They do not prove an **observed exploit**. | [Buyer demonstration script](BUYER_PROOF_DEMO.md) |
| SOC 2 | What SOC 2 report is included for SecureNow? | No CPA-issued SOC 2 Type II report is included for SecureNow. Platform status is self-attested only; do not treat this overlay as SOC 2 certification. | [SOC 2 procurement status](../go-to-market/SOC2_STATUS_PROCUREMENT.md) |
| Third-party pen test | Has SecureNow completed a third-party penetration test? | Do not claim a published third-party pen test for SecureNow. An organizational vendor program is deferred per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) section 6c. | [V1 deferred scope](../library/V1_DEFERRED.md) |
| Data collected | What data does SecureNow collect? | Tenant-authorized Azure **Reader** inventory or an approved upload within agreed subscription scope. | [Procurement pack index](PROCUREMENT_PACK_INDEX.md) |
| Partial collection | How are collection gaps shown? | Partial or missing collection stays visible. The product does not imply a clean status when evidence is incomplete. | [Beta evidence gate](BETA_EVIDENCE_GATE.md) |
| Tenant isolation | How is tenant data isolated? | Database-per-tenant catalogs and app-layer scope per ADR 0037. Do not describe SQL row-level security as a deployed production control. | [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) |
| Product entitlement | Does an ArchLucid subscription include SecureNow? | No. An ArchLucid architecture-review Marketplace or subscription success is **not** SecureNow access. SecureNow commerce remains **HOLD**. | [Marketplace prepublication contract](MARKETPLACE_PREPUBLICATION_CONTRACT.md) |
| Retention and exit | What are retention and exit terms for SecureNow? | Controlled-pilot retention and exit are **TO BE NEGOTIATED** in the pilot proposal. The platform DPA is a **template** until executed under customer legal review. | [DPA template](../go-to-market/DPA_TEMPLATE.md) |
| Support vs SLA | What support SLA does SecureNow provide? | Founder acknowledgement targets are **not** a contractual SLA and **not** service credits. Contractual SLA requires a executed order form. | [Support commitment](SUPPORT_COMMITMENT.md) |
| Price | What is the public list price? | There is no public list price. Owner-approved fees live in a private quote sheet only; that sheet is **not** a customer offer. | [Private quote sheet](PRIVATE_PRICE_SHEET.md) |
| Marketplace | Can we buy SecureNow on Azure Marketplace today? | No. Status is **HOLD_NO_PUBLICATION**; live billing and Partner Center publication stay off. | [Marketplace prepublication contract](MARKETPLACE_PREPUBLICATION_CONTRACT.md) |
| In-tenant deployment | Can SecureNow run in our tenant? | An in-tenant deployment pattern is documented in ADR 0104 and the Terraform root README as engineering design, not proof that your tenant is already deployed. | [ADR 0104](../architecture/adrs/0104-securenow-in-tenant-deployment.md) |
| Verification | When is a remediation labeled verified? | Requires a later successful capture, chronology, completed analysis, and substantive postcondition. Otherwise label **NOT VERIFIED** or insufficient evidence. | [Executive proof packet template](EXECUTIVE_PROOF_PACKET_TEMPLATE.md) |
| Synthetic demo | Can a demo script count as customer evidence? | No. A fixture or synthetic demonstration is **not** customer evidence. | [Buyer demonstration script](BUYER_PROOF_DEMO.md) |
| Beta release | Is SecureNow generally available? | Beta remains **NO_GO** until the 22-row evidence gate and owner checklist are cleared with observed PASS provenance. Do not mark matrix rows PASS from this overlay. | [Beta evidence gate](BETA_EVIDENCE_GATE.md) |
| Subprocessors | Who are subprocessors? | Use the platform subprocessors register; customer policy still applies to SecureNow pilots. | [Subprocessors](../go-to-market/SUBPROCESSORS.md) |
| Identity | What identity provider does SecureNow use? | Customers use their existing Microsoft Entra tenant; the product binds work to tenant, workspace, and project scope. SecureNow does not replace customer IdP. | [Controlled pilot proposal](CONTROLLED_PILOT_OFFER.md) |
| Security contact | How do we report a vulnerability? | Route coordinated disclosure through **security@archlucid.net** and the platform security.txt path. No separate SecureNow-only mailbox. | [Trust Center](../go-to-market/trust-center.md) |
| Breach warranty | Does SecureNow guarantee breach prevention? | No breach-prevention warranty. SecureNow prioritizes evidence-linked path clarity, not guaranteed breach avoidance. | [Controlled pilot objection table](CONTROLLED_PILOT_OFFER.md) |

## How to use this overlay

Copy the **Answer** column into your spreadsheet and attach the linked **Source** file for diligence. This overlay does not replace legal review, executed contracts, or an approved customer offer.
