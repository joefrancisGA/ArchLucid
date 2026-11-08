> **Scope:** Buyer security brief for a SecureNow controlled-pilot conversation. Not an approved customer offer. SecureNow beta remains **NO_GO**.

# SecureNow buyer security brief

**NOT AN APPROVED CUSTOMER OFFER.** SecureNow beta remains **NO_GO**.

**Audience:** Security reviewers, procurement champions, and sponsor sponsors evaluating whether to authorize a bounded SecureNow pilot conversation.

**Last reviewed:** 2026-10-29 (UTC)

## What SecureNow is for

SecureNow helps Azure security and architecture teams inspect **possible** permission and network combinations that could form an access path, cite the hops that support each path, suggest **advisory** cut points, and compare a **later** authorized capture when your organization chooses to collect one. A fixture or synthetic demonstration is not customer evidence.

## What is collected

SecureNow uses **tenant-authorized Azure Reader** inventory collection or an **approved upload** within a mutually agreed subscription scope. Partial or missing collection stays visible; the product does not imply a clean bill of health when evidence is incomplete. The in-tenant collection agent described in [ADR 0103](../architecture/adrs/0103-securenow-in-tenant-collection-agent.md) is an **accepted architecture decision**, not proof that your organization has deployed that agent in production.

## What SecureNow does not do

SecureNow does **not** change Azure. Your engineers apply changes **outside** SecureNow under your change-control process. The product does not perform autonomous remediation, does not confirm an **observed exploit**, and does not offer a breach-prevention warranty.

## How verification is labeled

A path recommendation is not closure. A **verified** label requires a later successful capture, correct chronology, completed analysis, and a substantive postcondition match. If any element is missing, the honest labels are **NOT VERIFIED** or insufficient evidence. Human attestation of an external change is separate from the advisory recommendation SecureNow records.

## Tenant scope and product entitlement

Production tenancy uses **database-per-tenant** isolation per [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md). Do not describe SQL row-level security as a deployed production control for this platform. An ArchLucid architecture-review subscription or Marketplace plan is **not** a SecureNow entitlement; SecureNow Marketplace publication remains **HOLD** per [MARKETPLACE_PREPUBLICATION_CONTRACT.md](MARKETPLACE_PREPUBLICATION_CONTRACT.md).

## Assurance

Platform SOC 2 posture is described honestly in [SOC2_STATUS_PROCUREMENT.md](../go-to-market/SOC2_STATUS_PROCUREMENT.md). This pack does **not** include a CPA-issued SOC 2 report. Do not treat this brief as SOC 2 certification. SecureNow does not claim a completed third-party penetration test in this repository.

## Support and price

Founder acknowledgement targets live in [SUPPORT_COMMITMENT.md](SUPPORT_COMMITMENT.md). Those targets are **not** a contractual SLA and **not** service credits. Owner-approved fee identifiers and payout identity live in [PRIVATE_PRICE_SHEET.md](PRIVATE_PRICE_SHEET.md); that sheet is **not** a public list price and **not** a customer offer. Fee amounts stay in the source sheet only.

## Where to read next

- [Procurement evidence index](PROCUREMENT_PACK_INDEX.md) — artifact inventory and buyer-safe status labels.
- [Controlled pilot proposal](CONTROLLED_PILOT_OFFER.md) — qualification, milestones, and objection responses (internal; not an approved offer).
- [Beta evidence gate](BETA_EVIDENCE_GATE.md) — offline release-evidence matrix; strict mode stays **NO_GO** until observed PASS provenance exists for all requirements.

Contact **security@archlucid.net** for security diligence routing. This page does not replace executed legal terms.
