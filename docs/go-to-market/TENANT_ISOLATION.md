> **Reviewed:** 2026-07-30

> **Scope:** Path-stable procurement-pack alias. Not an independent isolation statement.

# ArchLucid — Tenant isolation (buyer overview)

## Three layers {#three-layers}

ArchLucid isolates customer review data at three layers in the standard hosted posture:

- **Layer 1 — Identity:** Microsoft Entra ID (or your configured IdP) issues tokens with app roles; API keys map to limited roles when used.
- **Layer 2 — Application:** Authorization policies enforce tenant, workspace, and project scope before any data access.
- **Layer 3 — Database:** Each tenant organization receives a dedicated product SQL catalog. **SQL row-level security is not the production isolation boundary**; application code still applies scope predicates within the catalog.

For assurance questionnaires, isolation evidence, and diligence materials, see [Security and trust](/help/security-trust) and [Procurement FAQ](/help/procurement).
