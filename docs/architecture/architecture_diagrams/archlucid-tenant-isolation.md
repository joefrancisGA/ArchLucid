> **Scope:** Zoom-in — Tenant isolation defense in depth (ADR 0037 — no SQL RLS).
> **Normative:** [`../../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md)

# ArchLucid — tenant isolation

Primary boundary is **database-per-tenant catalogs**. Workspace/project are organizational dimensions, not paying-client security boundaries. SQL RLS is **not** used in production.

![Tenant isolation](archlucid-tenant-isolation.svg)

Editable source: [`archlucid-tenant-isolation.mmd`](archlucid-tenant-isolation.mmd)

```mermaid
flowchart TB
  subgraph L1["Layer B — Identity and scope"]
    JWT["Entra JWT / API key claims"]
    SC["ScopeContext<br/>tenant · workspace · project"]
  end

  subgraph L2["Layer C — HTTP ingress"]
    RT["Route tenant binding filter"]
    IDOR["IDOR / scope integration tests"]
  end

  subgraph L3["Layer A — Catalog boundary primary"]
    RES["ITenantDatabaseResolver"]
    CAT[("Dedicated tenant SQL catalog<br/>SystemWithPerTenantCatalogs")]
  end

  subgraph L4["Layer D — Persistence"]
    REP["Scoped Dapper repositories"]
  end

  subgraph L5["Layer E — Blobs and aux"]
    BLOB["ArtifactBlobTenantPaths prefix"]
  end

  JWT --> SC
  SC --> RT
  RT --> REP
  SC --> RES --> CAT
  REP --> CAT
  REP --> BLOB
  IDOR -.-> RT
```
