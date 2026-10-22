> **Last reviewed:** 2026-07-31

# ArchLucid — Tenant isolation (buyer overview) — path-stable alias

**Canon (full body):** [`BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview`](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview)

This filename remains path-stable for procurement-pack ZIP / UI callers. The sections below are a buyer-safe excerpt for in-app help; prefer the buyer security packet section for full edits.

## Three layers {#three-layers}

ArchLucid enforces tenant isolation at **identity**, **application**, and **database** layers when deployed with the recommended Azure posture. **SQL row-level security is not the production isolation boundary** — dedicated per-tenant SQL catalogs plus application scope checks are the standard customer path. Database-per-tenant is the blast-radius control; request-time tenant binding and authorization-boundary tests sit above it. Full layered narrative: [`docs/library/customer-facing/DATA_HANDLING.md#isolation`](../library/customer-facing/DATA_HANDLING.md#isolation).

## Encryption {#encryption}

TLS protects traffic to the API and Azure services. SQL and blob storage use Azure-managed encryption at rest.

## Network {#network}

Optional Front Door, WAF, and private endpoints for SQL and blob reduce exposure for hosted deployments.

## Audit and accountability {#audit-and-accountability}

Append-only audit events and correlation identifiers support forensic review within your tenant.

## What we do not claim here {#what-we-do-not-claim-here}

Dedicated compute silo per tenant and customer-managed keys are not implied for standard SaaS unless separately contracted and documented.
