> **Scope:** SecureNow data-processing schedule for negotiation. Template only. Not an executed DPA. Not an approved customer offer. SecureNow beta remains **NO_GO**.

# SecureNow data-processing schedule

**Audience:** Customer legal, privacy, and security reviewers redlining a controlled-pilot or order-form exhibit.

**Last reviewed:** 2026-10-30 (UTC)

## Status

This schedule is **Template**. It does not execute [`../go-to-market/DPA_TEMPLATE.md`](../go-to-market/DPA_TEMPLATE.md). It does not check the owner checklist in [`CONTROLLED_PILOT_OFFER.md`](CONTROLLED_PILOT_OFFER.md). SecureNow beta remains **NO_GO**.

## Two hosting modes

SecureNow hosting is configured per [ADR 0104](../architecture/adrs/0104-securenow-in-tenant-deployment.md):

| Mode | Where processing runs | Vendor relationship |
| --- | --- | --- |
| **ArchLucidHosted** | The shared multi-tenant platform host described in the platform DPA template | Negotiate under the platform [`DPA template`](../go-to-market/DPA_TEMPLATE.md) for the ArchLucid vendor relationship. |
| **InTenant** | API, background worker, and operator UI in the **customer Azure subscription** per ADR 0104 | Accepted engineering design only — not proof that your organization has deployed this root. Customer-operated Azure resources in the subscription are not described here as ArchLucid subprocessors. |

This repository does not state which party is **controller** or **processor** for each mode. That role assignment is **not stated in this repository** and belongs in executed legal documents.

## Data categories

SecureNow analysis uses only categories already described in the buyer brief and collection ADR:

| Category | Description |
| --- | --- |
| Azure Reader inventory | Tenant-authorized Azure **Reader** collection or an **approved upload** within mutually agreed subscription scope ([ADR 0103](../architecture/adrs/0103-securenow-in-tenant-collection-agent.md)). |
| Derived path and evidence artifacts | Configuration snapshots, inferred access paths, advisory cut points, and labeled verification state produced inside SecureNow. |
| Operator identity | Microsoft Entra identifiers and role bindings already used to sign in — same class as platform **identity and access** personal data in DPA section 4, when the hosted mode applies. |

This schedule does not add customer document stores, secrets vault contents, or Defender alert streams unless your pilot scope explicitly includes them in a signed order form.

## What does not happen

SecureNow does not apply ARM, Terraform, or other Azure mutations. Engineers apply remediation outside SecureNow under customer change control. The product never performs autonomous remediation and never confirms an observed exploit as a product outcome.

## Region

Per [`SUBPROCESSORS.md`](../go-to-market/SUBPROCESSORS.md) **Data residency**, production deployments are **Azure-region scoped**; the primary region is selected when infrastructure is provisioned — confirm in the order form or security pack.

For **InTenant** mode, the customer subscription boundary named in ADR 0104 is the deployment scope. This repository does not publish a single public primary production city for SecureNow.

## Retention and exit

Controlled-pilot **retention and exit are TO BE NEGOTIATED** in [`CONTROLLED_PILOT_OFFER.md`](CONTROLLED_PILOT_OFFER.md).

The platform DPA template section 9 states that after termination the processor deletes customer data within **90 days** except where retention is required by law or documented backup cycles. That **90 days** figure is a **platform template, not a SecureNow order**. Do not treat it as an agreed SecureNow pilot term until legal executes an order form or DPA.

## Blanks for legal

| Blank | Why it is blank | Where a lawyer looks |
| --- | --- | --- |
| `<<pilot duration>>` | Duration is **TO BE NEGOTIATED** in the controlled pilot proposal. | [`CONTROLLED_PILOT_OFFER.md`](CONTROLLED_PILOT_OFFER.md) |
| `<<controller/processor roles per hosting mode>>` | Not stated in this repository. | Executed DPA and order form |
| `<<SecureNow-specific retention if different from platform template>>` | No SecureNow-only day count is fixed in repo docs. | Order form exhibit referencing this schedule |
| `<<order form or subscription id>>` | No approved customer order exists while beta is **NO_GO**. | Owner-approved private quote process in [`PRIVATE_PRICE_SHEET.md`](PRIVATE_PRICE_SHEET.md) — fees stay in that file only |

## Sources

- [`BUYER_SECURITY_ONE_PAGER.md`](BUYER_SECURITY_ONE_PAGER.md)
- [`CONTROLLED_PILOT_OFFER.md`](CONTROLLED_PILOT_OFFER.md)
- [`../go-to-market/DPA_TEMPLATE.md`](../go-to-market/DPA_TEMPLATE.md)
- [`../go-to-market/SUBPROCESSORS.md`](../go-to-market/SUBPROCESSORS.md)
- [`../architecture/adrs/0103-securenow-in-tenant-collection-agent.md`](../architecture/adrs/0103-securenow-in-tenant-collection-agent.md)
- [`../architecture/adrs/0104-securenow-in-tenant-deployment.md`](../architecture/adrs/0104-securenow-in-tenant-deployment.md)
