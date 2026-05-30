> **Scope:** ArchLucid — Tenant isolation (buyer overview) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — Tenant isolation (buyer overview)

**Audience:** Security reviewers who need a **short** explanation before diving into engineering docs.

**Last reviewed:** 2026-04-15

**Headline:** Your data is **logically isolated** at **identity**, **application**, and **database** layers when ArchLucid is deployed with the recommended Azure posture. This page summarizes; deep references are linked below.

**Healthcare / PHI:** ArchLucid is for **architecture and governance evidence** about systems you describe; **do not upload PHI** into product briefs or unstructured context fields. Posture and contractual questions (including BAA) are summarized under **[`docs/go-to-market/trust-center.md`](../go-to-market/trust-center.md)** (**Healthcare and PHI**); inquiries → **`sales@archlucid.net`**.

---

## 1. Three layers

```mermaid
flowchart TB
  subgraph L1["Layer 1 — Identity"]
    E[Microsoft Entra ID]
    R[App roles Admin Operator Reader Auditor]
    K[Optional API keys mapped to roles]
  end
  subgraph L2["Layer 2 — Application"]
    P[Authorization policies ArchLucidPolicies]
    S[Scope context tenant workspace project]
  end
  subgraph L3["Layer 3 — Database"]
    C[SESSION_CONTEXT af_tenant_id af_workspace_id af_project_id]
    Q[Row-level security on covered tables]
  end
  E --> P
  R --> P
  K --> P
  P --> S
  S --> C
  C --> Q
```

- **Layer 1 — Identity:** Prefer **Entra-issued JWTs** with **app roles**; API keys are server-side secrets mapped to **limited** roles ([../SECURITY.md](../library/SECURITY.md)).
- **Layer 2 — Application:** Controllers enforce **policies**; orchestration sets **tenant / workspace / project** scope before data access ([../security/MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md) §5).
- **Layer 3 — Database:** In `SystemWithPerTenantCatalogs` (production) mode the database boundary provides primary tenant isolation. **RLS** is available as optional configuration (`STATE = OFF` by default); it is not a required production control. Documentation: [../security/MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md).

---

## 2. Encryption

- **In transit:** TLS to the API; TLS to Azure services per Microsoft’s stack.
- **At rest:** Azure SQL (TDE) and blob encryption are standard Azure controls; see [../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md).
- **Secrets:** Prefer **Key Vault** references in hosted configs ([../CONFIGURATION_KEY_VAULT.md](../library/CONFIGURATION_KEY_VAULT.md)).

---

## 3. Network

Optional **Front Door + WAF**, optional **APIM**, and **private endpoints** for SQL and blob reduce exposure ([../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md)). **SMB (445)** is not used for tenant data at the API boundary (workspace security rule).

---

## 4. Audit and accountability

Durable **append-only** audit events and correlation IDs support forensic review ([../AUDIT_COVERAGE_MATRIX.md](../library/AUDIT_COVERAGE_MATRIX.md), [../SECURITY.md](../library/SECURITY.md)).

---

## 5. What we do not claim here

Hosted **trial** tenants and **commercial** pilots use ArchLucid's **single supported multitenant data-plane model**: **`SystemWithPerTenantCatalogs`** (**database-per-tenant** routing via **`TenantDatabaseBindings`** — one product catalog per tenant organization). `SingleCatalog` may exist only for narrow **developer/CI convenience** and is **not** the hosted SaaS posture; deep detail: **[`../library/TENANT_DATABASE_TOPOLOGY.md`](../library/TENANT_DATABASE_TOPOLOGY.md)**, **[`TRUST_CENTER.md`](TRUST_CENTER.md)** (*Data isolation*).

Unless separately contracted and documented:

- **Dedicated compute / silo SKU per tenant** — not implied for standard SaaS.
- **Customer-managed keys (BYOK)** — not stated; confirm in roadmap or security pack if offered.

Be explicit in sales and security packs to avoid over-claiming.

---

## 7. Verification pack (generated)

Generate a buyer-safe metadata pack (no tenant data, no secrets):

```bash
python scripts/generate_tenant_isolation_verification_pack.py
```

Outputs under `dist/tenant-isolation-verification-pack/`:

- `tenant-isolation-verification.json` — topology, layer summary, test inventory, redaction notes
- `tenant-isolation-verification.md` — human-readable mirror for procurement/support bundles

CI validates references with `--dry-run`.

---

## 6. Deep dives

| Doc | Content |
|-----|---------|
| [../security/MULTI_TENANT_RLS.md](../security/MULTI_TENANT_RLS.md) | RLS design, `SESSION_CONTEXT`, covered tables |
| [../security/SYSTEM_THREAT_MODEL.md](../security/SYSTEM_THREAT_MODEL.md) | STRIDE, trust boundaries |
| [../CUSTOMER_TRUST_AND_ACCESS.md](../library/CUSTOMER_TRUST_AND_ACCESS.md) | Edge, identity, private connectivity |
| [../SECURITY.md](../library/SECURITY.md) | RBAC, rate limiting, CI security tests, PII |

---

## Related documents

| Doc | Use |
|-----|-----|
| [TRUST_CENTER.md](TRUST_CENTER.md) | Trust index |
| [SUBPROCESSORS.md](SUBPROCESSORS.md) | Where data is processed (Azure) |
